/**
 * The parts of the Inspector app that the plugin's session recorder runs on the server:
 * locator generation, source parsing and the client-framework code generators.
 *
 * Bundled into plugins/lib/inspector-lib.mjs by `npm run build:plugin` (vite.plugin-lib.config.mjs),
 * so that the published plugin does not depend on files outside the plugins folder.
 */
import {CLIENT_FRAMEWORKS} from '../../app/common/renderer/constants/session-inspector.js';
import DotNetNUnitFramework from '../../app/common/renderer/lib/client-frameworks/dotnet-nunit.js';
import JavaJUnit4Framework from '../../app/common/renderer/lib/client-frameworks/java-junit4.js';
import JavaJUnit5Framework from '../../app/common/renderer/lib/client-frameworks/java-junit5.js';
import JsOxygenFramework from '../../app/common/renderer/lib/client-frameworks/js-oxygen.js';
import JsWdIoFramework from '../../app/common/renderer/lib/client-frameworks/js-wdio.js';
import PythonFramework from '../../app/common/renderer/lib/client-frameworks/python.js';
import RobotFramework from '../../app/common/renderer/lib/client-frameworks/robot.js';
import RubyFramework from '../../app/common/renderer/lib/client-frameworks/ruby.js';

export {getSuggestedLocators} from '../../app/common/renderer/utils/locator-generation/common.js';
export {xmlToJSON} from '../../app/common/renderer/utils/source-parsing.js';

// Same as lib/client-frameworks/map.js, without registering syntax highlighting (not needed here)
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
