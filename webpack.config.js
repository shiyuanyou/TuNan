const path = require('path');

module.exports = {
  entry: './popup/popup.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'popup/dist'),
  },
  mode: 'production',
}; 