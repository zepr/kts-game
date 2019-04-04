const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/ktsLoader.ts',
  devtool: 'inline-source-map',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'scripts/game.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
        { from: 'static' }
    ]),
    new BrowserSyncPlugin({
        host: 'localhost',
        port: 9080,
        server: { baseDir: ['dist'] }
    })
  ]  
};




