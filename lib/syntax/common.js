/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 12:03 AM
 * To change this template use File | Settings | File Templates.
 */

var globalNsRoots = [];

var globalFunctions = [];

var Exception = ria.__API.Exception;

ria.__SYNTAX.PropertyDescriptor.prototype.isOfBooleanType = function () {
    return this.type && this.type.raw && this.type.raw.print_to_string() === 'Boolean';
};

function AccessNS(parts, top, node) {
    if (typeof parts === 'string')
        parts = parts.split('.');

    if (parts.length < 1)
        return top;

    var name = parts.shift();

    return AccessNS(parts, top
        ? make_node(UglifyJS.AST_Dot, node, {expression: top, property: name})
        : make_node(UglifyJS.AST_SymbolVar, node, { name: name }), node);
}

function TraverseNS(parts, top, right) {
    if (parts.length < 1)
        return top;

    var name = parts.shift();

    right = right
        ? make_node(UglifyJS.AST_Dot, null, { expression: right, property: name })
        : make_node(UglifyJS.AST_SymbolRef, null, { name: name });

    if (!top && globalNsRoots.indexOf(name) < 0)
        globalNsRoots.push(name);

    return TraverseNS(
        parts,
        make_node(UglifyJS.AST_Assign, null, {
            left: top
                ? make_node(UglifyJS.AST_Dot, null, {expression: top, property: name})
                : make_node(UglifyJS.AST_SymbolVar, null, { name: name }),
            operator: "=",
            right: make_node(UglifyJS.AST_Binary, null, {
                left: right,
                operator: '||',
                right: make_node(UglifyJS.AST_Object, null, {properties:[]})
            })
        }),
        right);
}

function CompileGenericTypes(types, node) {
    return make_node(UglifyJS.AST_Var, node, {
        definitions: types
            .map(function (d) {
                var name = d[0],
                    specs = d[1];

                return make_node(UglifyJS.AST_VarDef, node, {
                    name: make_node(UglifyJS.AST_SymbolVar, name.raw, { name: name.value }),
                    value: make_node(UglifyJS.AST_Call, node, {
                        expression: getNameTraversed('ria.__API'.split('.'), 'getGeneralizedType'),
                        args: [
                            name.raw,
                            make_node(UglifyJS.AST_Array, node, {elements: specs.map(function (_) { return _.raw; })})
                        ]
                    })
                })
            })
        })
}

/*function SymbolsCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_SymbolVar || node instanceof UglifyJS.AST_SymbolRef) {
        var name = node.name;
        if (['Class', 'Interface', 'Exception'].indexOf(name) >= 0) {
            return AccessNS('ria.__API.' + name, null, node);
        }
    }
}

compilers.push(SymbolsCompiler);*/

function CompileSELF(node, clazz) {
    return node.transform(new UglifyJS.TreeTransformer(function (node, descend) {
        if (node instanceof UglifyJS.AST_SymbolVar || node instanceof UglifyJS.AST_SymbolRef) {
            var name = node.name;
            if ('SELF' === name) {
                return AccessNS(clazz, null, node);
            }
        }
    }))
}

function ProcessSELF(token, clazz) {
    if (token instanceof ria.__SYNTAX.Tokenizer.SelfToken)
        return AccessNS(clazz);

    if (token instanceof ria.__SYNTAX.Tokenizer.VoidToken)
        return make_node(UglifyJS.AST_Undefined);

    return CompileSELF(token.raw, clazz);
}

function CompileReturnType(token, selfRefName, node) {
    if (token == undefined)
        return make_node(UglifyJS.AST_Null);

    if (token instanceof ria.__SYNTAX.Tokenizer.SelfToken)
        return AccessNS(selfRefName);

    if (token instanceof ria.__SYNTAX.Tokenizer.VoidToken)
        return make_node(UglifyJS.AST_Undefined);

    return CompileSELF(token.raw, selfRefName);
}

function CompilePublicSymbolDef(name, defTree, node) {
    return ria.__SYNTAX.isProtected(Array.isArray(name) ? name.join('.') : name) ? defTree : make_node(UglifyJS.AST_Assign, node, {
        left: AccessNS(name, null, node),
        operator: '=',
        right: defTree
    });
}