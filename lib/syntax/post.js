/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 12:03 AM
 * To change this template use File | Settings | File Templates.
 */

function SymbolsCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_SymbolVar || node instanceof UglifyJS.AST_SymbolRef) {
        var name = node.name;
        if (['Class', 'Interface', 'Exception'].indexOf(name) >= 0) {
            return AccessNS('ria.__API.' + name, null, node);
        }
    }
}

compilers.push(SymbolsCompiler);

function XxxOfCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call) {
        var name = node.expression.print_to_string();
        if (['ArrayOf', 'ClassOf', 'ImplementerOf'].indexOf(name) >= 0) {
            return make_node(UglifyJS.AST_Call, node, {
                expression: AccessNS('ria.__API.' + name, null, node),
                args: node.args
            })
        }
    }
}

compilers.push(XxxOfCompiler);

function ValidatorCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call) {
        var name = node.expression.print_to_string();
        if (['VALIDATE_ARG', 'VALIDATE_ARGS'].indexOf(name) >= 0) {
            return make_node(UglifyJS.AST_BlockStatement, node, {body: []})
        }
    }
}

compilers.push(ValidatorCompiler);

function TestsEDeclCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call) {
        var name = node.expression.print_to_string();
        if (['CLASS_E', 'INTERFACE_E', 'DELEGATE_E', 'ANNOTATION_E', 'EXCEPTION_E', 'ENUM_E', 'IDENTIFIER_E'].indexOf(name) >= 0) {
            return make_node(UglifyJS.AST_BlockStatement, node, {body: []})
        }
    }
}

compilers.push(TestsEDeclCompiler);

function AssertCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call) {
        var name = node.expression.print_to_string();
        if (['Assert'].indexOf(name) >= 0) {
            return make_node(UglifyJS.AST_BlockStatement, node, {body: []})
        }
    }
}

compilers.push(AssertCompiler);

function ConstToVarPostProcessor(node, descend) {
    if (node instanceof UglifyJS.AST_Const) {
        return make_node(UglifyJS.AST_Var, node, {
            definitions: node.definitions
        });
    }
}