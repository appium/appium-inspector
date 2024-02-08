const baseFeedUrl = `https://appium-inspector-hazel.vercel.app`;

export function getFeedUrl(version) {
  let platform = process.platform;
  if (platform.toLowerCase() === 'linux') {
    platform = 'AppImage';
  }
  return `${baseFeedUrl}/update/${platform}/${version}`;
}
