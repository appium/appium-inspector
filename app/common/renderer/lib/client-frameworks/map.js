import DotNetNUnitFramework from './dotnet-nunit.js';
import JavaJUnit4Framework from './java-junit4.js';
import JavaJUnit5Framework from './java-junit5.js';
import JsOxygenFramework from './js-oxygen.js';
import JsWdIoFramework from './js-wdio.js';
import PythonFramework from './python.js';
import RobotFramework from './robot.js';
import RubyFramework from './ruby.js';

export const CLIENT_FRAMEWORK_MAP = {
  dotNetNUnit: DotNetNUnitFramework,
  jsWdIo: JsWdIoFramework,
  jsOxygen: JsOxygenFramework,
  java: JavaJUnit4Framework,
  javaJUnit5: JavaJUnit5Framework,
  python: PythonFramework,
  ruby: RubyFramework,
  robot: RobotFramework,
};
