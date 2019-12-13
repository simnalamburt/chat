const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: `${__dirname}/src`,
  entry: './main.js',
  output: {
    path: `${__dirname}/../server/public/build`,
    publicPath: '/build/',
    filename: '_bundle.js',
  },
  plugins: [new ExtractTextPlugin('_bundle.css')],
  module: {
    loaders: [
      {test: /\.txt$/, loader: 'raw'},
      {test: /\.png$/, loader: 'file?name=static/[hash].[ext]'},
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file?name=static/[hash].[ext]',
      },
      {test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css')},
    ],
  },
};
