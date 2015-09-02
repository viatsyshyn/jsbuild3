var path = require("path");
var fs = require("fs");
var vm = require("vm");
var sys = require("util");
var CONSOLE = console;

module.exports = function (console, frameworkPath, plugins_paths) {
    var JsBuild3 = vm.createContext({
        sys: sys,
        console: console || CONSOLE,
        require: require,
        Path: path,
        fs: fs,
        UglifyJS: require("uglify-js"),
        __CWD: process.cwd()
    });

    function load_global(file) {
        file = path.resolve(path.dirname(module.filename), file);
        try {
            var code = fs.readFileSync(file, "utf8");
            return vm.runInContext(code, JsBuild3, file);
        } catch (ex) {
            // XXX: in case of a syntax error, the message is kinda
            // useless. (no location information).
            console.error("ERROR in file: " + file + " / " + ex);
            process.exit(1);
            return null;
        }
    }

    ([
        "../lib/config.js",
        "../lib/jsbuild3.js",
        frameworkPath + "/base/0.common.js",
        frameworkPath + "/base/5.annotations.js",
        frameworkPath + "/base/5.delegates.js",
        frameworkPath + "/base/5.enum.js",
        frameworkPath + "/base/5.identifier.js",
        frameworkPath + "/base/6.interface.js",
        frameworkPath + "/base/8.class.js",
        frameworkPath + "/base/9.arrayof.js",
        frameworkPath + "/base/9.classof.js",
        frameworkPath + "/base/9.exception.js",
        frameworkPath + "/base/9.implementerof.js",
        frameworkPath + "/syntax/type-hints.js",
        "../lib/syntax/tokenizer.js",
        frameworkPath + "/syntax/registry.js",
        frameworkPath + "/syntax/parser2.js",
        frameworkPath + "/syntax/annotations.js",
        frameworkPath + "/syntax/class.js",
        frameworkPath + "/syntax/delegate.js",
        frameworkPath + "/syntax/exception.js",
        frameworkPath + "/syntax/interface.js",
        "../lib/syntax/compiler.js",
        "../lib/syntax/common.js",
        "../lib/syntax/ns.js",
        "../lib/syntax/identifier.js",
        "../lib/syntax/enum.js",
        "../lib/syntax/delegate.js",
        "../lib/syntax/annotation.js",
        "../lib/syntax/interface.js",
        "../lib/syntax/class.js",
        "../lib/syntax/exception.js",
        "../lib/syntax/post.js",
        "../lib/require/deps.js",
        "../lib/require/assets.js"
    ].concat(plugins_paths))
        .map(function (file) {
            return path.resolve(__dirname, file);
        })
        .forEach(load_global);

    // XXX: perhaps we shouldn't export everything but heck, I'm lazy.
    /*for (var i in JsBuild3) {
     if (JsBuild3.hasOwnProperty(i)) {
     console.info('global exports: ', i);
     exports[i] = JsBuild3[i];
     }
     }*/

    var exports = {};
    exports.PluginConfiguration = JsBuild3.PluginConfiguration;
    exports.ModuleConfiguration = JsBuild3.ModuleConfiguration;
    exports.Configuration = JsBuild3.Configuration;
    exports.compile = JsBuild3.compile.bind(JsBuild3);

    return exports;
};
