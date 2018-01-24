const path = require('path');

module.exports = {
  entry: {
    client: './src/client/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    publicPath: '/public',
    path: path.resolve(__dirname, './dist/public')
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: [/node_modules/],
      use: [{
        loader: 'babel-loader',
        options: { presets: ['env', 'react'], plugins: ['transform-object-rest-spread'] }
      }],
    }]
  }
};
