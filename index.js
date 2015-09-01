var JsBuild3 = require("./tools/jsbuild"),
    fs = require('fs'),
    Path = require('path'),
    Parallel = require('paralleljs');

var CONSOLE = console;

module.exports = function (configPath, modules, done_, logger_) {
    "use strict";

    var done = done_ || function () {};
    var console = logger_ || CONSOLE;

    var CFG = new JsBuild3.Configuration(JSON.parse(fs.readFileSync(configPath)), configPath);

    for (var plugin in CFG.getPlugins()) {
        console.info(plugin.path);
    }

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
            outFile: Path.resolve(CFG.getBasePath() + M.getOutFile()),
            appClass: M.getAppClass(),
            configPath: configPath
        }
    });

    if (!toBuild.length) {
      console.info('Nothing to build');
      done();
      return ;
    }

    console.log('To build: ' + toBuild.map(function (_) { return _.name; }).join(', '));

    var p = new Parallel(toBuild);

    p.map(function (data) {
        console.info('Compile ' + data.name);
        try {
            var configPath = data.configPath;
            var JsBuild3 = require("../../../tools/jsbuild");
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