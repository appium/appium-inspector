function makeBabelConfig(electronVersion) {
  return (api) => {
    api.cache(true);
    return {
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-syntax-jsx',
        '@babel/plugin-transform-react-jsx',
        '@babel/plugin-transform-runtime',
      ],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {electron: electronVersion},
            useBuiltIns: 'usage',
            corejs: 2,
          },
        ],
        ['@babel/preset-react'],
      ],
    };
  };
}

module.exports = makeBabelConfig(require('./node_modules/electron/package.json').version);
