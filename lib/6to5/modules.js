/**
 * Created by viatsyshyn on 12/3/14.
 */

var t = require('6to5/lib/6to5/types'),
    _ = require("lodash");

function ModuleFormatter() {

}

ModuleFormatter.prototype._template = function (template, keepExpression) {
    var node = template.body[0];

    if (!keepExpression && t.isExpressionStatement(node)) {
        node = node.expression;

        if (t.isParenthesizedExpression(node)) node = node.expression;
    }

    return node;
};

ModuleFormatter.prototype._pushStatement = function (ref, nodes) {
    if (t.isClass(ref) || t.isFunction(ref)) {
        if (ref.id) {
            nodes.push(t.toStatement(ref));
            ref = ref.id;
        }
    }
    return ref;
};

ModuleFormatter.prototype._hoistExport = function (declar, assign) {
    if (t.isFunctionDeclaration(declar)) {
        assign._blockHoist = true;
    }

    return assign;
};


ModuleFormatter.prototype.transform = function (ast) {
    // this is ran after all transformers have had their turn at modifying the ast
    // feel free to modify this however
    //console.info('transform', ast);
};

ModuleFormatter.prototype.import = function (node, nodes) {
    // node is an ImportDeclaration
    nodes.push(this._template({
        "type":"Program",
        "body":[{
            "type":"ExpressionStatement",
            "expression":{
                "type":"CallExpression",
                "callee":{
                    "type":"Identifier",
                    "name":"REQUIRE"},
                "arguments":[{
                    "type":"Identifier",
                    "name":node.source.raw}]}}]}, true));
};

ModuleFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
    // specifier is an ImportSpecifier
    // node is an ImportDeclaration
    console.log('importSpecifier', specifier, node);
};

ModuleFormatter.prototype.export = function (node, nodes) {
    //console.info('export', node);

    var declar = node.declaration;

    if (node.default) {
        nodes.push(this._template({
            "type":"Program",
            "body":[{
                "type":"ExpressionStatement",
                "expression":{
                    "type":"AssignmentExpression",
                    "operator":"=",
                    "left":{
                        "type":"MemberExpression",
                        "object":{
                            "type":"Identifier",
                            "name":"exports"},
                        "property":{
                            "type":"Identifier",
                            "name":"default"},
                        "computed":false},
                    "right":{
                        "type":"Identifier",
                        "name": this._pushStatement(declar, nodes)}}}]}, true));
    } else {
        var assign;

        if (t.isVariableDeclaration(declar)) {
            var decl = declar.declarations[0];

            if (decl.init) {
                decl.init = this._template({
                    "type":"Program",
                    "body":[{
                        "type":"ExpressionStatement",
                        "expression":{
                            "type":"AssignmentExpression",
                            "operator":"=",
                            "left":{
                                "type":"MemberExpression",
                                "object":{
                                    "type":"Identifier",
                                    "name":"exports"},
                                "property": decl.id,
                                "computed":false},
                            "right": decl.init}}]});
            }

            nodes.push(declar);
        } else {
            assign = this._template({
                "type":"Program",
                "body":[{
                    "type":"ExpressionStatement",
                    "expression":{
                        "type":"AssignmentExpression",
                        "operator":"=",
                        "left":{
                            "type":"MemberExpression",
                            "object":{
                                "type":"Identifier",
                                "name":"exports"},
                            "property":declar.id,
                            "computed":false},
                        "right":declar.id}}]}, true);

            nodes.push(t.toStatement(declar));
            nodes.push(assign);

            this._hoistExport(declar, assign);
        }
    }
};

ModuleFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
    // specifier is an ExportSpecifier
    // node is an ExportDeclaration
    console.log('exportSpecifier', specifier, node);
};

exports.ModuleFormatter = ModuleFormatter;
