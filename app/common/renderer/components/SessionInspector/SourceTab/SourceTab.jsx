import {Splitter} from 'antd';

import AppSource from './AppSource.jsx';
import SelectedElement from './SelectedElement.jsx';

const SourceTab = (props) => {
  const {selectedElement = {}} = props;

  const hasSelectedElement = Object.keys(selectedElement).length > 0;

  return (
    <Splitter>
      <Splitter.Panel
        collapsible={hasSelectedElement}
        size={hasSelectedElement ? undefined : 100}
        min={210}
      >
        <AppSource {...props} />
      </Splitter.Panel>
      {hasSelectedElement && (
        <Splitter.Panel collapsible={true} min={250}>
          <SelectedElement {...props} />
        </Splitter.Panel>
      )}
    </Splitter>
  );
};

export default SourceTab;
