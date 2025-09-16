import * as sessionBuilderActions from './SessionBuilder.js';
import * as sessionInspectorActions from './SessionInspector.js';

export default {
  ...sessionInspectorActions,
  ...sessionBuilderActions,
};
