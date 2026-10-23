# Embedded Mode

Embedded mode lets a trusted host application display the Inspector while retaining ownership of an
existing Appium session. The Inspector attaches with WebdriverIO's `attachToSession` API and never
deletes an externally owned session.

## Build and Host

Run `npm run build:browser`. The embeddable entry point is `dist-browser/embedded.html`; serve the
entire `dist-browser` directory over HTTP(S). The Appium server must allow requests from the
Inspector bundle's origin.

Load the entry point in an iframe in the Electron renderer with Node integration disabled. By
default, the parent and Inspector must have the same origin. For a cross-origin deployment, bake
the one trusted parent origin into the bundle:

```sh
VITE_EMBEDDED_HOST_ORIGIN=app://visual-recorder npm run build:browser
```

Session details and trusted origins are never accepted from URL parameters. Opaque Inspector
origins are rejected; serve the bundle from an HTTP(S) or registered Electron custom-scheme origin.

## Host Handshake

All messages use channel `appium-inspector:embedded` and protocol version `3`. The Inspector accepts
messages only from its parent window and the configured exact origin.

Wait for `appium-inspector:ready`, then send:

```js
inspectorFrame.contentWindow.postMessage(
  {
    channel: 'appium-inspector:embedded',
    version: 3,
    type: 'appium-inspector:connect',
    payload: {
      serverUrl: 'http://127.0.0.1:4723',
      sessionId: recorderSessionId,
      capabilities: recorderCapabilities,
      platform: 'Android',
    },
  },
  inspectorOrigin,
);
```

The Inspector responds with `appium-inspector:connected` or `appium-inspector:error`. Selecting an
element only updates Inspector-local state. When the user explicitly presses **Usar en Recorder**,
the Inspector verifies the locator currently shown in the controls and its existing Inspector-generated
alternatives against the attached Appium session. The primary locator must return exactly the selected
WebDriver element; invalid alternatives are omitted. It then emits one `appium-inspector:element-used`
message:

```ts
interface ElementUsedPayload {
  strategy: string;
  selector: string;
  elementId?: string;
  tag?: string;
  attributes: Record<string, string>;
  candidates: Array<{
    candidateId: string;
    strategy: string;
    selector: string;
    priority: number;
    stability: 'stable' | 'contextual' | 'structural' | 'manual';
    sourceReason: string;
    matchCount: 1;
    sameElement: true;
  }>;
  screenshot?: string;
  source?: string;
}
```

`candidates[0]` is always the current manually editable primary locator. Candidate verification uses
Appium's `findElements` endpoint sequentially, requires exactly one result with the selected WebDriver
element ID, deduplicates normalized strategy/value pairs, and preserves deterministic stability and
priority order. At most 50 verified candidates are sent as a defensive limit. Candidate objects are
strict and never contain screenshots, XML/source excerpts, attribute dumps, capabilities, or
credentials. The optional top-level `screenshot` and `source` fields remain only for existing UI
compatibility.

The complete typed protocol is exported from
`app/common/renderer/embedded/protocol.ts`. Hosts should validate the Inspector message source,
origin, channel, version, and type before consuming a payload.


## Element explorer analysis extension

Protocol version 3 also supports the optional host-assisted element explorer:

- `appium-inspector:analyze-elements`: requestId, snapshotId, sessionId,
  platform, native context, sourceXml, the complete pre-order node catalog and
  a required targetNodeId (the root uses an empty string).
- `appium-inspector:cancel-element-analysis`: requestId and snapshotId.
- `appium-inspector:element-analysis-update`: correlated status, phase,
  processed/total counts and validated node recommendations. An early update
  may provide locatorContracts (nodeId, candidateId, TypeLocator/value,
  compatibility) resolved by the host's framework adapter.

The iframe validates the origin, parent window, IDs and candidate references.
The host validates the active session and XML before sending evidence to its
provider. The QA selects a node and opens the explorer to start analysis for that
target. Changing the selection invalidates and cancels the current request; the QA
must reopen the explorer for the new selection. Only targetNodeId receives a result,
while the sanitized tree provides context. The agent can rank existing
candidates and propose XPath expressions. The host accepts proposals only if
they select exactly the target XML element, computes their framework contracts
and returns them in results[].proposals. Invalid proposals have actionable
warnings. The agent cannot certify live device identity.
Closing, refreshing, changing the selection or switching snapshots cancels the
outstanding analysis. Updates must match the active target and request IDs.
Provider failure retains the local catalog for manual verification.

Using a candidate resolves the node's independent structural XPath, requires
one candidate match with the same WebDriver element ID, and resolves the
reference again before transfer. The ordinary version 3 ELEMENT_USED payload
and the host's final identity/round-trip checks still apply. No analysis output
is persisted in a recording.
