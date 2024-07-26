import {load} from 'cheerio';

/**
 * JS code that is executed in the webview to set the needed attributes on the DOM so the source can be used for the
 * native inspector window.
 *
 * NOTE:
 * object destructuring the arguments resulted in this error with iOS (not with Android)
 *
 * `Duplicate parameter 'e' not allowed in function with destructuring parameters.`
 *
 * That's why the object destructuring is done in the method itself
 */
export function setHtmlElementAttributes(obj) {
  const {isAndroid, webviewTopOffset, webviewLeftOffset} = obj;
  const htmlElements = document.body.getElementsByTagName('*');
  // iOS uses CSS sizes for elements and screenshots, Android sizes times DRP
  // for other platforms, use default DRP of 1
  const dpr = isAndroid ? window.devicePixelRatio : 1;

  Array.from(htmlElements).forEach((el) => {
    const rect = el.getBoundingClientRect();

    el.setAttribute('data-appium-inspector-width', Math.round(rect.width * dpr));
    el.setAttribute('data-appium-inspector-height', Math.round(rect.height * dpr));
    el.setAttribute(
      'data-appium-inspector-x',
      Math.round(webviewLeftOffset + (rect.left - window.scrollX) * dpr),
    );
    el.setAttribute(
      'data-appium-inspector-y',
      Math.round(webviewTopOffset + (rect.top - window.scrollY) * dpr),
    );
  });
}

/**
 * Parse the source if it's HTML:
 * - head and scripts need to be removed to clean the HTML tree
 * - all custom attributes need to be transformed to normal width/height/x/y
 */
export function parseSource(source) {
  // TODO this check is a bit brittle, figure out a better way to check whether we have a web
  // source vs something else. Just checking for <html in the source doesn't work because fake
  // driver app sources can include embedded <html elements even though the overall source is not
  // html. So for now just look for fake-drivery things like <app> or <mock...> and ensure we don't
  // parse that as html
  if (!source.includes('<html') || source.includes('<app ') || source.includes('<mock')) {
    return source;
  }

  const $ = load(source, {_useHtmlParser2: true});

  // Remove the head and the scripts
  const head = $('head');
  head.remove();
  const scripts = $('script');
  scripts.remove();

  // Clean the source
  $('*')
    // remove all existing width height or x/y attributes
    .removeAttr('width')
    .removeAttr('height')
    .removeAttr('x')
    .removeAttr('y')
    // remove all `data-appium-inspector-` prefixes so only the width|height|x|y are there
    .each(function () {
      const $el = $(this);

      ['width', 'height', 'x', 'y'].forEach((rectAttr) => {
        if ($el.attr(`data-appium-inspector-${rectAttr}`)) {
          $el.attr(rectAttr, $el.attr(`data-appium-inspector-${rectAttr}`));

          /* remove the old attribute */
          $el.removeAttr(`data-appium-inspector-${rectAttr}`);
        }
      });
    });

  return $.xml();
}
