// LOOK AT https://github.com/minhtranite/react-notifications FOR HELP //

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const nodeModulesDir  = path.join(__dirname, 'node_modules');

module.exports = {
  devtool: process.env.NODE_ENV === 'dev' ? '#cheap-module-eval-source-map' : '#source-map',
  entry: {
    app: './src/client/index.js',
    vendor: [
      'react',
      'react-dom',
      'babel-polyfill',
      'redux',
      'react-router-redux',
      'redux-logger',
      'react-router',
      'classnames',
      'axios',
      'moment-timezone',
      'react-notification',
      'prop-types',
      'semantic-ui-react'
    ]
  },
  entry: {
    client: './src/client/index.js',
  },
  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, './dist/public')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude:  [nodeModulesDir],
        use: [{
          loader: 'babel-loader',
          options: { 
            presets: [
             [ "env", { targets: { "browsers": ["last 2 Chrome versions"] } } ],
             'react',
             'stage-1'
            ], 
            plugins: ['transform-object-rest-spread'] 
          }
        }],
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
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
  plugins: [
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__SERVER__': false
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV', 'PORT', 'API_GATEWAY_URI', 'TIMEZONE']),
    new ExtractTextPlugin('app.styles.css'),
    new webpack.optimize.CommonsChunkPlugin({
      name:     'vendor',
      filename: 'vendor.bundle.js'
    })
  ]
};
