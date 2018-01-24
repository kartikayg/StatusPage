const nodeExternals = require('webpack-node-externals');
const path = require('path');

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
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: [/node_modules/],
      use: [{
        loader: 'babel-loader',
        options: { presets: [ [ "env", { targets: { "node": true }} ], 'react'], plugins: ['transform-object-rest-spread'] }
      }],
    }]
  },
  externals: nodeExternals(),
  devtool: 'source-map'
};
