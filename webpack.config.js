// * Imports
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

// * Settings
const filename = "main";
const srcDir = "./src";
const distDir = "./dist";
// optimization settings
const production = true;
const treeShaking = true;
const minification = true;
const compression = false;

module.exports = {
  mode: production ? "production" : "development",
  entry: `${srcDir}/${filename}.ts`,
  output: {
    filename: `${distDir}/[name].js`,
    path: path.resolve(__dirname, "."),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    // tells webpack to not bundle 'fs' and instead use it from the environment
    fs: "commonjs fs",
  },
  ...(production
    ? // optimization are only enabled in production mode
      {
        optimization: {
          usedExports: treeShaking, // remove unused exports
          minimize: minification,
          minimizer: [minification && new TerserPlugin()].filter(Boolean),
        },
        plugins: [compression && new CompressionPlugin()].filter(Boolean),
      }
    : {}),
};
