/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 9:49 AM
 * To change this template use File | Settings | File Templates.
 */

function NsCompiler(node, descend) {
    if (node instanceof UglifyJS.AST_Call && (node.expression.print_to_string() == 'NS' || node.expression.print_to_string() == 'NAMESPACE')) {
        var ns = node.args[0].value;

        var body = node.args[1].transform(new UglifyJS.TreeTransformer(function (node, descend) {
            return SyntaxCompile(ns, node, descend);
        }));

        var parts = ns.split(".");
        return (
            make_node(UglifyJS.AST_Call, node, {
                expression: make_node(UglifyJS.AST_Function, null, {
                    argnames: [],
                    body: [
                        make_node(UglifyJS.AST_SimpleStatement, null, {
                            body: TraverseNS(parts, null)
                        }),
                        make_node(UglifyJS.AST_SimpleStatement, null, {
                            body: make_node(UglifyJS.AST_Call, null, {
                                expression: node.args[1],
                                args: []
                            })
                        })
                    ]
                }),
                args: []
            })
        );
    }
}