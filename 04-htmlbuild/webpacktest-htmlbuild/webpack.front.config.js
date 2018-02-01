'use strict';
const path = require('path');
const fs = require('fs');
const pkgConfig = require('./package.json');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin'); // aliasing this back to webpack.optimize.UglifyJsPluginis is scheduled for webpack v4.0.0
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// PUBLIC PATH based on env
const protocol = pkgConfig.config.isWebpackDevServerHTTPS ? 'https:' : 'http:';
const devServerPort = pkgConfig.config.isWebpackDevServerHTTPS ? pkgConfig.config.portFrontendWebpackDevServerHTTPS : pkgConfig.config.portFrontendWebpackDevServerHTTP;
let publicPath;
let targetHost;
if (production) {
  publicPath = `//${pkgConfig.config.hostProduction}${pkgConfig.config.pathAboveRootProduction}/assets/`;
  targetHost = pkgConfig.config.hostProduction;
} else if (staging) {
  publicPath = `//${pkgConfig.config.hostStaging}${pkgConfig.config.pathAboveRootStaging}/assets/`;
  targetHost = pkgConfig.config.hostStaging;
} else if (testing) {
  publicPath = `//${pkgConfig.config.hostTesting}${pkgConfig.config.pathAboveRootTesting}/assets/`;
  targetHost = pkgConfig.config.hostTesting;
} else {
  publicPath = `${protocol}//${pkgConfig.config.hostDevelopment}:${devServerPort}${pkgConfig.config.pathAboveRootDevelopment}/assets/`;
  targetHost = pkgConfig.config.hostDevelopment;
}

console.log('publicPath \x1b[36m%s\x1b[0m', publicPath);
console.log('targetHost \x1b[36m%s\x1b[0m', targetHost);

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

// ----------------
// Source map conf
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// BASE CONFIG

let config = {
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
    publicPath
  },
  resolve: {
    modules: [
      path.resolve('./src/'),
      'src',
      'node_modules',
      'bower_components'
    ]
  }
};

// ----------------
// WEBPACK DEV SERVER

config.devServer = {
  // -d is shorthand for --debug --devtool source-map --output-pathinfo
  allowedHosts: [
    targetHost,
    '.test',
    'localhost'
  ],
  clientLogLevel: 'info',
  compress: true,
  contentBase: false, // path.join(__dirname, 'public'), // pass content base if not using nginx
  disableHostCheck: false,
  // filename: 'site.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  historyApiFallback: true,
  host: targetHost,

  // either use cli --hot (and --inline) or this config flag
  // needs webpack.HotModuleReplacementPlugin() which is now enabled automatically
  hot: pkgConfig.config.isWebpackDevServerHot,
  // hotOnly: true

  https: pkgConfig.config.isWebpackDevServerHTTPS
    ? {
      // key: fs.readFileSync('/path/to/server.key'),
      // cert: fs.readFileSync('/path/to/server.crt'),
      // ca: fs.readFileSync('/path/to/ca.pem')
    }
    : false,
  index: 'index.htm',
  inline: true,
  // lazy: true,
  noInfo: false,
  open: false,
  // openPage: '/different/page',
  overlay: {
    warnings: false,
    errors: true
  },
  port: devServerPort,
  // proxy: {
  //   '/api': 'http://localhost:3000'
  // },
  // public: 'myapp.test:80',
  publicPath,
  quiet: false,
  // socket: 'socket',
  // staticOptions: null,
  // stats: null,
  useLocalIp: false,
  // watchContentBase: true,
  // watchOptions: {
  //   poll: true
  // },
  before (app) {
    console.log('Webpack devserver middlewres before');
  },
  after (app) {
    console.log('Webpack devserver middlewres after');
  }
};

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          }
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 3,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        (production)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    },
    {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff2'
        }
      }]
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff'
        }
      }]
    },
    {
      test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-opentype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-truetype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/vnd.ms-fontobject'
        }
      }]
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'mimetype=image/svg+xml'
        }
      }]
    }
  ]
};

// ----------------
// PLUGINS

config.plugins = [];

// ----------------
// WEBPACK DEFINE PLUGIN
// ALWAYS

config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  'process.env.BROWSER': true,
  __CLIENT__: true,
  __SERVER__: false,
  __DEV__: development,
  __DEVELOPMENT__: development,
  __DEVTOOLS__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production,
  __HOST__: targetHost,
  __PORT_FRONT_APP_HTTP1__: pkgConfig.config.portFrontendAppHTTP, // JSON.stringify
  __PORT_FRONT_APP_HTTP2__: pkgConfig.config.portFrontendAppHTTS
}));

// ----------------
// Hot reloading and named modules

if (development && pkgConfig.config.isWebpackDevServerHot) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
} else {
  config.plugins.push(new webpack.HashedModuleIdsPlugin());
}

// ----------------
// WEBPACK BUILT IN OPTIMIZATION
// ALWAYS

// ModuleConcatenationPlugin
config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

// ----------------
// WEBPACK BUILT IN OPTIMIZATION
// IN PRODUCTION

if (production) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false,
      warnings: false
    },
    mangle: false,
    beautify: false,
    output: {
      space_colon: false,
      comments: false
    },
    extractComments: false,
    sourceMap: sourceMapType
  }));
}

// ----------------
// CODE SPLITTING

// config.plugins.push(new webpack.optimize.LimitChunkCountPlugin({maxChunks: 15}));
// config.plugins.push(new webpack.optimize.MinChunkSizePlugin({minChunkSize: 10000}));

// ----------------
// FileManagerPlugin

config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      {
        source: path.join(__dirname, 'src/preflight/*.{js,css}'),
        destination: outputPath
      }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// HtmlWebpackPlugin

config.plugins.push(new HtmlWebpackPlugin({
  title: `WEBPACK GUIDE - ${pkgConfig.name}`,
  filename: `${path.join(__dirname, 'public')}/index.html`,
  template: 'src/html/index.template.ejs',
  inject: true, // we specify manually where we want our entry outputs to be in the template
  // favicon: favicon.ico,
  hash: false,
  cache: false,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true,
  fsInlines: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
  minify: (development || testing)
    ? false
    : {
      minifyJS: true,
      minifyCSS: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true
    } // https://github.com/kangax/html-minifier#options-quick-reference
}));
config.plugins.push(new HtmlWebpackHarddiskPlugin());

// ----------------
// ExtractTextPlugin

config.plugins.push(new ExtractTextPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  disable: development,  // disable when development
  allChunks: true
}));

// ----------------
// POSTCSS LOADER CONFIG
// ALWAYS

// defined in .postcssrc.js

// ----------------
// BROWSERLIST CONFIG
// ALWAYS

// defined in .browserslistrc

module.exports = config;