import settings from '../shared/settings';

const languageList = [
  {name: 'Chinese Simplified', code: 'zh-CN', original: '中文'},
  {name: 'English', code: 'en', original: 'English'},
  {name: 'German', code: 'de', original: 'Deutsch'},
  {name: 'Hindi', code: 'hi', original: 'हिंदी'},
  {name: 'Hungarian', code: 'hu', original: 'Magyar'},
  {name: 'Italian', code: 'it', original: 'Italiano'},
  {name: 'Japanese', code: 'ja', original: '日本語'},
  {name: 'Kannada', code: 'kn', original: 'ಕನ್ನಡ'},
  {name: 'Korean', code: 'ko', original: '한국어'},
  {name: 'Malayalam', code: 'ml-IN', original: 'മലയാളം'},
  {name: 'Persian', code: 'fa', original: 'فارسی'},
  {name: 'Polish', code: 'pl', original: 'Polski'},
  {name: 'Portuguese', code: 'pt-PT', original: 'Português'},
  {name: 'Portuguese (Brazil)', code: 'pt-BR', original: 'Português (Brasil)'},
  {name: 'Punjabi', code: 'pa-IN', original: 'ਪੰਜਾਬੀ'},
  {name: 'Russian', code: 'ru', original: 'Русский'},
  {name: 'Spanish', code: 'es-ES', original: 'Español'},
  {name: 'Telugu', code: 'te', original: 'తెలుగు'},
  {name: 'Ukrainian', code: 'uk', original: 'Українська'},
];

const config = {
  platform: process.platform,
  languages: languageList.map((language) => language.code),
  fallbackLng: 'en',
  namespace: 'translation',
};

function getI18NextOptions(backend) {
  return {
    backend,
    // debug: true,
    // saveMissing: true,
    interpolation: {
      escapeValue: false,
    },
    lng: (settings && settings.getSync('PREFERRED_LANGUAGE')) || 'en',
    fallbackLng: config.fallbackLng,
    whitelist: config.languages,
  };
}

export default config;
export {languageList, getI18NextOptions};
