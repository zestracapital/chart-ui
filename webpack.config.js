const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zestra-dashboard.js',
    library: 'ZCZestraDashboard',
    libraryTarget: 'window',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'zestra-dashboard.css'
    })
  ],
  externals: {
    'chart.js': 'Chart',
    'chartjs-adapter-date-fns': 'ChartJSAdapterDateFns'
  },
  resolve: {
    extensions: ['.js']
  }
};
