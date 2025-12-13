const createMapper = (keys) => {
  return keys.reduce((acc, key) => {
    acc[`^./${key}.js$`] = `<rootDir>/src/${key}.ts`;
    return acc;
  }, {});
};

export default {
  clearMocks: true,
  transformIgnorePatterns: ["node_modules/(?!spotify-to-yaml)"],
  coverageThreshold: {
    global: {
      branches: 91,
      functions: 100,
      lines: 96,
      statements: 96,
    },
  },
  moduleNameMapper: createMapper(["write-file", "index", "list-playlists"]),
};
