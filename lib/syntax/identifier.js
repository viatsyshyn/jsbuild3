/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
"use strict";

function getIdentifierImplementation(name, fullName, body) {
    var values = [];
    for(var k in body) if (body.hasOwnProperty(k)) {
        var v = body[k];
        values.push('values[' + v.print_to_string() + '] = IdName.' + k + ' = new IdNameImpl(' + v.print_to_string() + ')' );
    }

    return UglifyJS.parse(function wrapper() {
        var values = {};
        function IdName(value) {
            return values.hasOwnProperty(value) ? values[value] : (values[value] = new IdNameImpl(value));
        }
        ria.__API.identifier(IdName, 'IdFullName');

        function IdNameImpl(value) {
            this.valueOf = function () { return value; };
            this.toString = function toString() { return '[IdFullName#' + value + ']'; };
        }

        ria.__API.extend(IdNameImpl, IdName);

        <!-- values here -->

        return IdName;
    }.toString().replace('<!-- values here -->', values.join('\n')).replace(/IdName/g, name).replace(/IdFullName/g, fullName), {});
}

function IdentifierCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == 'IDENTIFIER') {

        if (node.args.length > 2)
            throw Error('invalid args count');

        if (!(node.args[0] instanceof UglifyJS.AST_String))
            throw Error('Identifier name should be string literal');

        var name = node.args[0].value;

        var body = {};
        if (node.args.length> 1) {
            var props = node.args[1].properties;
            for (var k in props) if (props.hasOwnProperty(k)) {
                var n = props[k];
                if (!(n.value instanceof UglifyJS.AST_String
                    || n.value instanceof UglifyJS.AST_Number
                    || n.value instanceof UglifyJS.AST_Boolean
                    || n.value instanceof  UglifyJS.AST_Unary))
                    throw Error('Value of enum ' + name + ' expected to be string, number or boolean, got ' + n.value.print_to_string());

                body[n.key] = n.value;
            }
        }

        //console.info('Found identifier ' + name + ' in ' + ns);

        var right = new UglifyJS.AST_Call({
            expression: getIdentifierImplementation(name, ns + '.' + name, body),
            args: []
        });

        return ria.__SYNTAX.isProtected(name) ? right : new UglifyJS.AST_Assign({
            left: getNameTraversed(ns.split('.'), name),
            operator: '=',
            right: right
        });
    }
}

compilers.push(IdentifierCompiler);

