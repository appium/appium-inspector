const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"], [role="spinbutton"]';

/**
 * Register session-only shortcuts. Use physical key codes so Option-modified
 * characters on macOS do not change the shortcut being requested.
 * Returns a cleanup function for the component's effect.
 */
export function registerInspectorShortcuts(target, actions) {
  const handleKeyDown = (event) => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      !event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target?.closest?.(EDITABLE_SELECTOR)
    ) {
      return;
    }

    const action = Object.hasOwn(actions, event.code) && actions[event.code];
    if (typeof action !== 'function') {
      return;
    }

    // Portals can put dialogs and menus outside the Inspector component.
    const overlays = target.querySelectorAll?.(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
    );
    if (overlays && [...overlays].some((overlay) => overlay.getClientRects().length > 0)) {
      return;
    }

    event.preventDefault();
    action();
  };

  target.addEventListener('keydown', handleKeyDown);
  return () => target.removeEventListener('keydown', handleKeyDown);
}
