import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

import * as source from '../../plugins/lib-src/inspector-lib.mjs';

// written by `npm run build:plugin`, and used by the published plugin instead of the app sources
const BUNDLE_URL = new URL('../../plugins/lib/inspector-lib.mjs', import.meta.url);

const XML = '<Window Name="App"><Pane><Button Name="OK" AutomationId="btnOk"/></Pane></Window>';

describe.skipIf(!existsSync(fileURLToPath(BUNDLE_URL)))('plugin lib bundle', function () {
  it('exposes the same working API as the sources', async function () {
    const bundle = await import(BUNDLE_URL.href);
    expect(Object.keys(bundle).sort()).toEqual(Object.keys(source).sort());

    const node = bundle.xmlToJSON(XML).children[0].children[0];
    expect(bundle.getSuggestedLocators(node, XML, true, 'wincore')).toEqual(
      source.getSuggestedLocators(node, XML, true, 'wincore'),
    );

    const Framework = bundle.CLIENT_FRAMEWORK_MAP.python;
    const fw = new Framework('http://127.0.0.1:4723', {}, {});
    fw.actions = [{action: 'findAndAssign', params: ['accessibility id', 'btnOk', 'el1', false]}];
    expect(fw.getCodeString(false)).toContain('AppiumBy.ACCESSIBILITY_ID, value="btnOk"');
  });
});
