import React from 'react';
import SauceLogo from '../../../images/sauce_logo.svg';
import styles from './SignIn.css';

const SignIn = ({ serverData, signInData }) => {
  const { password, username } = serverData;
  const { authenticate, handlePasswordChange, isSignedIn, isSignInError } =
    signInData;

  return (
    <div className={styles.signInMainContainer}>
      <div className={styles.signInContainer}>
        <img className={styles.logo} src={SauceLogo} />
        <div className={styles.header}>Sign In:</div>
        <form>
          <input
            className={styles.inputField}
            placeholder="Sauce Login Password"
            type="text"
            value={username}
            disabled
          />
          <input
            className={styles.inputField}
            placeholder="Sauce Login Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
          />
          <input
            type="submit"
            className={styles.button}
            onClick={() => authenticate({ username, password })}
            value="Start Session"
          />
        </form>
        {isSignInError && (
          <div className={styles.errorContainer}>
            <span>User name/password combination is invalid.</span>
          </div>
        )}
        <div className={styles.infoContainer}>
          <span>
            <strong>This solution is temporary.</strong>
          </span>
          <span>
            To be able to{' '}
            <strong>stream the video and interact with the device</strong> you
            need to login. You can use your username and password you normally
            use to login to Sauce Labs.
          </span>
          <span>
            Users that sign in through SSO and normally <strong>DON'T</strong>
            use username and password <strong>CAN'T</strong> stream the video
            and interact with the real device.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
