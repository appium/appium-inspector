import {connect} from 'react-redux';

import * as SessionBuilderActions from '../actions/SessionBuilder.js';
import SessionBuilder from '../components/SessionBuilder/SessionBuilder.jsx';
import {withTranslation} from '../i18next.js';

function mapStateToProps(state) {
  return state.builder;
}

export default withTranslation(SessionBuilder, connect(mapStateToProps, SessionBuilderActions));
