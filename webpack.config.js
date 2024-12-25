const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './popup/popup.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'popup/dist'),
  },
  mode: 'production',
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ]
}; 