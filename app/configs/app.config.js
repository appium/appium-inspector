const config = {
  platform: process.platform,
  languages: ['en', 'de', 'ru', 'ja', 'zh-CN', 'ko', 'hi', 'kn', 'ml-IN', 'pa-IN', 'te', 'pt-BR', 'it'],
  namespace: 'translation',
};

function getI18NextOptions (settings, config, backend) {
  return {
    backend,
    // debug: true,
    // saveMissing: true,
    interpolation: {
      escapeValue: false
    },
    lng: settings && settings.getSync('PREFERRED_LANGUAGE', 'en') || 'en',
    fallbackLng: config.fallbackLng,
    whitelist: config.languages,
    react: {
      wait: false
    }
  };
}


export default config;
export { getI18NextOptions };
