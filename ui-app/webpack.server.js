const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: './src/server/index.js',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    new webpack.DefinePlugin({
      '__CLIENT__': false,
      '__SERVER__': true
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: { presets: [ [ "env", { targets: { "node": true }} ], 'react', 'stage-1', 'es2017'], plugins: ['transform-object-rest-spread'] }
        }],
      },
      {
        test: /\.css$/,
        loaders: 'css-loader/locals'
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
        use: [
          {
            loader:  'url-loader',
            options: {
              limit: 100000,
              name: '[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  externals: nodeExternals(),
  devtool: process.env.NODE_ENV === 'dev' ? '#cheap-module-eval-source-map' : '#source-map'
};
