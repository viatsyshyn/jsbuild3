var fs = require('fs'),
    path = require('path'),
    Parallel = require('paralleljs');

var CONSOLE = console;

module.exports = function (configPath, modules, done_, logger_) {
    "use strict";

    var done = done_ || function () {};
    var console = logger_ || CONSOLE;

    var configPathBase = path.dirname(configPath);
    var configJSON = JSON.parse(fs.readFileSync(configPath));

    if (configJSON.version != 3)
        throw Error('Unsupported configuration file. Version: ' + config.version);

    var configFrameworkPath = (configJSON.framework ? path.resolve(configPathBase, configJSON.framework) : ''),
        requiredFrameworkPath = require('emp.ria-framework')._mypath;

    var frameworkPath = configFrameworkPath || requiredFrameworkPath || path.resolve(configPathBase, 'node_modules/emp.ria-framework');

    if (!frameworkPath) {
        console.error('Please specify framework path in config or npm install emp.ria-framework');
        done(false);
        return ;
    }

    var plugins = (typeof configJSON.assets === 'object' ? configJSON.assets : null) || { // defaults
        "jade": { "compiler": "emp.ria-jade", "options": { "client": true, "compileDebug": false, "self": true } },
        "txt": {},
        "json": {}
    };

    var plugins_paths = Object.keys(plugins).map(function (_) {
        var cfg = plugins[_] || {};
        return cfg.path ? path.resolve(configPathBase, cfg.path) : path.resolve(__dirname, 'lib/assets/' + _ + '.js');
    });

    var JsBuild3 = require("./tools/jsbuild")(console, frameworkPath, plugins_paths);

    var CFG = new JsBuild3.Configuration(configJSON, configPath);

    var MODULES = modules.filter(function (_) { return _ });
    var toBuild = CFG.getModules();
    if (MODULES.length) {
        toBuild = toBuild.filter(function (_) {
            return MODULES.indexOf(_.getName()) >= 0;
        });
    }

    toBuild = toBuild.map(function (M) {
        return {
            name: M.getName(),
            inFile: M.getInFile() || M.getAppClass(),
            outFile: path.resolve(CFG.getBasePath() + M.getOutFile()),
            appClass: M.getAppClass(),
            configPath: configPath
        }
    });

    console.log('Framework path: ' + frameworkPath);

    if (!toBuild.length) {
      console.warn('Nothing to build');
      done();
      return ;
    }

    console.log('To build: ' + toBuild.map(function (_) { return _.name; }).join(', '));

    var p = new Parallel(toBuild);

    p.map(function (data) {
        console.info('Compile ' + data.name);
        console.log('Framework path: ' + frameworkPath);
        try {
            var configPath = data.configPath;
            var JsBuild3 = require("../../../tools/jsbuild")(console, frameworkPath);
            var fs = require('fs');

            var CFG = new JsBuild3.Configuration(JSON.parse(fs.readFileSync(configPath)), configPath);
            var M = CFG.getModules().filter(function(_) { return _.getName() == data.name; })[0];
            CFG.setModuleConfig(M);

            var fileContents = JsBuild3.compile(data.inFile, CFG, data.appClass);
            fs.writeFileSync(data.outFile, fileContents, "utf-8");

            return null;
        } catch (e) {
            return 'Error processing ' + data.name + ': ' + e.message;
        }
    }).then(function (data) {

        data
            .filter(function (_) { return _; })
            .forEach(function (_) { console.error(_); });

        console.info("done");
        done();
    });
};
