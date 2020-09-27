'use strict'
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
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
        // 'sass' modules will be automatically injected to sass-loader
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '_bundle.css',
    }),
  ],
}
