const path = require('path');
const slsw = require('serverless-webpack');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
    entry: slsw.lib.entries,
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
    devtool: 'source-map',
    resolve: {
      extensions: [
        '.js',
        '.json',
        '.ts',
        '.tsx'
      ]
    },
    optimization: {
      // We no not want to minimize our code.
      minimize: false
    },
    performance: {
      // Turn off size warnings for entry points
      hints: false
    },
    node: {
      __dirname: false,
      __filename: false
    },
    output: {
      libraryTarget: 'commonjs2',
      path: path.join(__dirname, '.webpack'),
      filename: '[name].js',
      sourceMapFilename: '[file].map'
    },
    target: 'node',
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          use: [
            {
              loader: 'ts-loader'
            }
          ],
        }
      ]
    },
    plugins: [
      new FilterWarningsPlugin({
        exclude: [/Critical dependency/, /mongodb/, /mssql/, /mysql/, /mysql2/, /oracledb/, /pg/, /pg-native/, /pg-query-stream/, /react-native-sqlite-storage/, /redis/, /sqlite3/, /sql.js/, /typeorm-aurora-data-api-driver/, /@sap\/hdbext/, /tslint/, /@microsoft\/typescript-etw/, /@sap\/hana-client/, /hdb-pool/]
      })
    ]
  }