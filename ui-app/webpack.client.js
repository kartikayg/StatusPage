// LOOK AT https://github.com/minhtranite/react-notifications FOR HELP //

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    client: './src/client/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    publicPath: '/public/js',
    path: path.resolve(__dirname, './dist/public/js')
  },
  plugins: [
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__SERVER__': false
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV', 'PORT', 'API_GATEWAY_URI']),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './node_modules/react-notifications/lib/notifications.css'),
        to: path.resolve(__dirname, './dist/public/css')
      },
      {
        context: path.resolve(__dirname, './src/shared/assets/css/'),
        from: '*.css',
        to: path.resolve(__dirname, './dist/public/css')
      },
      {
        context: path.resolve(__dirname, './node_modules/react-notifications/lib/fonts/'),
        from: '*.*',
        to: path.resolve(__dirname, './dist/public/css/fonts/')
      },
    ], { flatten : true })
  ],
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: [/node_modules/],
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
    }]
  },
  devtool: process.env.NODE_ENV === 'dev' ? '#cheap-module-eval-source-map' : '#source-map'
};
