const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');

function configure(rootDir, config, copyStatic) {
    const slsw = require('serverless-webpack');
    const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
    const CopyPlugin = require('copy-webpack-plugin');
    
    const result = _.assign({}, {
      entry: slsw.lib.entries,
      mode: slsw.lib.webpack.isLocal ? "development" : "production",
      resolve: {
        extensions: [
          '.js',
          '.json',
          '.ts',
          '.tsx'
        ]
      },
      node: {
        __dirname: false,
        __filename: false
      },
      externals: [
        'handlebars'
      ],
      optimization: {
        // We no not want to minimize our code.
        minimize: false
      },
      performance: {
        // Turn off size warnings for entry points
        hints: false
      },
      output: {
        libraryTarget: 'commonjs2',
        path: path.join(rootDir, '.webpack'),
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
          },
          {
            test: /platform\/.*.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
          }
        ]
      },
      plugins: [
        new FilterWarningsPlugin({ 
          exclude: [/Critical dependency/, /mongodb/, /mssql/, /mysql/, /mysql2/, /oracledb/, /pg/, /pg-native/, /pg-query-stream/, /react-native-sqlite-storage/, /redis/, /sqlite3/, /sql.js/, /typeorm-aurora-data-api-driver/, /@sap\/hdbext/, /tslint/, /@microsoft\/typescript-etw/, /@sap\/hana-client/, /hdb-pool/]
        }),
        new webpack.SourceMapDevToolPlugin({
          filename: '[file].map',
          exclude: /_warmup.*.*/,
        })
      ]
    }, config);

    if (copyStatic)
      result.plugins.push(
        new CopyPlugin({
          patterns: [
            { 
              from: 'src/static',
              to: 'static'
            }
          ]
        }));

    return result;
}

module.exports = configure;