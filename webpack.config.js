//@ts-check
'use strict';
const path = require('path');
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/naming-convention
const ESLintPlugin = require('eslint-webpack-plugin');

/** @typedef {import('webpack').Configuration} WebpackConfig */
/**
 * @param {Record<string, string>} env
 * @param {Record<string, string>} argv
 * @returns {WebpackConfig}
 */
const extensionConfig = (env, argv) => ({
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '@flow-scanner/lightning-flow-scanner-core': 'commonjs @flow-scanner/lightning-flow-scanner-core'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        use: [{ loader: 'ts-loader' }],
      },
    ],
  },
  plugins: [
    new ESLintPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, 
    }),
  ],
  cache: {
  type: 'filesystem',
  name: argv.mode || 'default',
  version: '1',
  },
  devtool: 'nosources-source-map', 
  infrastructureLogging: {
    level: 'log',
  },
});

module.exports = [extensionConfig];
