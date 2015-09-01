/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 12:03 PM
 * To change this template use File | Settings | File Templates.
 */

"use strict";

function AnnotationCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == 'ANNOTATION') {
        var tkz = new ria.__SYNTAX.Tokenizer(node.args);

        var method = ria.__SYNTAX.parseMember(tkz);

        ria.__SYNTAX.validateAnnotationDecl(method);

        //console.info('Found annotation ' + method.name + ' in ' + ns);

        return new UglifyJS.AST_Assign({
            left: getNameTraversed(ns.split('.'), method.name),
            operator: '=',
            right: new UglifyJS.AST_Call({
                expression: getNameTraversed('ria.__API'.split('.'), 'annotation'),
                args: [
                    new UglifyJS.AST_String({value: ns + '.' + method.name}),
                    new UglifyJS.AST_Array({elements: method.argsTypes.map(function (_) { return _.raw; })}),
                    new UglifyJS.AST_Array({elements: method.argsNames.map(function (_) { return new UglifyJS.AST_String({ value: _})})})
                ]
            })
        });
    }
}

compilers.push(AnnotationCompiler);