//@ts-check
'use strict';
const path = require('path');
const webpack = require('webpack');
// eslint-disable-next-line n/no-unpublished-require
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
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/, /wdio\.conf\.mts/], // Exclude WDIO config
        use: env['coverage']
          ? [
              { loader: '@jsdevtools/coverage-istanbul-loader' }, // Add coverage for WDIO
              { loader: 'ts-loader' },
            ]
          : [{ loader: 'ts-loader' }],
      },
    ],
  },
  plugins: [
    new ESLintPlugin(), // Optional: Enforce code quality
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // Ensure single bundle for extension
    }),
    new webpack.DefinePlugin({
      'process.env.TESTING': JSON.stringify(env['wdio'] || false), // Flag for WDIO testing
      'process.env.COVERAGE': JSON.stringify(env['coverage'] || false), // Flag for coverage
    }),
  ],
  cache: {
    type: 'filesystem',
    name: argv.mode + '-wdio_' + env['wdio'] + '-coverage_' + env['coverage'],
    version: '1',
  },
  devtool: 'nosources-source-map', 
  infrastructureLogging: {
    level: 'log',
  },
});

module.exports = [extensionConfig];