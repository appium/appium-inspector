import { connect } from 'react-redux';
import { withTranslation } from '../util';
import * as SessionActions from '../actions/Session';
import Session from '../components/Session/Session';

function mapStateToProps (state) {
  return state.session;
}

export default withTranslation(Session, connect(mapStateToProps, SessionActions));
