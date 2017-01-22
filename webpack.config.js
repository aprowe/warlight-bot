var path = require('path');


module.exports = {
  entry: {
    main: './main.js',
  },
  devtool: 'source-map',
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
    }, {
      test: /\.json/,
      loader: 'json-loader',
      exclude: /node_modules/,
    }],
  },
  externals: {
    './benchmark.json': './benchmark.json'
  }
};
