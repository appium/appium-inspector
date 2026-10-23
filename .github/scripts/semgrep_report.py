#!/usr/bin/env python3
"""Semgrep helper for .github/workflows/semgrep-scan.yml.

Subcommands:
  scan            run one Semgrep scan and write its JSON output
  fetch-baseline  download the newest master baseline artifact
  pr-info         resolve an open PR's branches for a manual PR scan
  build-baseline  turn a master scan into semgrep-master.json
  compare         label PR findings OLD / NEW / FIXED / UNVERIFIED
  cleanup         keep only this run's baseline artifact; drop stale semgrep caches
                  and delete Semgrep Scan run logs older than 7 days

compare can also write an offline HTML dashboard of the PR results
(semgrep_dashboard.html filled with the scan data) via --dashboard.

Uses only the Python standard library so it runs inside the semgrep image.
"""

import argparse
import collections
import datetime
import hashlib
import io
import json
import os

# subprocess only runs fixed git/semgrep argument lists, never a shell.
import subprocess  # nosec B404
import sys
import time
import urllib.error
import urllib.request
import zipfile
from typing import Any, Dict, List, Optional, Set, Tuple

SCHEMA = 2
DEFAULT_RULESETS = "p/default p/owasp-top-ten p/secrets"
SEVERITIES = ("ERROR", "WARNING", "INFO")
MAX_LISTED = 200
MAX_ANNOTATIONS = 10
CACHE_MAX_AGE_DAYS = 7
LOG_MAX_AGE_DAYS = 7
LEVELS = ("Critical", "High", "Medium", "Low")
BLOCKING_LEVELS = ("Critical", "High", "Medium")
LABELS = ("NEW", "FIXED", "UNVERIFIED", "OLD")
LABEL_MEANING = {
    "NEW": "introduced by this PR",
    "FIXED": "on master, removed by this PR",
    "UNVERIFIED": "file also changed on master since the baseline; recheck after next baseline",
    "OLD": "already on master",
}

NO_BASELINE_MESSAGE = (
    "Master baseline artifact 'semgrep-master-results' is missing (not created yet or "
    "expired). All findings are shown as NEW for now. It is created by the 6-hourly cron "
    "or a manual run of the Semgrep Scan workflow on master; after that, PR scans show "
    "OLD / NEW / FIXED / UNVERIFIED."
)

Finding = Dict[str, Any]


def label_meaning(label: str, baseline: Optional[Dict[str, Any]]) -> str:
    if label == "NEW" and baseline is None:
        return "no master baseline yet, so not necessarily introduced by this PR"
    return LABEL_MEANING[label]


def rulesets() -> List[str]:
    return os.environ.get("SEMGREP_RULESETS", DEFAULT_RULESETS).split()


def now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def parse_time(value: str) -> datetime.datetime:
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


def git(*args: str) -> bytes:
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout  # nosec B603 B607


def set_output(name: str, value: Any) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write("%s=%s\n" % (name, value))


def write_summary(text: str) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)


def tree_blobs(rev: str) -> Dict[str, str]:
    """Map path -> blob sha for every file in the given revision."""
    blobs = {}
    for entry in git("ls-tree", "-r", "-z", rev).split(b"\0"):
        if not entry:
            continue
        meta, path = entry.split(b"\t", 1)
        blobs[path.decode("utf-8", "replace")] = meta.split()[2].decode()
    return blobs


def load_json(path: Optional[str]) -> Optional[Dict[str, Any]]:
    if not path:
        return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def severity_level(severity: str, impact: str = "") -> str:
    """Map a Semgrep severity to Critical / High / Medium / Low.

    Semgrep OSS reports ERROR / WARNING / INFO. ERROR rules whose metadata
    impact is HIGH are shown as Critical, other ERROR as High, WARNING as
    Medium and INFO as Low. Newer CRITICAL/HIGH/MEDIUM/LOW values map directly.
    """
    severity = (severity or "").upper()
    if severity == "ERROR":
        return "Critical" if (impact or "").upper() == "HIGH" else "High"
    direct = {"CRITICAL": "Critical", "HIGH": "High", "WARNING": "Medium", "MEDIUM": "Medium"}
    return direct.get(severity, "Low")


def level_of(f: Finding) -> str:
    return f.get("level") or severity_level(f.get("severity", ""), f.get("impact", ""))


