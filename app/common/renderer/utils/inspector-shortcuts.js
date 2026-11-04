/**
 * Handle an Inspector shortcut using its physical key code.
 */
export function handleInspectorShortcut(event, actions) {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.nativeEvent?.isComposing ||
    !event.ctrlKey ||
    !event.shiftKey ||
    event.altKey ||
    event.metaKey
  ) {
    return;
  }

  const action = Object.hasOwn(actions, event.code) && actions[event.code];
  if (typeof action !== 'function') {
    return;
  }

  event.preventDefault();
  action();
}
