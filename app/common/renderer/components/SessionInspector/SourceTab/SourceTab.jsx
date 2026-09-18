import {Splitter} from 'antd';

import AppSource from './AppSource/AppSource.jsx';
import SelectedElement from './SelectedElement/SelectedElement.jsx';

// If the tab width is below this, wrap the selected element panel below the app source panel
const NARROW_LAYOUT_BREAKPOINT = 500;

const SourceTab = (props) => {
  const {tabWidth, selectedElement = {}} = props;

  const isNarrow = tabWidth < NARROW_LAYOUT_BREAKPOINT;

  const hasSelectedElement = Object.keys(selectedElement).length > 0;
  // We always want to show the collapsible icon, so a simple 'true' is not enough
  const isCollapsible = hasSelectedElement ? {start: true, end: true, showCollapsibleIcon: true} : false;

  return (
    <Splitter orientation={isNarrow ? 'vertical' : 'horizontal'}>
      <Splitter.Panel
        collapsible={isCollapsible}
        size={hasSelectedElement ? undefined : '100%'}
        min={isNarrow ? 200 : 210}
      >
        <AppSource {...props} />
      </Splitter.Panel>
      {hasSelectedElement && (
        <Splitter.Panel collapsible={isCollapsible} min={isNarrow ? 100 : 250}>
          <SelectedElement {...props} />
        </Splitter.Panel>
      )}
    </Splitter>
  );
};

export default SourceTab;