def by_level(findings: List[Finding]) -> List[Finding]:
    return sorted(findings, key=lambda f: (LEVELS.index(level_of(f)), f["path"], f["line"] or 0))


def counts_by_level(findings: List[Finding]) -> Dict[str, int]:
    counts = collections.Counter(level_of(f) for f in findings)
    return {level: counts.get(level, 0) for level in LEVELS}


# --------------------------------------------------------------------------
# Fingerprints
#
# Semgrep OSS (logged out) returns "requires login" for extra.lines and
# extra.fingerprint, so the matched code is read from the checked-out file.
# The fingerprint is rule + path + matched code (whitespace removed), plus an
# occurrence counter, so it survives line shifts. Only the hash is stored.
# --------------------------------------------------------------------------


def _read_file(path: str) -> Optional[bytes]:
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError:
        return None


def normalize_findings(semgrep_json: Dict[str, Any]) -> List[Finding]:
    files: Dict[str, Optional[bytes]] = {}
    seen: collections.Counter = collections.Counter()
    findings = []
    results = sorted(
        semgrep_json.get("results", []),
        key=lambda r: (r["path"], r["start"].get("offset", 0), r["check_id"]),
    )
    for r in results:
        path = r["path"]
        if path not in files:
            files[path] = _read_file(path)
        data = files[path]
        start, end = r["start"].get("offset"), r["end"].get("offset")
        if data is not None and start is not None and end is not None:
            snippet = data[start:end].decode("utf-8", "replace")
        else:
            snippet = "line:%s" % r["start"].get("line")
        key = "\0".join((r["check_id"], path, "".join(snippet.split())))
        occurrence = seen[key]
        seen[key] += 1
        digest = hashlib.sha256(("%s\0%d" % (key, occurrence)).encode()).hexdigest()
        extra = r.get("extra", {})
        meta = extra.get("metadata", {}) or {}
        severity = extra.get("severity", "UNKNOWN")
        impact = str(meta.get("impact", "")).upper()
        findings.append(
            {
                "fp": "sha256:" + digest,
                "rule": r["check_id"],
                "severity": severity,
                "impact": impact,
                "level": severity_level(severity, impact),
                "path": path,
                "line": r["start"].get("line"),
                "end_line": r["end"].get("line"),
                "message": " ".join(str(extra.get("message", "")).split())[:500],
                "cwe": meta.get("cwe", []),
                "owasp": meta.get("owasp", []),
            }
        )
    return findings


# --------------------------------------------------------------------------
# scan
# --------------------------------------------------------------------------


def cmd_scan(args: argparse.Namespace) -> int:
    cmd = ["semgrep", "scan"]
    for config in rulesets():
        cmd += ["--config", config]
    for severity in SEVERITIES:
        cmd += ["--severity", severity]
    cmd += ["--metrics", "off", "--json-output", args.out]

    print("::group::Semgrep raw output")
    sys.stdout.flush()
    rc = subprocess.run(cmd, check=False).returncode  # nosec B603
    print("::endgroup::")
    if rc != 0:
        print("::warning::Semgrep exited with code %d. See the raw output group above." % rc)
    if not os.path.exists(args.out):
        print("::warning::Semgrep did not produce %s" % args.out)
    return 0


# --------------------------------------------------------------------------
# GitHub API (artifacts / caches)
# --------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):  # type: ignore[override]
        return None


def _https(url: str) -> str:
    if not url.startswith("https://"):
        raise ValueError("refusing non-https URL: %s" % url)
    return url


def _api_url(path: str) -> str:
    base = os.environ.get("GITHUB_API_URL", "https://api.github.com")
    return _https("%s/repos/%s%s" % (base, os.environ["GITHUB_REPOSITORY"], path))


