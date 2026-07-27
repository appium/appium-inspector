import {Splitter} from 'antd';
import {useEffect, useState} from 'react';

import {debounce} from '../../../utils/common.js';
import AppSource from './AppSource/AppSource.jsx';
import SelectedElement from './SelectedElement/SelectedElement.jsx';

// Below this window width, the selected element panel no longer has enough
// room to sit beside the app source panel, so it wraps below it instead.
const NARROW_LAYOUT_BREAKPOINT = 700;

// Height of a card's header row (title + action buttons). Used as the
// collapsed size for a stacked panel, so its header stays visible while its
// body is hidden and the other panel gets the freed space.
const PANEL_HEADER_HEIGHT = 55;

const SourceTab = (props) => {
  const {selectedElement = {}} = props;

  const hasSelectedElement = Object.keys(selectedElement).length > 0;

  const [isNarrow, setIsNarrow] = useState(window.innerWidth < NARROW_LAYOUT_BREAKPOINT);
  useEffect(() => {
    const updateIsNarrow = debounce(
      () => setIsNarrow(window.innerWidth < NARROW_LAYOUT_BREAKPOINT),
      100,
    );
    window.addEventListener('resize', updateIsNarrow);
    return () => {
      window.removeEventListener('resize', updateIsNarrow);
      updateIsNarrow.cancel();
    };
  }, []);

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

  return (
    // Remounting on orientation change avoids Splitter retaining stale panel
    // sizes/state from the previous layout when switching back and forth.
    <Splitter
      key={isNarrow ? 'vertical' : 'horizontal'}
      layout={isNarrow ? 'vertical' : 'horizontal'}
    >
      <Splitter.Panel
        collapsible={
          !isNarrow && hasSelectedElement
            ? {start: true, end: true, showCollapsibleIcon: true}
            : false
        }
        size={
          canAccordionCollapse && appSourceCollapsed
            ? PANEL_HEADER_HEIGHT
            : hasSelectedElement
              ? undefined
              : 100
        }
        min={canAccordionCollapse && appSourceCollapsed ? PANEL_HEADER_HEIGHT : 210}
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
          collapsible={!isNarrow ? {start: true, end: true, showCollapsibleIcon: true} : false}
          size={canAccordionCollapse && selectedElementCollapsed ? PANEL_HEADER_HEIGHT : undefined}
          min={canAccordionCollapse && selectedElementCollapsed ? PANEL_HEADER_HEIGHT : 250}
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
  );
};

export default SourceTab;
