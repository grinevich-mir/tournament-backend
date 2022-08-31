const path = require('path');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
    entry: './src/engine.ts',
    mode: "production",
    devtool: 'source-map',
    resolve: {
      extensions: [
        '.js',
        '.json',
        '.ts',
        '.tsx'
      ],
      alias: {
        'handlebars' : 'handlebars/dist/handlebars.js'
      }
    },
    optimization: {
      // We no not want to minimize our code.
      minimize: false
    },
    node: {
      __dirname: false,
      __filename: false
    },
    performance: {
      // Turn off size warnings for entry points
      hints: false
    },
    output: {
      libraryTarget: 'commonjs2',
      path: path.join(__dirname, 'dist'),
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