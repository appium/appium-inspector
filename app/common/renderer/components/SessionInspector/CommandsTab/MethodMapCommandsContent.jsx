import {Button, Col, Divider, Row, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

/**
 * Base container for a dynamically retrieved driver command button.
 */
const MethodMapBaseCommandButton = ({methodName, buttonStyle, startNamedCommand}) => (
  <Button className={buttonStyle} onClick={startNamedCommand}>
    <span className={inspectorStyles.monoFont}>{methodName}</span>
  </Button>
);

/**
 * Container for a deprecated dynamically retrieved driver command button.
 */
const MethodMapDeprecatedCommandButton = ({methodName, startNamedCommand}) => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t('methodDeprecated')} destroyOnHidden={true}>
      <MethodMapBaseCommandButton
        methodName={methodName}
        buttonStyle={`${styles.methodBtn} ${styles.deprecatedMethod}`}
        startNamedCommand={startNamedCommand}
      />
    </Tooltip>
  );
};

/**
 * Container for a dynamically retrieved driver command button with info.
 */
const MethodMapCommandButtonWithInfo = ({methodName, methodDetails, startNamedCommand}) => (
  <Tooltip title={methodDetails.info} destroyOnHidden={true}>
    <MethodMapBaseCommandButton
      methodName={methodName}
      buttonStyle={styles.methodBtn}
      startNamedCommand={startNamedCommand}
    />
  </Tooltip>
);

/**
 * Parent container for a dynamically retrieved driver command button.
 */
const MethodMapCommandButton = ({methodName, methodDetails, isExecute, startCommand}) => {
  const startNamedCommand = () =>
    startCommand({name: methodName, details: methodDetails, isExecute});

  return (
    <div className={styles.btnContainer}>
      {!methodDetails.deprecated && !methodDetails.info && (
        <MethodMapBaseCommandButton
          methodName={methodName}
          buttonStyle={styles.methodBtn}
          startNamedCommand={startNamedCommand}
        />
      )}
      {methodDetails.deprecated && (
        <MethodMapDeprecatedCommandButton
          methodName={methodName}
          startNamedCommand={startNamedCommand}
        />
      )}
      {methodDetails.info && (
        <MethodMapCommandButtonWithInfo
          methodName={methodName}
          methodDetails={methodDetails}
          startNamedCommand={startNamedCommand}
        />
      )}
    </div>
  );
};

/**
 * Dynamic list of driver commands, generated from the driver's method map responses.
 * Unlike StaticCommandsList, we cannot predict the contents of the method map response,
 * and we also want to be able to filter it, so just render all methods in a single grid.
 */
const MethodMapCommandsContent = ({driverMethods, isExecute, startCommand}) => {
  const {t} = useTranslation();

  return (
    <>
      {isExecute ? t('dynamicExecuteMethodsDescription') : t('dynamicCommandsDescription')}
      <Divider size="middle" />
      <div className={styles.methodMapGrid}>
        <Row>
          {driverMethods.map(([methodName, methodDetails]) => (
            <Col key={methodName} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
              <MethodMapCommandButton
                methodName={methodName}
                methodDetails={methodDetails}
                isExecute={isExecute}
                startCommand={startCommand}
              />
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
};

export default MethodMapCommandsContent;
