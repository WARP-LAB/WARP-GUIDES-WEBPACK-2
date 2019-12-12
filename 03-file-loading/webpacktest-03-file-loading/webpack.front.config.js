// webpack config file

'use strict';

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // Use while PostCSS is not introduced

// ----------------
// ENV
let tierName;
let development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
if (production) {
  tierName = 'production';
} else if (staging) {
  tierName = 'staging';
} else if (testing) {
  tierName = 'testing';
} else {
  tierName = 'development';
  development = true; // fall back to development
}

// ----------------
// Output filesystem path
const appPathFsBase = path.join(__dirname, 'public/'); // file system path, used to set application base path for later use
const appPathFsBuild = path.join(appPathFsBase, 'assets/'); // file system path, used to set webpack.config.output.path a.o. uses

// ----------------
// Output URL path
// File system paths do not necessarily reflect in URL paths, thus construct them separately
const appPathUrlBuildRelativeToApp = 'assets/'; // URL path for appPathFsBuild, relative to app base path
const appPathUrlBuildRelativeToServerRoot = `/${appPathUrlBuildRelativeToApp}`; // URL path for appPathFsBuild, relative to webserver root

// ----------------
// Host, port, output public path based on env and props
// Declarations
let appPathUrlBuildPublicPath; // will be constructed along the way and used in webpack.config.output.publicPath a.o.
// Definitions
appPathUrlBuildPublicPath = appPathUrlBuildRelativeToApp;

// ----------------
// Relative URL type based on env, or false if not relative
// Assumed values to be used: 'app-index-relative'; 'server-root-relative'; false (if not relative, but FQDN used)
// Value MUST be 'app-index-relative' if index.html is opened from local filesystem directly and CSS is not inlined in JS
const relativeUrlType = 'app-index-relative';

// ----------------
// MiniCssExtractPlugin publicPath
const miniCssExtractPublicPath = (development) ? appPathUrlBuildPublicPath : (relativeUrlType === 'app-index-relative') ? './' : appPathUrlBuildPublicPath;

// ----------------
// Source map type
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// Setup log
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToApp', appPathUrlBuildRelativeToApp);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToServerRoot', appPathUrlBuildRelativeToServerRoot);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildPublicPath', appPathUrlBuildPublicPath);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ----------------
// BASE CONFIG
let config = {
  mode: development ? 'development' : 'production',
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    index: [
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: appPathFsBuild,
    publicPath: appPathUrlBuildPublicPath,
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src/'),
      'node_modules',
      'bower_components'
    ],
    alias: {
      extras: path.resolve(__dirname, 'src/helpers/')
    }
  }
};

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: [
        development
        ? {
          loader: 'style-loader',
          options: {}
        }
        : {
          loader: MiniCssExtractPlugin.loader,
          options: {
            publicPath: miniCssExtractPublicPath
          }
        },
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
            sourceMap: true,
            keepQuery: true
          }
        }
      ],
    },
    {
      test: /\.(scss)$/,
      use: [
        development
        ? {
          loader: 'style-loader',
          options: {}
        }
        : {
          loader: MiniCssExtractPlugin.loader,
          options: {
            publicPath: miniCssExtractPublicPath
          }
        },
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
            sourceMap: true,
            keepQuery: true
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            prependData: `$env: ${tierName};`
          }
        }
      ],
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        },
        {
          loader: 'image-webpack-loader',
          options: {
            disable: development
          }
        }
      ]
    },
    {
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    }
  ]
};

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: !development, // can override
  minimizer: [
    new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      // include: '',
      // exclude: '',
      chunkFilter: (chunk) => { return true; },
      cache: true,
      cacheKeys: (defaultCacheKeys, file) => { return defaultCacheKeys; },
      parallel: true,
      sourceMap: !!sourceMapType,
      // minify: (file, sourceMap) => {},
      warningsFilter: (warning, source, file) => { return true; },
      extractComments: false,
      terserOptions: {
        // ecma: undefined,
        warnings: true,
        parse: {},
        compress: {},
        mangle: false,
        module: false,
        output: {
          comments: false
        },
        sourceMap: false,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false
      }
    })
    // new OptimizeCSSAssetsPlugin({}) // Use while PostCSS is not introduced
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// Plugins as enabled OOB by webpack based on mode
// https://webpack.js.org/configuration/mode/
//
// development
// - NamedChunksPlugin
// - NamedModulesPlugin
//
// production
// - FlagDependencyUsagePlugin
// - FlagIncludedChunksPlugin
// - ModuleConcatenationPlugin
// - NoEmitOnErrorsPlugin
// - OccurrenceOrderPlugin
// - SideEffectsFlagPlugin
// - TerserPlugin
//
// none
// - none enabled

// ----------------
// DefinePlugin
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': (development) ? 'development' : 'production',
    'BROWSER': true
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEVTOOLS__: development,
  __DEV__: development,
  __PROD__: !development,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production
}));

// ----------------
// CopyPlugin
config.plugins.push(new CopyPlugin([
  {
    from: path.join(__dirname, 'src/preflight/*.{js,css}'),
    to: appPathFsBuild,
    flatten: true,
    toType: 'dir'
  }
]));

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: '[name].css',
  chunkFilename: '[id].css',
}));

module.exports = config;