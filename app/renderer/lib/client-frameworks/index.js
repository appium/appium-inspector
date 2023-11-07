import DotNetNUnitFramework from './dotnet-nunit';
import JsWdIoFramework from './js-wdio';
import JsOxygenFramework from './js-oxygen';
import JavaFramework from './java';
import PythonFramework from './python';
import RubyFramework from './ruby';
import RobotFramework from './robot';

const frameworks = {
  dotNetNUnit: DotNetNUnitFramework,
  jsWdIo: JsWdIoFramework,
  jsOxygen: JsOxygenFramework,
  java: JavaFramework,
  python: PythonFramework,
  ruby: RubyFramework,
  robot: RobotFramework,
};

export default frameworks;
