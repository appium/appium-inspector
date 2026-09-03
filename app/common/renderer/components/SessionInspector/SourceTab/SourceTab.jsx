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

const SourceTab = (props) => {
  const {selectedElement = {}} = props;

  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);

  const hasSelectedElement = Object.keys(selectedElement).length > 0;
  // We always want to show the collapsible icon, so a simple 'true' is not enough
  const isCollapsible = hasSelectedElement ? {start: true, end: true, showCollapsibleIcon: true} : false;

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
      setIsNarrow(entry.contentRect.width > 0 && entry.contentRect.width < NARROW_LAYOUT_BREAKPOINT);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.sourceTabContainer}>
      <Splitter orientation={isNarrow ? 'vertical' : 'horizontal'}>
        <Splitter.Panel
          collapsible={isCollapsible}
          size={hasSelectedElement ? undefined : '100%'}
          min={isNarrow ? 170 : 210}
        >
          <AppSource {...props} />
        </Splitter.Panel>
        {hasSelectedElement && (
          <Splitter.Panel collapsible={isCollapsible} min={isNarrow ? 160 : 250}>
            <SelectedElement {...props} />
          </Splitter.Panel>
        )}
      </Splitter>
    </div>
  );
};

export default SourceTab;
