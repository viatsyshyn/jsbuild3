/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/14/13
 * Time: 11:39 PM
 * To change this template use File | Settings | File Templates.
 */

globalNsRoots.push('__ASSETS');

function resolveAsset(path, config) {
    var appRoot = config.getBasePath();
    var appAssetsDir = config.getAssetsDir() || appRoot;

    // todo: move this to plugin
    if (/i18n\//.test(path)) {
        path = path.replace(/i18n\//, 'i18n/' + config.getOption('i18n').locale + '/');
    }
    // end

    path = path.replace(/^~\//, appRoot);
    path = path.replace(/^\.\//, appAssetsDir);

    if (!path.match(/^\w\:/i) && !path.match(/^\//i))
        path = appAssetsDir + path;

    path = path.replace(/\/\//gi, '/');
    path = path.replace(/\.\/\.\//gi, './');

    return path;
}

var AssetsAliases = ['ASSET', 'ria.templates.TemplateBind'];

var AssetsCache = {}, AssetsCache2 = {};

function AssetsDeps(ast, config, path) {
    var deps = [];

    function DepWalker(node, name) {
        if (node instanceof UglifyJS.AST_Call
            && AssetsAliases.indexOf(node.expression.print_to_string()) >= 0
            && node.args.length == 1
            && node.args[0] instanceof UglifyJS.AST_String) {

            var arg = node.args[0].value;
            var dep = resolveAsset(arg, config);
            var t = AssetsCache2[arg] = AssetsCache[dep] = AssetsCache[dep] || ('_' + Math.random().toString(36).substr(2));
            //console.log('asset found: ' + dep + ', original: ' + arg + ', cache: ' + t);
            deps.push(dep);
        }
    }

    ast.transform(new UglifyJS.TreeTransformer(DepWalker));

    return deps;
}

addDepsCollector(AssetsDeps);

function AssetCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call
        && AssetsAliases.indexOf(node.expression.print_to_string()) >= 0
        && node.args.length == 1
        && node.args[0] instanceof UglifyJS.AST_String
        && AssetsCache2[node.args[0].value]) {

        node.args[0].value = AssetsCache2[node.args[0].value];
        return node;
    }
}

compilers.push(AssetCompiler);

globalFunctions.push(UglifyJS.parse(function ASSET(id) { return __ASSETS[id];}.toString()).body[0]);