"use strict";

var PATH = require('path');

function merge(obj, ext) {
    for (var i in ext) if (ext.hasOwnProperty(i)) {
        obj[i] = ext[i];
    }
    return obj;
}

/**
 * @class PluginConfiguration
 * @constructor
 * @param {String} path
 * @param {Object} config
 */
function PluginConfiguration(path, config) {
    this.path = PATH.resolve(path);
    this.config = merge({}, config);
}

/**
 * @class ModuleConfiguration
 * @constructor
 * @param {Object} params
 * @param {Configuration} config
 */
function ModuleConfiguration(params, config) {
    this.prepend = [].slice.call(params.prepend || []);
    this.exclude = [].slice.call(params.exclude || []);
    this.options = merge({}, params.options || {});
    this.name = params.name;
    this.inFile = params['in'];
    this.outFile = params['out'];
    this.appClass = params['app'];
    this.appDir = params.appDir ? PATH.resolve(config.getBasePath() + (params.appDir || 'app')) + '/' : null;
    this.assetsDir = params.assetDir ? PATH.resolve(config.getBasePath() + (params.assetsDir || 'assets')) + '/' : null;
    this.libs = params.libs || {};
    this.globals = [].slice.call(params.globals || []);
    this.env = params.env;
}

ModuleConfiguration.prototype = {
    /** @returns {String[]} */
    getPrepend: function () { return this.prepend; },
    /** @returns {String[]} */
    getExclude: function () { return this.exclude; },
    /** @returns Object */
    getOptions: function () { return this.options; },
    /** @returns String */
    getName: function () { return this.name; },
    /** @returns String */
    getInFile: function () { return this.inFile; },
    /** @returns String */
    getAppClass: function () { return this.appClass; },
    /** @returns String */
    getOutFile: function () { return this.outFile; },
    /** @returns String */
    getAppDir: function () { return this.appDir; },
    /** @returns String */
    getAssetsDir: function () { return this.assetsDir; },
    /** @returns Object */
    getLibs: function () { return this.libs; },
    /** @returns String[] */
    getGlobals: function () { return this.globals; },
    /** @returns Object */
    getOption: function (name) { return this.options[name] || null; },
    /** @return String */
    getEnv: function () { return this.env; }
};

/**
 * @class Configuration
 * @constructor
 * @param {String} config
 * @param {String} path
 */
function Configuration(config, path) {
    if (config.version != 3)
        throw Error('Unsupported configuration file. Version: ' + config.version);

    this.env = config.env || "browser";

    this.basePath = PATH.dirname(path) + '/';

    this.appDir = PATH.resolve(this.basePath + (config.appDir || 'app')) + '/';
    this.assetsDir = PATH.resolve(this.basePath + (config.assetsDir || 'assets')) + '/';

    this.libs = config.libs || {};

    this.options = merge({}, config.options || {});
    this.moduleConfig = null;

    var that = this;
    this.plugins = (config.plugins || []).map(function (plugin) { return new PluginConfiguration(that.basePath + plugin, that); });
    this.modules = (config.modules || []).map(function (module) { return new ModuleConfiguration(module, that); });
}

Configuration.prototype = {
    /** @returns String */
    getBasePath: function () { return PATH.resolve(this.basePath) + '/'; },
    /** @returns String */
    getAppDir: function () { return this.moduleConfig.getAppDir() || this.appDir; },
    /** @returns String */
    getAssetsDir: function () { return this.moduleConfig.getAssetsDir() || this.assetsDir; },
    /** @returns Object */
    getLibs: function () { return merge(merge({}, this.moduleConfig.getLibs()), this.libs); },
    getGlobals: function () { return [].concat(this.moduleConfig.getGlobals(), this.globals || []); },
    getPrepend: function () { return [].concat(this.moduleConfig.getPrepend(), this.prepend || []); },
    /** @returns ModuleConfiguration[] */
    getModules: function () { return [].slice.call(this.modules); },
    /** @returns PluginConfiguration[] */
    getPlugins: function () { return [].slice.call(this.plugins); },
    /**
     * @param {String} name
     * @returns Object
     */
    getPluginConfiguration: function (name) {
        var cfg = merge(merge({}, this.options), this.moduleConfig.getOptions() || {});
        return cfg.hasOwnProperty(name) ? cfg[name] : {};
    },
    /** @param {ModuleConfiguration} config */
    setModuleConfig: function (config) { this.moduleConfig = config; },
    /** @returns Object */
    getOption: function (name) { return this.moduleConfig.getOption(name) || this.options[name] || null; },
    getEnv: function () { return this.moduleConfig.getEnv() || this.env; }
};
