import AppSourceCard from './AppSourceCard.jsx';
import AppSourceTreeWrapper from './AppSourceTreeWrapper.jsx';

/**
 * Shows the app source as a tree with search and attribute toggles.
 */
const AppSource = (props) => {
  const {sourceXML, collapsible, collapsed, onToggleCollapse} = props;

  return (
    <AppSourceCard
      sourceXML={sourceXML}
      collapsible={collapsible}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      <AppSourceTreeWrapper {...props} />
    </AppSourceCard>
  );
};

export default AppSource;