def _auth_headers() -> Dict[str, str]:
    return {
        "Authorization": "Bearer %s" % os.environ["GITHUB_TOKEN"],
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def api(path: str, method: str = "GET") -> Any:
    req = urllib.request.Request(_api_url(path), method=method, headers=_auth_headers())
    # URL is always the https GitHub REST API for this repository.
    # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
    with urllib.request.urlopen(req, timeout=60) as resp:  # nosec B310
        body = resp.read()
    return json.loads(body) if body else None


def download_artifact(artifact_id: int) -> bytes:
    """Artifact zips redirect to signed storage URLs, which must be fetched
    without the GitHub Authorization header."""
    req = urllib.request.Request(
        _api_url("/actions/artifacts/%d/zip" % artifact_id), headers=_auth_headers()
    )
    opener = urllib.request.build_opener(_NoRedirect)
    location = ""
    try:
        with opener.open(req, timeout=60) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        if e.code not in (301, 302, 303, 307, 308):
            raise
        location = _https(e.headers["Location"])
    # location is the https signed storage URL GitHub returned for this artifact.
    # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
    with urllib.request.urlopen(location, timeout=120) as resp:  # nosec B310
        return resp.read()


def list_baseline_artifacts(name: str) -> List[Dict[str, Any]]:
    artifacts: List[Dict[str, Any]] = []
    for page in range(1, 6):
        data = api("/actions/artifacts?name=%s&per_page=100&page=%d" % (name, page))
        batch = data.get("artifacts", [])
        artifacts += batch
        if len(batch) < 100:
            break
    return sorted(artifacts, key=lambda a: a["created_at"], reverse=True)


BASELINE_EVENTS = ("schedule", "workflow_dispatch")


def _made_by_baseline_job(run_id: int) -> bool:
    """Only a cron or manual run of this workflow may produce the baseline."""
    run = api("/actions/runs/%d" % run_id) or {}
    workflow = os.environ.get("BASELINE_WORKFLOW", ".github/workflows/semgrep-scan.yml")
    return (
        run.get("event") in BASELINE_EVENTS and run.get("path", workflow).split("@")[0] == workflow
    )


def master_baseline_artifacts() -> List[Dict[str, Any]]:
    """Unexpired baseline artifacts made by a master cron/manual run, newest first."""
    name = os.environ.get("BASELINE_ARTIFACT", "semgrep-master-results")
    branch = os.environ.get("BASELINE_BRANCH", "master")
    accepted = []
    for a in list_baseline_artifacts(name):
        run = a.get("workflow_run") or {}
        if (
            not a.get("expired")
            and run.get("head_branch") == branch
            and run.get("id")
            and _made_by_baseline_job(run["id"])
        ):
            accepted.append(a)
    return accepted


def cmd_fetch_baseline(args: argparse.Namespace) -> int:
    branch = os.environ.get("BASELINE_BRANCH", "master")
    set_output("found", "false")
    try:
        artifacts = master_baseline_artifacts()
        if not artifacts:
            print("No baseline artifact from a %s cron/manual run found." % branch)
            return 0
        blob = download_artifact(artifacts[0]["id"])
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            with open(args.out, "wb") as f:
                f.write(z.read("semgrep-master.json"))
    # Never fail the job because the baseline is unavailable.
    except Exception as e:  # pylint: disable=broad-exception-caught
        print("::warning::Could not fetch master baseline: %s" % e)
        return 0

    baseline = load_json(args.out)
    if baseline is None:
        print("::warning::Downloaded baseline is not valid JSON.")
        os.remove(args.out)
        return 0
    set_output("found", "true")
    print(
        "Using baseline for %s@%s scanned at %s (artifact %d)."
        % (
            branch,
            baseline.get("master_sha", "?")[:12],
            baseline.get("scanned_at"),
            artifacts[0]["id"],
        )
    )
    return 0


# --------------------------------------------------------------------------
# dashboard
#
# semgrep_dashboard.html shows one PR scan's results (labels against the master
# baseline). The data is embedded so the file works offline; "<" is escaped so
# the JSON cannot close the script tag.
# --------------------------------------------------------------------------

DASHBOARD_TEMPLATE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "semgrep_dashboard.html"
)
DASHBOARD_PLACEHOLDER = "/*__SEMGREP_DATA__*/null"


def run_url() -> str:
    run_id = os.environ.get("GITHUB_RUN_ID")
    if not run_id:
        return ""
    return "%s/%s/actions/runs/%s" % (
        os.environ.get("GITHUB_SERVER_URL", "https://github.com"),
        os.environ.get("GITHUB_REPOSITORY", ""),
        run_id,
    )


def _as_list(value: Any) -> List[str]:
    if not value:
        return []
    return [str(v) for v in value] if isinstance(value, list) else [str(value)]


