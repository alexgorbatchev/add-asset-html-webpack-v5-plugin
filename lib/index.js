'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

function _htmlWebpackPlugin() {
  const data = _interopRequireDefault(require('html-webpack-plugin'));

  _htmlWebpackPlugin = function _htmlWebpackPlugin() {
    return data;
  };

  return data;
}

function _pEachSeries() {
  const data = _interopRequireDefault(require('p-each-series'));

  _pEachSeries = function _pEachSeries() {
    return data;
  };

  return data;
}

function _micromatch() {
  const data = _interopRequireDefault(require('micromatch'));

  _micromatch = function _micromatch() {
    return data;
  };

  return data;
}

function _crypto() {
  const data = _interopRequireDefault(require('crypto'));

  _crypto = function _crypto() {
    return data;
  };

  return data;
}

function _globby() {
  const data = _interopRequireDefault(require('globby'));

  _globby = function _globby() {
    return data;
  };

  return data;
}

function _fs() {
  const data = _interopRequireDefault(require('fs'));

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require('path'));

  _path = function _path() {
    return data;
  };

  return data;
}

function _webpack() {
  const data = _interopRequireDefault(require('webpack'));

  _webpack = function _webpack() {
    return data;
  };

  return data;
}

function _util() {
  const data = require('util');

  _util = function _util() {
    return data;
  };

  return data;
}

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err);
      }
      _next(undefined);
    });
  };
}

const fsReadFileAsync = (0, _util().promisify)(_fs().default.readFile);
/**
 * Pushes the content of the given filename to the compilation assets
 * @param {string} resolvedFilename
 * @param {WebpackCompilation} compilation
 * @returns {string} file basename
 */

function addFileToAssetsWebpack5(filename, compilation) {
  const resolvedFilename = _path().default.resolve(
    compilation.compiler.context,
    filename
  );

  return fsReadFileAsync(resolvedFilename)
    .then(source => new (_webpack()).default.sources.RawSource(source, true))
    .catch(() =>
      Promise.reject(
        new Error(`HtmlWebpackPlugin: could not load file ${resolvedFilename}`)
      )
    )
    .then(rawSource => {
      const basename = _path().default.basename(resolvedFilename);

      compilation.fileDependencies.add(resolvedFilename);
      compilation.emitAsset(basename, rawSource);
      return basename;
    });
}

class AddAssetHtmlPlugin {
  constructor(assets = []) {
    this.assets = Array.isArray(assets) ? assets.slice().reverse() : [assets];
    this.addedAssets = [];
  }
  /* istanbul ignore next: this would be integration tests */

  apply(compiler) {
    compiler.hooks.compilation.tap('AddAssetHtmlPlugin', compilation => {
      let beforeGenerationHook;
      let alterAssetTagsHook;

      if (_htmlWebpackPlugin().default.version >= 4) {
        const hooks = _htmlWebpackPlugin().default.getHooks(compilation);

        beforeGenerationHook = hooks.beforeAssetTagGeneration;
        alterAssetTagsHook = hooks.alterAssetTags;
      } else {
        const hooks = compilation.hooks;
        beforeGenerationHook = hooks.htmlWebpackPluginBeforeHtmlGeneration;
        alterAssetTagsHook = hooks.htmlWebpackPluginAlterAssetTags;
      }

      beforeGenerationHook.tapPromise('AddAssetHtmlPlugin', htmlPluginData =>
        this.addAllAssetsToCompilation(compilation, htmlPluginData)
      );
      alterAssetTagsHook.tap('AddAssetHtmlPlugin', htmlPluginData => {
        const assetTags = htmlPluginData.assetTags;

        if (assetTags) {
          this.alterAssetsAttributes(assetTags);
        } else {
          this.alterAssetsAttributes({
            scripts: htmlPluginData.body
              .concat(htmlPluginData.head)
              .filter(({ tagName }) => tagName === 'script'),
          });
        }
      });
    });
  }

  addAllAssetsToCompilation(compilation, htmlPluginData) {
    var _this = this;

    return _asyncToGenerator(function*() {
      const handledAssets = yield (0, _utils.handleUrl)(_this.assets);
      yield (0,
      _pEachSeries()
        .default)(handledAssets, asset => _this.addFileToAssets(compilation, htmlPluginData, asset));
      return htmlPluginData;
    })();
  }

  alterAssetsAttributes(assetTags) {
    this.assets
      .filter(
        asset => asset.attributes && Object.keys(asset.attributes).length > 0
      )
      .forEach(asset => {
        assetTags.scripts
          .map(({ attributes }) => attributes)
          .filter(attrs => this.addedAssets.includes(attrs.src))
          .forEach(attrs => Object.assign(attrs, asset.attributes));
      });
  }

  addFileToAssets(
    compilation,
    htmlPluginData,
    {
      filepath,
      typeOfAsset = 'js',
      includeRelatedFiles = true,
      hash = false,
      publicPath,
      outputPath,
      files = [],
    }
  ) {
    var _this2 = this;

    return _asyncToGenerator(function*() {
      if (!filepath) {
        const error = new Error('No filepath defined');
        compilation.errors.push(error);
        throw error;
      }

      const fileFilters = Array.isArray(files) ? files : [files];

      if (fileFilters.length > 0) {
        const shouldSkip = !fileFilters.some(file =>
          _micromatch().default.isMatch(htmlPluginData.outputName, file)
        );

        if (shouldSkip) {
          return;
        }
      }

      const addedFilename = yield (htmlPluginData.plugin.addFileToAssets ||
        addFileToAssetsWebpack5)(filepath, compilation);
      let suffix = '';

      if (hash) {
        const md5 = _crypto().default.createHash('md5');

        md5.update(compilation.assets[addedFilename].source());
        suffix = `?${md5.digest('hex').substr(0, 20)}`;
      }

      const resolvedPublicPath =
        typeof publicPath === 'undefined'
          ? (0, _utils.resolvePublicPath)(compilation, addedFilename)
          : (0, _utils.ensureTrailingSlash)(publicPath);
      const resolvedPath = `${resolvedPublicPath}${addedFilename}${suffix}`;
      htmlPluginData.assets[typeOfAsset].unshift(resolvedPath);
      (0, _utils.resolveOutput)(compilation, addedFilename, outputPath);

      _this2.addedAssets.push(resolvedPath);

      if (includeRelatedFiles) {
        const relatedFiles = yield (0, _globby().default)(`${filepath}.*`);
        yield Promise.all(
          relatedFiles.sort().map(
            /*#__PURE__*/
            (function() {
              var _ref = _asyncToGenerator(function*(relatedFile) {
                const addedMapFilename = yield (htmlPluginData.plugin
                  .addFileToAssets || addFileToAssetsWebpack5)(
                  relatedFile,
                  compilation
                );
                (0,
                _utils.resolveOutput)(compilation, addedMapFilename, outputPath);
              });

              return function(_x) {
                return _ref.apply(this, arguments);
              };
            })()
          )
        );
      }
    })();
  }
}

exports.default = AddAssetHtmlPlugin;
module.exports = exports.default;
