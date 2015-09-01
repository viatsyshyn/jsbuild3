/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/14/13
 * Time: 11:39 PM
 * To change this template use File | Settings | File Templates.
 */

function resolve(path, config) {
    var original = path;

    if (/^([0-9a-z_$]+(\.[0-9a-z_$]+)*)$/gi.test(path))
        path = path.replace(/\./gi, '/') + '.js';

    var libs = config.getLibs();
    var appRoot = config.getBasePath();
    var appCodeDir = config.getAppDir();

    for(var prefix in libs) if (libs.hasOwnProperty(prefix)) {
        if (path.substr(0, prefix.length) == prefix) {
            path = libs[prefix] + path;
            break;
        }
    }

    path = path.replace(/^~\//gi, appRoot);
    path = path.replace(/^\.\//gi, appCodeDir);

    if (!path.match(/^\//i) && !path.match(/^\w:\\/))
        path = appCodeDir + path;

    path = path.replace(/\/\//gi, '/');

    return path;
}

function RequireDeps(ast, config, path) {
    var deps = [];

    function DepWalker(node, name) {
        if (node instanceof UglifyJS.AST_Call
            && node.expression.print_to_string() == 'REQUIRE'
            && node.args.length == 1
            && node.args[0] instanceof UglifyJS.AST_String) {

            var arg = node.args[0].value;
            var dep = resolve(arg, config);
            //console.log('dep found: ' + dep + ', original: ' + arg);
            deps.push(dep);
        }
    }

    ast.transform(new UglifyJS.TreeTransformer(DepWalker));

    return deps;
}

addDepsCollector(RequireDeps);

function RequireCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call
        && node.expression.print_to_string() == 'REQUIRE'
        && node.args.length == 1
        && node.args[0] instanceof UglifyJS.AST_String) {

        return make_node(UglifyJS.AST_BlockStatement, node, {body: []});
    }
}

compilers.push(RequireCompiler);