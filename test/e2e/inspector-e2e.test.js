import {startServer as startAppiumFakeDriverServer} from '@appium/fake-driver';
import {retryInterval} from 'asyncbox';
import path from 'path';
import {expect} from 'vitest';

import InspectorPage from './pages/inspector-page-object';

const FAKE_DRIVER_PORT = 12121;

const FAKE_DRIVER_PATH = path.dirname(require.resolve('@appium/fake-driver/package.json'));
const TEST_APP = path.resolve(FAKE_DRIVER_PATH, 'test', 'fixtures', 'app.xml');

const DEFAULT_CAPS = {
  platformName: 'Fake',
  'appium:deviceName': 'Fake',
  'appium:app': TEST_APP,
};

let client;

describe('inspector window', function () {
  let inspector, server;

  before(async function () {
    // Start an Appium fake driver server
    server = await startAppiumFakeDriverServer(FAKE_DRIVER_PORT, '127.0.0.1');

    // Navigate to session URL
    client = this.app.client;
    inspector = new InspectorPage(client);

    // Set the desired capabilities
    await (await client.$(inspector.addDesiredCapabilityButton)).waitForExist({timeout: 20000});
    await inspector.addDCaps(DEFAULT_CAPS);

    // Set the fake driver server and port
    await inspector.setCustomServerHost('127.0.0.1');
    await inspector.setCustomServerPort(FAKE_DRIVER_PORT);
    await inspector.setCustomServerPath('/wd/hub');

    // Start the session
    await inspector.startSession();
  });

  after(async function () {
    await server.close();
    await inspector.goHome();
  });

  beforeEach(async function () {
    await (await client.$(inspector.inspectorToolbar)).waitForExist({timeout: 7000});
  });

  it('shows content in "Selected Element" pane when clicking on an item in the Source inspector', async function () {
    expect(await (await client.$(inspector.selectedElementBody)).getHTML()).toContain(
      'Select an element',
    );
    await (await client.$(inspector.sourceTreeNode)).waitForExist({timeout: 3000});
    await (await client.$(inspector.sourceTreeNode)).click();
    await (await client.$(inspector.tapSelectedElementButton)).waitForExist({timeout: 3000});
    await (await client.$(inspector.tapSelectedElementButton)).waitForEnabled({timeout: 4000});
    expect(await (await client.$(inspector.selectedElementBody)).getHTML()).toContain(
      'btnTapElement',
    );
    await (await client.$(inspector.tapSelectedElementButton)).click();
  });

  it('shows a loading indicator in screenshot after clicking "Refresh" and then indicator goes away when refresh is complete', async function () {
    await inspector.reload();
    const spinDots = await client.$$(inspector.screenshotLoadingIndicator);
    expect(spinDots).toHaveLength(1);
    await retryInterval(15, 1000, async function () {
      const spinDots = await client.$$(inspector.screenshotLoadingIndicator);
      expect(spinDots).toHaveLength(0);
    });
  });

  it('shows a new pane when click "Start Recording" button and then the pane disappears when clicking "Pause"', async function () {
    // Check that there's no recorded actions pane
    let recordedPanes = await client.$$(inspector.recordedActionsPane);
    expect(recordedPanes).toHaveLength(0);

    // Start a recording and check that there is a recorded actions pane
    await inspector.startRecording();
    await (await client.$(inspector.recordedActionsPane)).waitForExist({timeout: 2000});
    recordedPanes = await client.$$(inspector.recordedActionsPane);
    expect(recordedPanes).toHaveLength(1);

    // Pause the recording and check that the recorded actions pane is gone again
    await inspector.pauseRecording();
    recordedPanes = await client.$$(inspector.recordedActionsPane);
    expect(recordedPanes).toHaveLength(0);
  });
});
