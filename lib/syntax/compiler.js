"use strict";

var compilers = [];

function getNameTraversed(parts, name) {
    if (parts.length < 1)
        return new UglifyJS.AST_SymbolRef({ name: name });

    var top = parts.pop();
    return new UglifyJS.AST_Dot({
        expression: getNameTraversed(parts, top),
        property: name
    });
}

function SyntaxCompile(ns, node, descend) {
    node.transform(new UglifyJS.TreeTransformer(NsCompiler));

    return compilers.reduce(function (node, _) {
        //console.info(_.name, node.print_to_string ? node.print_to_string() : '');
        return node.transform(new UglifyJS.TreeTransformer(function (node, descend) {
            return _(ns || 'window', node, descend);
        }));
    }, node);
}