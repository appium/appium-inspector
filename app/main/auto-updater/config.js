import { getAutoUpdaterFeedUrl } from '../../../gui-common/util';

const baseFeedUrl = `https://appium-inspector-hazel.vercel.app`;

export function getFeedUrl (version) {
  return getAutoUpdaterFeedUrl(version, baseFeedUrl);
}
export default {
  baseFeedUrl,
  getFeedUrl,
};