def _dashboard_finding(f: Finding, label: Optional[str], sha: str) -> Dict[str, Any]:
    return {
        "label": label,
        "level": level_of(f),
        "rule": f["rule"],
        "rule_short": f["rule"].rsplit(".", 1)[-1],
        "path": f["path"],
        "line": f["line"],
        "message": f["message"],
        "cwe": _as_list(f.get("cwe")),
        "sha": sha,
    }


def _dashboard_common(mode: str) -> Dict[str, Any]:
    return {
        "mode": mode,
        "repo": os.environ.get("GITHUB_REPOSITORY", ""),
        "server_url": os.environ.get("GITHUB_SERVER_URL", "https://github.com"),
        "run_url": run_url(),
        "generated_at": now().isoformat(timespec="seconds"),
        "rulesets": rulesets(),
    }


def write_dashboard(payload: Dict[str, Any], out: str) -> None:
    with open(DASHBOARD_TEMPLATE, encoding="utf-8") as f:
        html = f.read()
    if DASHBOARD_PLACEHOLDER not in html:
        raise ValueError("dashboard template has no data placeholder")
    data = json.dumps(payload, separators=(",", ":")).replace("<", "\\u003c")
    out_dir = os.path.dirname(out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html.replace(DASHBOARD_PLACEHOLDER, data, 1))
    print("Dashboard written to %s" % out)


def _pr_number() -> str:
    if os.environ.get("SEMGREP_PR_NUMBER"):  # manual PR scan (see pr-info)
        return os.environ["SEMGREP_PR_NUMBER"]
    parts = os.environ.get("GITHUB_REF", "").split("/")
    return parts[2] if len(parts) > 2 and parts[1] == "pull" else ""


def pr_dashboard(
    groups: Dict[str, List[Finding]],
    baseline: Optional[Dict[str, Any]],
    note: str,
    head_sha: str,
    semgrep_version: str,
) -> Dict[str, Any]:
    base = baseline or {}
    findings = []
    for label in LABELS:
        sha = base.get("master_sha", head_sha) if label == "FIXED" else head_sha
        findings += [_dashboard_finding(f, label, sha) for f in by_level(groups[label])]
    payload = _dashboard_common("pr")
    payload.update(
        {
            "semgrep_version": semgrep_version,
            "note": note,
            "pr": {
                "number": _pr_number(),
                "base_ref": os.environ.get("SEMGREP_BASE_REF")
                or os.environ.get("GITHUB_BASE_REF", ""),
                "head_ref": os.environ.get("SEMGREP_HEAD_REF")
                or os.environ.get("GITHUB_HEAD_REF", ""),
                "merge_sha": head_sha,
            },
            "baseline": {
                "found": baseline is not None,
                "branch": base.get("branch"),
                "sha": base.get("master_sha"),
                "scanned_at": base.get("scanned_at"),
                "run_url": base.get("run_url"),
            },
            "counts": counts_by_level(
                [f for label in LABELS if label != "FIXED" for f in groups[label]]
            ),
            "label_counts": {label: len(groups[label]) for label in LABELS},
            "label_meaning": {label: label_meaning(label, baseline) for label in LABELS},
            "matrix": [
                {
                    "level": level,
                    "counts": {label: counts[i] for i, label in enumerate(LABELS)},
                    "after": after,
                    "master": master,
                }
                for level, counts, after, master in _matrix(groups, baseline)
            ],
            "findings": findings,
        }
    )
    return payload


# --------------------------------------------------------------------------
# pr-info (manual PR scans)
# --------------------------------------------------------------------------


def cmd_pr_info(args: argparse.Namespace) -> int:
    """Check that the PR is open and export its number/branches for later steps."""
    number = str(args.number).strip()
    if not number.isdigit():
        print("::error::Manual PR scan needs a PR number (got %r)." % number)
        return 1
    try:
        pr = api("/pulls/%s" % number)
    except urllib.error.HTTPError as e:
        print("::error::Could not read PR #%s: %s" % (number, e))
        return 1
    if pr.get("state") != "open":
        print("::error::PR #%s is %s; only open PRs can be scanned." % (number, pr.get("state")))
        return 1
    env = {
        "SEMGREP_PR_NUMBER": number,
        "SEMGREP_BASE_REF": pr["base"]["ref"],
        "SEMGREP_HEAD_REF": pr["head"]["ref"],
    }
    path = os.environ.get("GITHUB_ENV")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.writelines("%s=%s\n" % kv for kv in env.items())
    print(
        "Manual scan of PR #%s (%s -> %s)"
        % (number, env["SEMGREP_HEAD_REF"], env["SEMGREP_BASE_REF"])
    )
    return 0


