import {CLIENT_FRAMEWORKS} from '../../constants/session-inspector.js';
import DotNetNUnitFramework from './dotnet-nunit.js';
import JavaJUnit4Framework from './java-junit4.js';
import JavaJUnit5Framework from './java-junit5.js';
import JsOxygenFramework from './js-oxygen.js';
import JsWdIoFramework from './js-wdio.js';
import PythonFramework from './python.js';
import RobotFramework from './robot.js';
import RubyFramework from './ruby.js';

export const CLIENT_FRAMEWORK_MAP = {
  [CLIENT_FRAMEWORKS.DOTNET_NUNIT]: DotNetNUnitFramework,
  [CLIENT_FRAMEWORKS.JS_WDIO]: JsWdIoFramework,
  [CLIENT_FRAMEWORKS.JS_OXYGEN]: JsOxygenFramework,
  [CLIENT_FRAMEWORKS.JAVA_JUNIT4]: JavaJUnit4Framework,
  [CLIENT_FRAMEWORKS.JAVA_JUNIT5]: JavaJUnit5Framework,
  [CLIENT_FRAMEWORKS.PYTHON]: PythonFramework,
  [CLIENT_FRAMEWORKS.ROBOT]: RobotFramework,
  [CLIENT_FRAMEWORKS.RUBY]: RubyFramework,
};
