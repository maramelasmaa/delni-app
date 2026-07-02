module.exports = function (api) {
  // Cache keyed on NODE_ENV so the production-only console-stripping below is
  // re-evaluated when the build env changes (api.cache(true) would freeze it).
  api.cache.using(() => process.env.NODE_ENV);

  const plugins = [];

  // Strip console.* from release bundles — each call serializes its args and adds
  // JS-thread overhead, and logs can leak data via `adb logcat`. Keep error/warn.
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins,
  };
};