# --------------------------------------------------------------------------
# build-baseline
# --------------------------------------------------------------------------


def counts_table(counts: Dict[str, int]) -> str:
    if not counts:
        return "_No findings._"
    rows = ["| Level | Count |", "|---|---|"]
    rows += ["| %s | %d |" % (sev, n) for sev, n in counts.items()]
    return "\n".join(rows)


def cmd_build_baseline(args: argparse.Namespace) -> int:
    scan = load_json(args.results)
    if scan is None:
        print("::error::Semgrep results %s missing or invalid; baseline not built." % args.results)
        return 1
    findings = normalize_findings(scan)
    baseline = {
        "schema": SCHEMA,
        "repo": os.environ.get("GITHUB_REPOSITORY", ""),
        "branch": os.environ.get("BASELINE_BRANCH", "master"),
        "master_sha": git("rev-parse", "HEAD").decode().strip(),
        "master_commit_time": git("show", "-s", "--format=%cI", "HEAD").decode().strip(),
        "scanned_at": now().isoformat(timespec="seconds"),
        "semgrep_version": scan.get("version", ""),
        "rulesets": rulesets(),
        "severities": list(SEVERITIES),
        "counts": counts_by_level(findings),
        "total": len(findings),
        "scan_errors": len(scan.get("errors", [])),
        "run_url": run_url(),
        "files": tree_blobs("HEAD"),
        "findings": findings,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(baseline, f, indent=1)

    write_summary(
        "### Semgrep master baseline\n\n"
        "master `%s` &middot; scanned %s &middot; Semgrep %s\n\n%s\n\nTotal: **%d**\n"
        % (
            baseline["master_sha"][:12],
            baseline["scanned_at"],
            baseline["semgrep_version"],
            counts_table(baseline["counts"]),
            len(findings),
        )
    )
    print("Baseline: %d findings %s" % (len(findings), baseline["counts"]))
    return 0


# --------------------------------------------------------------------------
# compare
# --------------------------------------------------------------------------


def _changed_files(
    base_rev: str, head_rev: str, pr_findings: List[Finding], baseline: Dict[str, Any]
) -> Tuple[Set[str], Dict[str, str]]:
    """Files changed by the PR, and blob shas of the target branch."""
    try:
        diff = git("diff", "--name-only", "--no-renames", "-z", base_rev, head_rev)
        changed = {p.decode("utf-8", "replace") for p in diff.split(b"\0") if p}
        return changed, tree_blobs(base_rev)
    except subprocess.CalledProcessError as e:
        print(
            "::warning::Could not diff %s..%s (%s); comparing all files against baseline."
            % (base_rev, head_rev, e)
        )
        changed = {f["path"] for f in pr_findings} | {f["path"] for f in baseline["findings"]}
        return changed, baseline.get("files", {})


def label_findings(
    pr_findings: List[Finding], baseline: Optional[Dict[str, Any]], base_rev: str, head_rev: str
) -> Tuple[Dict[str, str], List[Finding], str]:
    """Return (labels: fp -> label, fixed baseline findings, note)."""
    if baseline is None:
        # Until the first master baseline exists, every finding is treated as NEW.
        labels = {f["fp"]: "NEW" for f in pr_findings}
        return labels, [], NO_BASELINE_MESSAGE

    changed, base_blobs = _changed_files(base_rev, head_rev, pr_findings, baseline)
    same_config = baseline.get("rulesets") == rulesets() and baseline.get("severities") == list(
        SEVERITIES
    )
    baseline_files = baseline.get("files", {})
    base_by_path: Dict[str, List[Finding]] = collections.defaultdict(list)
    for b in baseline["findings"]:
        base_by_path[b["path"]].append(b)

    # A changed file can only be compared if its target-branch version is the
    # one the baseline scanned.
    verified = {
        path for path in changed if same_config and baseline_files.get(path) == base_blobs.get(path)
    }

    labels = {}
    for f in pr_findings:
        if f["path"] not in changed:
            labels[f["fp"]] = "OLD"
        elif f["path"] not in verified:
            labels[f["fp"]] = "UNVERIFIED"
        else:
            base_fps = {b["fp"] for b in base_by_path.get(f["path"], [])}
            labels[f["fp"]] = "OLD" if f["fp"] in base_fps else "NEW"

    pr_fps = {f["fp"] for f in pr_findings}
    fixed: List[Finding] = []
    for path in sorted(verified):
        fixed += [b for b in base_by_path.get(path, []) if b["fp"] not in pr_fps]

    note = ""
    if not same_config:
        note = (
            "Baseline was built with different rulesets or severities; "
            "changed files are UNVERIFIED."
        )
    return labels, fixed, note


def _md(text: Any) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ")


def _annotation(text: str) -> str:
    return text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def _matrix(
    groups: Dict[str, List[Finding]], baseline: Optional[Dict[str, Any]]
) -> List[Tuple[str, List[int], int, Any]]:
    """Rows of (level, [count per label], after-merge count, master count)."""
    per_label = {label: counts_by_level(groups[label]) for label in LABELS}
    master = (baseline or {}).get("counts", {})
    rows = []
    for level in LEVELS + ("Total",):
        if level == "Total":
            counts = [len(groups[label]) for label in LABELS]
            master_n: Any = sum(master.values()) if baseline else "-"
        else:
            counts = [per_label[label][level] for label in LABELS]
            master_n = master.get(level, 0) if baseline else "-"
        # Everything except FIXED is present after the merge.
        after = sum(counts) - counts[LABELS.index("FIXED")]
        rows.append((level, counts, after, master_n))
    return rows


def _print_log(
    groups: Dict[str, List[Finding]],
    baseline: Optional[Dict[str, Any]],
    note: str,
) -> None:
    print("=" * 78)
    print("Semgrep results (state after merge)")
    if baseline:
        print(
            "Baseline: %s %s scanned %s"
            % (
                baseline.get("branch"),
                baseline.get("master_sha", "")[:12],
                baseline.get("scanned_at"),
            )
        )
    if note:
        print("Note: " + note)
    print("")
    header = "%-9s" + " %10s" * len(LABELS) + " | %11s %8s"
    print(header % (("Level",) + LABELS + ("After merge", "Master")))
    for level, counts, after, master_n in _matrix(groups, baseline):
        print(header % ((level,) + tuple(counts) + (after, master_n)))
    print("=" * 78)

    for label in LABELS:
        items = by_level(groups[label])
        if not items:
            continue
        title = "%s (%d) - %s" % (label, len(items), label_meaning(label, baseline))
        print("::group::" + title if label == "OLD" else "-- " + title)
        for f in items:
            print(
                "%-10s %-8s %s:%s  %s\n           %s"
                % (
                    label,
                    level_of(f),
                    f["path"],
                    f["line"],
                    f["rule"].rsplit(".", 1)[-1],
                    f["message"][:200],
                )
            )
        if label == "OLD":
            print("::endgroup::")

    for f in by_level(groups["NEW"])[:MAX_ANNOTATIONS]:
        print(
            "::warning file=%s,line=%s,title=Semgrep NEW %s::%s"
            % (f["path"], f["line"], level_of(f), _annotation(f["rule"] + ": " + f["message"]))
        )


def _link(f: Finding, sha: str) -> str:
    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if not repo or not sha:
        return "`%s:%s`" % (f["path"], f["line"])
    return "[`%s:%s`](%s/%s/blob/%s/%s#L%s)" % (
        f["path"],
        f["line"],
        server,
        repo,
        sha,
        f["path"],
        f["line"],
    )


def _summary(
    groups: Dict[str, List[Finding]],
    baseline: Optional[Dict[str, Any]],
    note: str,
    head_sha: str,
) -> str:
    base_sha = (baseline or {}).get("master_sha", "")
    out = ["### Semgrep results (report only, merge not blocked)\n"]
    if baseline:
        out.append(
            "Baseline: `%s` @ `%s`, scanned %s\n"
            % (baseline.get("branch"), base_sha[:12], baseline.get("scanned_at"))
        )
    if baseline is None:
        out.append("> :warning: **Master baseline missing.** %s\n" % NO_BASELINE_MESSAGE)
    elif note:
        out.append("> %s\n" % note)

    out.append("| Level | " + " | ".join(LABELS) + " | After merge | Master |")
    out.append("|---" * (len(LABELS) + 3) + "|")
    for level, counts, after, master_n in _matrix(groups, baseline):
        cells = [str(n) for n in counts] + [str(after), str(master_n)]
        if level == "Total":
            cells = ["**%s**" % c for c in cells]
            level = "**Total**"
        out.append("| %s | %s |" % (level, " | ".join(cells)))
    out.append("")
    out.append(
        "_"
        + " &middot; ".join("**%s**: %s" % (lbl, label_meaning(lbl, baseline)) for lbl in LABELS)
        + "_\n"
    )

    for label, sha in (("NEW", head_sha), ("FIXED", base_sha), ("UNVERIFIED", head_sha)):
        items = by_level(groups[label])
        if not items:
            continue
        out.append("#### %s (%d)\n" % (label, len(items)))
        out.append("| Level | Rule | Location | Message |\n|---|---|---|---|")
        for f in items[:MAX_LISTED]:
            out.append(
                "| %s | `%s` | %s | %s |"
                % (
                    level_of(f),
                    f["rule"].rsplit(".", 1)[-1],
                    _link(f, sha),
                    _md(f["message"][:160]),
                )
            )
        if len(items) > MAX_LISTED:
            out.append("\n_Showing first %d; full list in the job log._" % MAX_LISTED)
        out.append("")
    out.append("_OLD findings (%d) are listed in the job log._\n" % len(groups["OLD"]))
    return "\n".join(out)


def cmd_compare(args: argparse.Namespace) -> int:
    scan = load_json(args.results)
    if scan is None:
        write_summary("### Semgrep\n\nScan did not produce results. See the job log.\n")
        print("::warning::No Semgrep results to compare.")
        return 0

    pr_findings = normalize_findings(scan)
    baseline = load_json(args.baseline)
    labels, fixed, note = label_findings(pr_findings, baseline, args.base_rev, args.head_rev)

    groups: Dict[str, List[Finding]] = collections.defaultdict(list)
    for f in pr_findings:
        groups[labels[f["fp"]]].append(f)
    groups["FIXED"] = fixed

    if baseline is None:
        print("::warning title=Semgrep master baseline missing::%s" % NO_BASELINE_MESSAGE)
    _print_log(groups, baseline, note)
    head_sha = git("rev-parse", args.head_rev).decode().strip()
    write_summary(_summary(groups, baseline, note, head_sha))
    if args.dashboard:
        payload = pr_dashboard(groups, baseline, note, head_sha, scan.get("version", ""))
        write_dashboard(payload, args.dashboard)

    new_counts = counts_by_level(groups["NEW"])
    blocking = sum(new_counts[level] for level in BLOCKING_LEVELS)
    set_output("new", len(groups["NEW"]))
    set_output("new_blocking", blocking)
    breakdown = ", ".join("%s %d" % kv for kv in new_counts.items() if kv[1])
    if groups["NEW"] and baseline is None:
        print(
            "::warning::Semgrep: %d finding(s) shown as NEW because the master baseline is "
            "missing (%s). Not blocking merge." % (len(groups["NEW"]), breakdown)
        )
    elif groups["NEW"]:
        print(
            "::warning::Semgrep: %d new finding(s) introduced by this PR (%s). "
            "Not blocking merge yet." % (len(groups["NEW"]), breakdown)
        )
    # Never block on a missing baseline: those NEW labels are not from this PR.
    enforce = os.environ.get("SEMGREP_ENFORCE", "false").lower() == "true"
    if enforce and blocking and baseline is not None:
        return 1
    return 0


# --------------------------------------------------------------------------
# cleanup
# --------------------------------------------------------------------------


def _this_run_artifact(name: str, run_id: int) -> Optional[Dict[str, Any]]:
    """The baseline artifact uploaded by this run (listing can lag briefly)."""
    for attempt in range(3):
        for a in list_baseline_artifacts(name):
            if (a.get("workflow_run") or {}).get("id") == run_id and not a.get("expired"):
                return a
        if attempt < 2:
            time.sleep(5)
    return None


def _keep_single_artifact(run_id: int) -> int:
    """Keep exactly one baseline artifact per repo: the one from this run.

    Artifacts cannot be overwritten across runs, so the new one is uploaded
    first and every other copy is deleted afterwards. If this run's artifact
    is not found, nothing is deleted so the previous baseline survives.
    """
    name = os.environ.get("BASELINE_ARTIFACT", "semgrep-master-results")
    current = _this_run_artifact(name, run_id)
    if current is None:
        print("::error::Baseline artifact from run %d not found; kept existing copies." % run_id)
        return 1
    failed = 0
    for a in list_baseline_artifacts(name):
        if a["id"] == current["id"] or a.get("expired"):
            continue
        try:
            api("/actions/artifacts/%d" % a["id"], method="DELETE")
            print("Deleted previous baseline artifact %d (%s)" % (a["id"], a["created_at"]))
        except urllib.error.HTTPError as e:
            if e.code == 404:  # already gone
                continue
            print("::error::Could not delete baseline artifact %d: %s" % (a["id"], e))
            failed += 1
    print("Baseline artifact now: %d (run %d)" % (current["id"], run_id))
    return 1 if failed else 0


def _drop_stale_caches() -> None:
    cutoff = now() - datetime.timedelta(days=CACHE_MAX_AGE_DAYS)
    try:
        caches = api("/actions/caches?key=semgrep-&per_page=100").get("actions_caches", [])
        for c in caches:
            if parse_time(c["last_accessed_at"]) < cutoff:
                api("/actions/caches/%d" % c["id"], method="DELETE")
                print("Deleted cache %s (last used %s)" % (c["key"], c["last_accessed_at"]))
    except Exception as e:  # pylint: disable=broad-exception-caught
        print("::warning::Cache cleanup failed: %s" % e)


def _drop_old_logs() -> None:
    """Delete logs of this workflow's runs older than LOG_MAX_AGE_DAYS.

    Only the logs are removed; the runs and their artifacts (including the
    master baseline) stay. Other workflows' runs are not touched.
    """
    workflow = os.path.basename(
        os.environ.get("BASELINE_WORKFLOW", ".github/workflows/semgrep-scan.yml")
    )
    cutoff = (now() - datetime.timedelta(days=LOG_MAX_AGE_DAYS)).date().isoformat()
    deleted = 0
    try:
        for page in range(1, 11):
            data = api(
                "/actions/workflows/%s/runs?status=completed&created=<%s&per_page=100&page=%d"
                % (workflow, cutoff, page)
            )
            runs = data.get("workflow_runs", [])
            for run in runs:
                try:
                    api("/actions/runs/%d/logs" % run["id"], method="DELETE")
                    deleted += 1
                except urllib.error.HTTPError as e:
                    if e.code not in (404, 410):  # logs already gone
                        raise
            if len(runs) < 100:
                break
        print("Deleted logs of %d Semgrep Scan run(s) created before %s" % (deleted, cutoff))
    except Exception as e:  # pylint: disable=broad-exception-caught
        print("::warning::Log cleanup failed: %s" % e)


def cmd_cleanup(args: argparse.Namespace) -> int:
    try:
        rc = _keep_single_artifact(args.keep_run_id)
    except Exception as e:  # pylint: disable=broad-exception-caught
        print("::error::Artifact cleanup failed: %s" % e)
        rc = 1
    _drop_stale_caches()
    _drop_old_logs()
    return rc


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("scan")
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_scan)

    p = sub.add_parser("fetch-baseline")
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_fetch_baseline)

    p = sub.add_parser("pr-info")
    p.add_argument("--number", required=True)
    p.set_defaults(func=cmd_pr_info)

    p = sub.add_parser("build-baseline")
    p.add_argument("--results", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_build_baseline)

    p = sub.add_parser("compare")
    p.add_argument("--results", required=True)
    p.add_argument("--baseline")
    p.add_argument("--base-rev", default="HEAD^1")
    p.add_argument("--head-rev", default="HEAD")
    p.add_argument("--dashboard", help="also write the PR HTML dashboard here")
    p.set_defaults(func=cmd_compare)

    p = sub.add_parser("cleanup")
    p.add_argument(
        "--keep-run-id", type=int, required=True, help="workflow run whose artifact to keep"
    )
    p.set_defaults(func=cmd_cleanup)

    args = parser.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
