/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 12:03 PM
 * To change this template use File | Settings | File Templates.
 */

"use strict";

function DelegateCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == 'DELEGATE') {
        var tkz = new ria.__SYNTAX.Tokenizer(node.args);

        var genericTypes = [];
        if (tkz.check(ria.__SYNTAX.Tokenizer.GenericToken)) {
            genericTypes = tkz.next().value.types;
        }

        var method = ria.__SYNTAX.parseMember(tkz);

        //ria.__SYNTAX.validateDelegateDecl(method);

        return make_node(UglifyJS.AST_Assign, node, {
            left: getNameTraversed(ns.split('.'), method.name),
            operator: '=',
            right: make_node(UglifyJS.AST_Call, node, {
                expression: make_node(UglifyJS.AST_Function, node, {
                    argnames: [],
                    body: [].concat(
                            [genericTypes.length ? CompileGenericTypes(genericTypes, node) : null],
                            [make_node(UglifyJS.AST_Var, node, {
                                definitions: [make_node(UglifyJS.AST_VarDef, node, {
                                    name: make_node(UglifyJS.AST_SymbolRef, node, {name: 'd'}),
                                    value: make_node(UglifyJS.AST_Call, null, {
                                        expression: getNameTraversed('ria.__API'.split('.'), 'delegate'),
                                        args: [
                                            make_node(UglifyJS.AST_String, null, {value: ns + '.' + method.name}),
                                            CompileReturnType(method.retType, null, node),
                                            make_node(UglifyJS.AST_Array, null, {elements: method.argsTypes.map(function (_) { return _.raw; })}),
                                            make_node(UglifyJS.AST_Array, null, {elements: method.argsNames.map(function (_) { return new UglifyJS.AST_String({ value: _})})}),
                                            make_node(UglifyJS.AST_Array, null, {elements: genericTypes ? genericTypes.map(function (_) { return new UglifyJS.AST_SymbolVar({ name: _[0].value })}) : []})
                                        ]
                                    })
                                })]
                            })],
                            [ToAst('d.OF = ria.__API.OF')],
                            [ToAst('return d')]
                        ).filter(function (_) { return _ })
                    }),
                args: []
            })
        });
    }
}

compilers.push(DelegateCompiler);