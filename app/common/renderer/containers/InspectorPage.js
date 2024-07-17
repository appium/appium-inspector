import {connect} from 'react-redux';

import * as InspectorActions from '../actions/Inspector';
import InspectorPage from '../components/Inspector/Inspector.jsx';
import {withTranslation} from '../i18next';

function mapStateToProps(state) {
  return state.inspector;
}

export default withTranslation(InspectorPage, connect(mapStateToProps, InspectorActions));
