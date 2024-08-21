export const languageList = [
  {name: 'Arabic', code: 'ar', original: 'العربية'},
  {name: 'Chinese Simplified', code: 'zh-CN', original: '中文简体'},
  {name: 'Chinese Traditional', code: 'zh-TW', original: '中文繁體'},
  {name: 'English', code: 'en', original: 'English'},
  {name: 'French', code: 'fr', original: 'Française'},
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
  {name: 'Russian', code: 'ru', original: 'Русский'},
  {name: 'Spanish', code: 'es-ES', original: 'Español'},
  {name: 'Telugu', code: 'te', original: 'తెలుగు'},
  {name: 'Turkish', code: 'tr', original: 'Türk'},
  {name: 'Ukrainian', code: 'uk', original: 'Українська'},
];

export const fallbackLng = 'en';

export const commonI18NextOptions = {
  // debug: true,
  // saveMissing: true,
  interpolation: {
    escapeValue: false,
  },
  load: 'currentOnly',
  fallbackLng,
  supportedLngs: languageList.map((language) => language.code),
};
