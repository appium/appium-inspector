import {connect} from 'react-redux';

import * as SessionBuilderActions from '../actions/SessionBuilder.js';
import SessionBuilder from '../components/SessionBuilder/SessionBuilder.jsx';

function mapStateToProps(state) {
  return state.builder;
}

export default connect(mapStateToProps, SessionBuilderActions)(SessionBuilder);
