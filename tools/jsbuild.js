var path = require("path");
var fs = require("fs");
var vm = require("vm");
var sys = require("util");

var JsBuild3 = vm.createContext({
    sys           : sys,
    console       : console,
    require       : require,
    Path          : path,
    fs            : fs,
    UglifyJS      : require("uglify-js"),
    __CWD         : process.cwd()
});

function load_global(file) {
    file = path.resolve(path.dirname(module.filename), file);
    try {
        var code = fs.readFileSync(file, "utf8");
        return vm.runInContext(code, JsBuild3, file);
    } catch(ex) {
        // XXX: in case of a syntax error, the message is kinda
        // useless. (no location information).
        sys.debug("ERROR in file: " + file + " / " + ex);
        process.exit(1);
        return null;
    }
}

    ([
        "../lib/config.js",
        "../lib/jsbuild3.js",
        "../node_modules/emp.ria-framework/base/0.common.js",
        "../node_modules/emp.ria-framework/base/5.annotations.js",
        "../node_modules/emp.ria-framework/base/5.delegates.js",
        "../node_modules/emp.ria-framework/base/5.enum.js",
        "../node_modules/emp.ria-framework/base/5.identifier.js",
        "../node_modules/emp.ria-framework/base/6.interface.js",
        "../node_modules/emp.ria-framework/base/8.class.js",
        "../node_modules/emp.ria-framework/base/9.arrayof.js",
        "../node_modules/emp.ria-framework/base/9.classof.js",
        "../node_modules/emp.ria-framework/base/9.exception.js",
        "../node_modules/emp.ria-framework/base/9.implementerof.js",
        "../node_modules/emp.ria-framework/syntax/type-hints.js",
        "../lib/syntax/tokenizer.js",
        "../node_modules/emp.ria-framework/syntax/registry.js",
        "../node_modules/emp.ria-framework/syntax/parser2.js",
        "../node_modules/emp.ria-framework/syntax/annotations.js",
        "../node_modules/emp.ria-framework/syntax/class.js",
        "../node_modules/emp.ria-framework/syntax/delegate.js",
        "../node_modules/emp.ria-framework/syntax/exception.js",
        "../node_modules/emp.ria-framework/syntax/interface.js",
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
        "../lib/require/assets.js",
        "../lib/assets/jade.js",
        "../lib/assets/txt.js",
        "../lib/assets/json.js"
        ])
    .map(function(file){
            return path.join(path.dirname(fs.realpathSync(__filename)), file);
        })
    .forEach(load_global);

// XXX: perhaps we shouldn't export everything but heck, I'm lazy.
/*for (var i in JsBuild3) {
    if (JsBuild3.hasOwnProperty(i)) {
        console.info('global exports: ', i);
        exports[i] = JsBuild3[i];
    }
}*/

exports.PluginConfiguration = JsBuild3.PluginConfiguration;
exports.ModuleConfiguration = JsBuild3.ModuleConfiguration;
exports.Configuration = JsBuild3.Configuration;
exports.compile = JsBuild3.compile.bind(JsBuild3);
