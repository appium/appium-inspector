export function shouldTerminateSession({isSessionExternallyOwned, detachOnly}) {
  return !isSessionExternallyOwned && !detachOnly;
}
