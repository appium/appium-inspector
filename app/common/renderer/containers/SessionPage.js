import {connect} from 'react-redux';

import * as SessionActions from '../actions/Session';
import Session from '../components/Session/Session.jsx';
import {withTranslation} from '../i18next';

function mapStateToProps(state) {
  return state.session;
}

export default withTranslation(Session, connect(mapStateToProps, SessionActions));
