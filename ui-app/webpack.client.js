const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    client: './src/client/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    publicPath: '/public',
    path: path.resolve(__dirname, './dist/public')
  },
  plugins: [
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__SERVER__': false
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV', 'PORT', 'API_GATEWAY_URI'])
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
