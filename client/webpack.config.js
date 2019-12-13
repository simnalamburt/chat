'use strict';

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, '../server/public/build'),
    publicPath: '/build/',
    filename: '_bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        // 'sass' and 'fibers' modules will be automatically injected to sass-loader
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '_bundle.css',
    }),
  ],
};
