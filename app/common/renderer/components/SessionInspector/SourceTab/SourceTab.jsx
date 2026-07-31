import {Splitter} from 'antd';
import {useEffect, useRef, useState} from 'react';

import AppSource from './AppSource/AppSource.jsx';
import SelectedElement from './SelectedElement/SelectedElement.jsx';
import styles from './SourceTab.module.css';

// Below this width, the selected element panel no longer has enough room to
// sit beside the app source panel, so it wraps below it instead. Measured
// against this tab's own container width (not the window's), since the tab
// shares horizontal space with the screenshot, whose width can vary
// independently (e.g. portrait vs landscape orientation).
const NARROW_LAYOUT_BREAKPOINT = 600;

// Height of a card's header row (title + action buttons). Used as the
// collapsed size for a stacked panel, so its header stays visible while its
// body is hidden and the other panel gets the freed space.
const PANEL_HEADER_HEIGHT = 55;

const SourceTab = (props) => {
  const {selectedElement = {}} = props;

  const hasSelectedElement = Object.keys(selectedElement).length > 0;

  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [appSourceCollapsed, setAppSourceCollapsed] = useState(false);
  const [selectedElementCollapsed, setSelectedElementCollapsed] = useState(false);

  // Splitter can't shrink both panels to their collapsed size at once (with
  // neither panel left to absorb the freed space, it resets both back to
  // their default size) - so collapsing one always re-expands the other,
  // keeping exactly one panel expanded at a time.
  const toggleAppSourceCollapse = () => {
    setAppSourceCollapsed((collapsed) => {
      const next = !collapsed;
      if (next) {
        setSelectedElementCollapsed(false);
      }
      return next;
    });
  };
  const toggleSelectedElementCollapse = () => {
    setSelectedElementCollapsed((collapsed) => {
      const next = !collapsed;
      if (next) {
        setAppSourceCollapsed(false);
      }
      return next;
    });
  };

  // Accordion-style collapse (header stays, body hides, other panel grows
  // into the freed space) only makes sense when panels are stacked and both
  // are present - otherwise fall back to the Splitter's own full collapse.
  const canAccordionCollapse = isNarrow && hasSelectedElement;

  // Splitter's own collapse (via the divider) fully hides a panel, header
  // included, which only makes sense side-by-side with both panels present.
  const splitterCollapsible =
    !isNarrow && hasSelectedElement ? {start: true, end: true, showCollapsibleIcon: true} : false;

  // Shared size/min for a panel that supports the accordion-style collapse:
  // shrink to just its header height when collapsed, otherwise fall back to
  // its own default size/min.
  const getPanelSizing = (collapsed, defaultSize, defaultMin) => ({
    size: canAccordionCollapse && collapsed ? PANEL_HEADER_HEIGHT : defaultSize,
    min: canAccordionCollapse && collapsed ? PANEL_HEADER_HEIGHT : defaultMin,
  });

  const appSourceSizing = getPanelSizing(
    appSourceCollapsed,
    hasSelectedElement ? undefined : 100,
    210,
  );
  const selectedElementSizing = getPanelSizing(selectedElementCollapsed, undefined, 250);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    // Deliberately not debounced: Splitter measures its container via its
    // own ResizeObserver, which can fire before a debounced update here
    // would land. If that happens while this is still reporting the old
    // orientation, Splitter reads the wrong axis (width vs height) and
    // caches a stale container size, leaving panels stuck at the wrong
    // size until another resize happens to nudge it again.
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < NARROW_LAYOUT_BREAKPOINT);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.sourceTabContainer}>
      <Splitter orientation={isNarrow ? 'vertical' : 'horizontal'}>
        <Splitter.Panel
          collapsible={splitterCollapsible}
          size={appSourceSizing.size}
          min={appSourceSizing.min}
        >
          <AppSource
            {...props}
            collapsible={canAccordionCollapse}
            collapsed={canAccordionCollapse && appSourceCollapsed}
            onToggleCollapse={toggleAppSourceCollapse}
          />
        </Splitter.Panel>
        {hasSelectedElement && (
          <Splitter.Panel
            collapsible={splitterCollapsible}
            size={selectedElementSizing.size}
            min={selectedElementSizing.min}
          >
            <SelectedElement
              {...props}
              collapsible={canAccordionCollapse}
              collapsed={canAccordionCollapse && selectedElementCollapsed}
              onToggleCollapse={toggleSelectedElementCollapse}
            />
          </Splitter.Panel>
        )}
      </Splitter>
    </div>
  );
};

export default SourceTab;
