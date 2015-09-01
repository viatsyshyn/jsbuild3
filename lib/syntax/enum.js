/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 11:37 AM
 * To change this template use File | Settings | File Templates.
 */

"use strict";

function getEnumImplementation(name, fullName, body) {

    var values = [];
    for(var k in body) if (body.hasOwnProperty(k)) {
        var v = body[k];
        values.push('values[' + v.print_to_string() + '] = EnumName.' + k + ' = new EnumNameImpl(' + v.print_to_string() + ')' );
    }

    return UglifyJS.parse(function wrapper() {
        var values = {};
        function EnumName(value) {
            return values.hasOwnProperty(value) ? values[value] : undefined;
        }
        ria.__API.enumeration(EnumName, 'EnumFullName');

        function EnumNameImpl(value) {
            this.valueOf = function () { return value; };
            this.toString = function toString() { return '[EnumFullName#' + value + ']'; };
        }
        ria.__API.extend(EnumNameImpl, EnumName);

        <!-- values here -->

        return EnumName;
    }.toString().replace('<!-- values here -->', values.join('\n')).replace(/EnumName/g, name).replace(/EnumFullName/g, fullName), {});
}

function EnumCompiler(ns, node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == 'ENUM') {
        if (node.args.length != 2)
            throw Error('invalid args count');

        if (!(node.args[0] instanceof UglifyJS.AST_String))
            throw Error('Enum name should be string literal');

        if (!(node.args[1] instanceof UglifyJS.AST_Object))
            throw Error('Enum name should be object literal');

        var name = node.args[0].value;
        var body = {};
        var props = node.args[1].properties;
        for(var k in props) if (props.hasOwnProperty(k)) {
            var n = props[k];
            if (!(n.value instanceof UglifyJS.AST_String
                || n.value instanceof UglifyJS.AST_Number
                || n.value instanceof UglifyJS.AST_Boolean
                || n.value instanceof  UglifyJS.AST_Unary))
                throw Error('Value of enum ' + name + ' expected to be string, number or boolean, got ' + n.value.print_to_string());

            body[n.key] = n.value;
        }

        //console.info('Found enum ' + name + ' in ' + ns);

        var right = new UglifyJS.AST_Call({
            expression: getEnumImplementation(name, ns + '.' + name, body),
            args: []
        });

        return ria.__SYNTAX.isProtected(name) ? right : new UglifyJS.AST_Assign({
            left: getNameTraversed(ns.split('.'), name),
            operator: '=',
            right: right
        });
    }
}

compilers.push(EnumCompiler);