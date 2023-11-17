import DotNetNUnitFramework from './dotnet-nunit';
import JsWdIoFramework from './js-wdio';
import JsOxygenFramework from './js-oxygen';
import JavaJUnit4Framework from './java-junit4';
import JavaJUnit5Framework from './java-junit5';
import PythonFramework from './python';
import RubyFramework from './ruby';
import RobotFramework from './robot';

const frameworks = {
  dotNetNUnit: DotNetNUnitFramework,
  jsWdIo: JsWdIoFramework,
  jsOxygen: JsOxygenFramework,
  java: JavaJUnit4Framework,
  javaJUnit5: JavaJUnit5Framework,
  python: PythonFramework,
  ruby: RubyFramework,
  robot: RobotFramework,
};

export default frameworks;
