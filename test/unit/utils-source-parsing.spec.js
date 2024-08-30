import {describe, expect, it} from 'vitest';

import {
  findDOMNodeByPath,
  findJSONElementByPath,
  xmlToDOM,
  xmlToJSON,
} from '../../app/common/renderer/utils/source-parsing';

describe('utils/source-parsing.js', function () {
  describe('#findDOMNodeByPath', function () {
    it('should find a Document node using the provided path', function () {
      expect(
        findDOMNodeByPath(
          '0.1.1',
          xmlToDOM(`<hierarchy>
          <root>
            <firstA>
              <secondA/>
              <secondB/>
            </firstA>
            <firstB>
              <secondC/>
              <secondD/>
            </firstB>
            <firstC>
              <secondE/>
              <secondF/>
            </firstC>
          </root>
        </hierarchy>`),
        ).tagName,
      ).toBe('secondD');
    });
  });

  describe('#findJSONElementByPath', function () {
    it('should find a JSON element using the provided path', function () {
      const foundElement = findJSONElementByPath(
        '0.1.1',
        xmlToJSON(`<hierarchy>
          <root>
            <firstA>
              <secondA/>
              <secondB/>
            </firstA>
            <firstB>
              <secondC/>
              <secondD/>
            </firstB>
            <firstC>
              <secondE/>
              <secondF/>
            </firstC>
          </root>
        </hierarchy>`),
      );
      expect(foundElement).toEqual({
        children: [],
        tagName: 'secondD',
        attributes: {},
        path: '0.1.1',
      });
    });
  });

  describe('#xmlToJSON', function () {
    it('should convert xml with unicode chars to json', function () {
      const json = xmlToJSON(`<hierarchy>
        <XCUIElementTypeApplication
          type="XCUIElementTypeApplication"
          name="🦋"
          label=""
          enabled="true"
          visible="true"
          x="0" y="0" width="768" height="1024">
            <XCUIElementTypeWindow
              type="XCUIElementTypeWindow"
              enabled="true"
              visible="false"
              x="0" y="0" width="1024" height="768">
            </XCUIElementTypeWindow>
        </XCUIElementTypeApplication>
      </hierarchy>`);
      expect(json).toEqual({
        children: [
          {
            children: [
              {
                children: [],
                tagName: 'XCUIElementTypeWindow',
                attributes: {
                  type: 'XCUIElementTypeWindow',
                  enabled: 'true',
                  visible: 'false',
                  x: '0',
                  y: '0',
                  width: '1024',
                  height: '768',
                },
                path: '0.0',
              },
            ],
            tagName: 'XCUIElementTypeApplication',
            attributes: {
              type: 'XCUIElementTypeApplication',
              name: '🦋',
              label: '',
              enabled: 'true',
              visible: 'true',
              x: '0',
              y: '0',
              width: '768',
              height: '1024',
            },
            path: '0',
          },
        ],
        attributes: {},
        path: '',
        tagName: 'hierarchy',
      });
    });

    it('should convert xml to json for Android', function () {
      const json =
        xmlToJSON(`<hierarchy index="0" class="hierarchy" rotation="0" width="1080" height="2028">
          <android.widget.FrameLayout
              index="0"
              package="com.appiuminspector"
              class="android.widget.FrameLayout"
              text=""
              checkable="false"
              checked="false"
              clickable="false"
              enabled="true"
              focusable="false"
              focused="false"
              long-clickable="false"
              password="false"
              scrollable="false"
              selected="false"
              bounds="[0,0][1080,2028]"
              displayed="true">
            <android.widget.LinearLayout
              index="0"
              package="com.appiuminspector"
              class="android.widget.LinearLayout"
              text=""
              checkable="false"
              checked="false"
              clickable="false"
              enabled="true"
              focusable="false"
              focused="false"
              long-clickable="false"
              password="false"
              scrollable="false"
              selected="false"
              bounds="[0,0][1080,2028]"
              displayed="true">
            </android.widget.LinearLayout>
          </android.widget.FrameLayout>
        </hierarchy>`);
      expect(json).toEqual({
        children: [
          {
            children: [
              {
                children: [],
                tagName: 'android.widget.LinearLayout',
                attributes: {
                  index: '0',
                  package: 'com.appiuminspector',
                  class: 'android.widget.LinearLayout',
                  text: '',
                  checkable: 'false',
                  checked: 'false',
                  clickable: 'false',
                  enabled: 'true',
                  focusable: 'false',
                  focused: 'false',
                  'long-clickable': 'false',
                  password: 'false',
                  scrollable: 'false',
                  selected: 'false',
                  bounds: '[0,0][1080,2028]',
                  displayed: 'true',
                },
                path: '0.0',
              },
            ],
            tagName: 'android.widget.FrameLayout',
            attributes: {
              index: '0',
              package: 'com.appiuminspector',
              class: 'android.widget.FrameLayout',
              text: '',
              checkable: 'false',
              checked: 'false',
              clickable: 'false',
              enabled: 'true',
              focusable: 'false',
              focused: 'false',
              'long-clickable': 'false',
              password: 'false',
              scrollable: 'false',
              selected: 'false',
              bounds: '[0,0][1080,2028]',
              displayed: 'true',
            },
            path: '0',
          },
        ],
        attributes: {
          class: 'hierarchy',
          height: '2028',
          rotation: '0',
          width: '1080',
          index: '0',
        },
        tagName: 'hierarchy',
        path: '',
      });
    });

    it('should convert xml to json for iOS', function () {
      const json = xmlToJSON(`<hierarchy>
        <XCUIElementTypeApplication type="XCUIElementTypeApplication" name="wdioDemoApp" label="wdioDemoApp" enabled="true" visible="true" x="0" y="0" width="414" height="896">
          <XCUIElementTypeWindow type="XCUIElementTypeWindow" enabled="true" visible="true" x="0" y="0" width="414" height="896">
            <XCUIElementTypeOther type="XCUIElementTypeOther" name="Appium Inspector" label="Appium Inspector" enabled="true" visible="true" x="0" y="0" width="414" height="896">
              <XCUIElementTypeOther type="XCUIElementTypeOther" name="Appium Inspector" label="Appium Inspector" enabled="true" visible="true" x="0" y="0" width="414" height="802">
                <XCUIElementTypeOther type="XCUIElementTypeOther" name="button-login-container" label="Login" enabled="true" visible="true" x="109" y="170" width="88" height="40">
                  <XCUIElementTypeOther type="XCUIElementTypeOther" name="Login" label="Login" enabled="true" visible="true" x="109" y="170" width="88" height="40">
                    <XCUIElementTypeStaticText type="XCUIElementTypeStaticText" value="Login" name="Login" label="Login" enabled="true" visible="true" x="124" y="175" width="58" height="30"/>
                  </XCUIElementTypeOther>
                </XCUIElementTypeOther>
              </XCUIElementTypeOther>
              <XCUIElementTypeOther type="XCUIElementTypeOther" name="Home WebView Login Forms Swipe" label="Home WebView Login Forms Swipe" enabled="true" visible="true" x="0" y="802" width="414" height="94">
                <XCUIElementTypeOther type="XCUIElementTypeOther" name="Home WebView Login Forms Swipe" label="Home WebView Login Forms Swipe" enabled="true" visible="true" x="0" y="802" width="414" height="94">
                  <XCUIElementTypeButton type="XCUIElementTypeButton" value="1" name="Login" label="Login" enabled="true" visible="true" x="165" y="812" width="84" height="50"/>
                </XCUIElementTypeOther>
              </XCUIElementTypeOther>
            </XCUIElementTypeOther>
          </XCUIElementTypeWindow>
          <XCUIElementTypeWindow type="XCUIElementTypeWindow" enabled="true" visible="false" x="0" y="0" width="414" height="896">
            <XCUIElementTypeOther type="XCUIElementTypeOther" enabled="true" visible="false" x="0" y="0" width="414" height="896">
              <XCUIElementTypeOther type="XCUIElementTypeOther" enabled="true" visible="false" x="0" y="0" width="414" height="896"/>
            </XCUIElementTypeOther>
          </XCUIElementTypeWindow>
        </XCUIElementTypeApplication>
      </hierarchy>`);
      expect(json).toEqual({
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            children: [
                              {
                                children: [
                                  {
                                    children: [],
                                    tagName: 'XCUIElementTypeStaticText',
                                    attributes: {
                                      type: 'XCUIElementTypeStaticText',
                                      value: 'Login',
                                      name: 'Login',
                                      label: 'Login',
                                      enabled: 'true',
                                      visible: 'true',
                                      x: '124',
                                      y: '175',
                                      width: '58',
                                      height: '30',
                                    },
                                    path: '0.0.0.0.0.0.0',
                                  },
                                ],
                                tagName: 'XCUIElementTypeOther',
                                attributes: {
                                  type: 'XCUIElementTypeOther',
                                  name: 'Login',
                                  label: 'Login',
                                  enabled: 'true',
                                  visible: 'true',
                                  x: '109',
                                  y: '170',
                                  width: '88',
                                  height: '40',
                                },
                                path: '0.0.0.0.0.0',
                              },
                            ],
                            tagName: 'XCUIElementTypeOther',
                            attributes: {
                              type: 'XCUIElementTypeOther',
                              name: 'button-login-container',
                              label: 'Login',
                              enabled: 'true',
                              visible: 'true',
                              x: '109',
                              y: '170',
                              width: '88',
                              height: '40',
                            },
                            path: '0.0.0.0.0',
                          },
                        ],
                        tagName: 'XCUIElementTypeOther',
                        attributes: {
                          type: 'XCUIElementTypeOther',
                          name: 'Appium Inspector',
                          label: 'Appium Inspector',
                          enabled: 'true',
                          visible: 'true',
                          x: '0',
                          y: '0',
                          width: '414',
                          height: '802',
                        },
                        path: '0.0.0.0',
                      },
                      {
                        children: [
                          {
                            children: [
                              {
                                children: [],
                                tagName: 'XCUIElementTypeButton',
                                attributes: {
                                  type: 'XCUIElementTypeButton',
                                  value: '1',
                                  name: 'Login',
                                  label: 'Login',
                                  enabled: 'true',
                                  visible: 'true',
                                  x: '165',
                                  y: '812',
                                  width: '84',
                                  height: '50',
                                },
                                path: '0.0.0.1.0.0',
                              },
                            ],
                            tagName: 'XCUIElementTypeOther',
                            attributes: {
                              type: 'XCUIElementTypeOther',
                              name: 'Home WebView Login Forms Swipe',
                              label: 'Home WebView Login Forms Swipe',
                              enabled: 'true',
                              visible: 'true',
                              x: '0',
                              y: '802',
                              width: '414',
                              height: '94',
                            },
                            path: '0.0.0.1.0',
                          },
                        ],
                        tagName: 'XCUIElementTypeOther',
                        attributes: {
                          type: 'XCUIElementTypeOther',
                          name: 'Home WebView Login Forms Swipe',
                          label: 'Home WebView Login Forms Swipe',
                          enabled: 'true',
                          visible: 'true',
                          x: '0',
                          y: '802',
                          width: '414',
                          height: '94',
                        },
                        path: '0.0.0.1',
                      },
                    ],
                    tagName: 'XCUIElementTypeOther',
                    attributes: {
                      type: 'XCUIElementTypeOther',
                      name: 'Appium Inspector',
                      label: 'Appium Inspector',
                      enabled: 'true',
                      visible: 'true',
                      x: '0',
                      y: '0',
                      width: '414',
                      height: '896',
                    },
                    path: '0.0.0',
                  },
                ],
                tagName: 'XCUIElementTypeWindow',
                attributes: {
                  type: 'XCUIElementTypeWindow',
                  enabled: 'true',
                  visible: 'true',
                  x: '0',
                  y: '0',
                  width: '414',
                  height: '896',
                },
                path: '0.0',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [],
                        tagName: 'XCUIElementTypeOther',
                        attributes: {
                          type: 'XCUIElementTypeOther',
                          enabled: 'true',
                          visible: 'false',
                          x: '0',
                          y: '0',
                          width: '414',
                          height: '896',
                        },
                        path: '0.1.0.0',
                      },
                    ],
                    tagName: 'XCUIElementTypeOther',
                    attributes: {
                      type: 'XCUIElementTypeOther',
                      enabled: 'true',
                      visible: 'false',
                      x: '0',
                      y: '0',
                      width: '414',
                      height: '896',
                    },
                    path: '0.1.0',
                  },
                ],
                tagName: 'XCUIElementTypeWindow',
                attributes: {
                  type: 'XCUIElementTypeWindow',
                  enabled: 'true',
                  visible: 'false',
                  x: '0',
                  y: '0',
                  width: '414',
                  height: '896',
                },
                path: '0.1',
              },
            ],
            tagName: 'XCUIElementTypeApplication',
            attributes: {
              type: 'XCUIElementTypeApplication',
              name: 'wdioDemoApp',
              label: 'wdioDemoApp',
              enabled: 'true',
              visible: 'true',
              x: '0',
              y: '0',
              width: '414',
              height: '896',
            },
            path: '0',
          },
        ],
        attributes: {},
        tagName: 'hierarchy',
        path: '',
      });
    });

    it('should convert xml to json for Newline', function () {
      const json = xmlToJSON(`<hierarchy>
        <android.widget.FrameLayout
            index="0"
            class="android.widget.FrameLayout"
            content-desc="Dashboard&#10;Tab 1 of 2" >
          <android.widget.LinearLayout
            index="0"
            class="android.widget.LinearLayout"
            content-desc="Setting&#10;Tab 2 of 2">
          </android.widget.LinearLayout>
        </android.widget.FrameLayout>
      </hierarchy>`);
      expect(json).toEqual({
        children: [
          {
            children: [
              {
                children: [],
                tagName: 'android.widget.LinearLayout',
                attributes: {
                  index: '0',
                  class: 'android.widget.LinearLayout',
                  'content-desc': 'Setting\\nTab 2 of 2',
                },
                path: '0.0',
              },
            ],
            tagName: 'android.widget.FrameLayout',
            attributes: {
              index: '0',
              class: 'android.widget.FrameLayout',
              'content-desc': 'Dashboard\\nTab 1 of 2',
            },
            path: '0',
          },
        ],
        attributes: {},
        tagName: 'hierarchy',
        path: '',
      });
    });
  });
});
