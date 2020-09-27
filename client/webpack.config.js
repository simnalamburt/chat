'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

//
// Common configs
//
const commonConfigs = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, '../server/public/build'),
    publicPath: '/build/',
    filename: '_bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
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
}

// Development-mode configs
const dev = {
  devtool: 'inline-source-map',
}

// Production-mode configs
const prod = {
  plugins: [
    new webpack.LoaderOptionsPlugin({ minimize: true, debug: false }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new CompressionPlugin({
      test: /\.(?:css|js|svg|eot|ttf|html)$/,
      minRatio: 1,
      compressionOptions: { numiterations: 15 },
    }),
  ],
}

module.exports = (_, { mode }) => merge(commonConfigs, mode === 'production' ? prod : dev)
