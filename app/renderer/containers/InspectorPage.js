import { connect } from 'react-redux';
import { withTranslation } from '../util';
import * as InspectorActions from '../actions/Inspector';
import InspectorPage from '../components/Inspector/Inspector';

function mapStateToProps (state) {
  return state.inspector;
}

export default withTranslation(InspectorPage, connect(mapStateToProps, InspectorActions));
