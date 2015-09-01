/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 9:49 AM
 * To change this template use File | Settings | File Templates.
 */

ria.__SYNTAX.resolveNameFromToken = function (x) {
    return x.value;
};

function isProtected(name) {
    //console.info(name + 'is protected ' + (/^.+_$/.test(name) ? 'true' : 'false'));
    return /^.+_$/.test(name);
}

function isStaticMethod(name) {
    return name.toUpperCase() == name && /[_a-z].*/i.test(name);
}

function isFactoryCtor(name) {
    return name !== '$$' && /^\$.*/i.test(name);
}

function ToAst(fn) {
    try {
        return UglifyJS.parse('function anonymous() { ' + fn.toString() + ' }').body[0].body[0];
    } catch (e) {
        console.error('Error parsing: "' + fn + '", Error : ' + e.message);
        throw e;
    }
}

ria.__SYNTAX.toAst = ToAst;
ria.__SYNTAX.toRef = AccessNS;

function processAnnotation(_) {
    if (_.raw instanceof UglifyJS.AST_Call)
        return _.raw

    return make_node(UglifyJS.AST_Call, _.raw, {
        expression: _.raw,
        args: []
    })
}

function ClassCtor() {
    return $$(this, ClassCtor, _.$, [].slice.call(arguments));
}

function ClassNamedCtor() {
    return $$(this, ClassCtor, _.$, [].slice.call(arguments));
}

function CompileBASE(node, baseClazz, method, clazz) {
    var found = false;

    var result = node.transform(new UglifyJS.TreeTransformer(function (node, descend) {
        if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == 'BASE') {
            found = true;
            return make_node(UglifyJS.AST_Call, node, {
                expression: AccessNS(baseClazz + '.prototype.' + method + '.call', null, node),
                args: [make_node(UglifyJS.AST_This, node)].concat(node.args)
            })
        }
    }));

    if (!found && clazz)
        console.warn('Class "' + clazz + '" not calls BASE() in $');

    return result;
}

function CompileGenericTypeRefs(node, genericTypeName) {
    return node.transform(new UglifyJS.TreeTransformer(function (node, descend) {
        if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == genericTypeName) {
            node.expression = make_node(UglifyJS.AST_Call, node, {
                expression: AccessNS('this.getSpecsOf', null, node),
                args: [make_node(UglifyJS.AST_String, node, {value: genericTypeName})]
            })
        }
        /*if (node instanceof UglifyJS.AST_New && node.expression.print_to_string() == genericTypeName) {
            node.expression = make_node(UglifyJS.AST_Call, node, {
                expression: AccessNS('this.getSpecsOf', null, node),
                args: [make_node(UglifyJS.AST_String, node, {value: genericTypeName})]
            })
        }*/
    }));
}

function CompileGenericTypesRefs(genericTypesNames, node) {
    return genericTypesNames.reduce(CompileGenericTypeRefs, node);
}

function ClassCompilerBase(ns, node, descend, baseClass, KEYWORD) {
    if (node instanceof UglifyJS.AST_Call && node.expression.print_to_string() == KEYWORD) {

        //console.info(node.args);

        var tkz = new ria.__SYNTAX.Tokenizer(node.args);

        var def = ria.__SYNTAX.parseClassDef(tkz);

        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, AccessNS(baseClass));
        //ria.__SYNTAX.validateClassDecl(def, baseClass);

        //console.info('found class ' + def.name + ' in ' + ns);

        ria.__SYNTAX.Registry.registry(ns + '.' + def.name, def);

        var genericTypesNames = (def.genericTypes || []).map(function (_) { return _[0].value });

        var processedMethods = [];
        var parts = ns.split('.');
        parts.push(def.name);

        var defAstTree = make_node(UglifyJS.AST_Call, node, {
            args: [],
            expression: make_node(UglifyJS.AST_Lambda, node, {
                argnames: [],
                body: [].concat(
                    //compile factory is any
                    [function () {
                        var $$Def = def.methods.filter(function (_) { return _.name == '$$'; }).pop();
                        processedMethods.push('$$');
                        return make_node(UglifyJS.AST_Var, node, {
                            definitions: [make_node(UglifyJS.AST_VarDef, null, {
                                name: make_node(UglifyJS.AST_SymbolRef, node, {name: '$$'}),
                                value: $$Def ? ProcessSELF($$Def.body, 'ClassCtor') : def.flags.isUnSafe ? AccessNS('ria.__API.initUnSafe') : AccessNS('ria.__API.init')
                            })]
                        })
                    }()],
                    [def.genericTypes.length ? CompileGenericTypes(def.genericTypes, node) : null],
                    [ToAst(ClassCtor)],
                    [make_node(UglifyJS.AST_SimpleStatement, node, {
                        body: make_node(UglifyJS.AST_Call, node, {
                            expression: AccessNS('ria.__API.clazz', null, node),
                            args: [
                                AccessNS('ClassCtor'),
                                make_node(UglifyJS.AST_String, node, {value: ns + '.' + def.name.replace(/_$/, '_$' + Math.random().toString(36).substr(2))}),
                                def.base ? def.base.raw : AccessNS('ria.__API.Class'),
                                make_node(UglifyJS.AST_Array, node, {elements: def.ifcs.raw}),
                                make_node(UglifyJS.AST_Array, node, {elements: def.annotations.map(processAnnotation) }),
                                make_node(def.flags.isAbstract ? UglifyJS.AST_True : UglifyJS.AST_False, node),
                                make_node(UglifyJS.AST_Array, null, {elements: genericTypesNames.map(function (_) { return new UglifyJS.AST_SymbolVar({ name: _ })})}),
                                make_node(UglifyJS.AST_Array, null, {elements: def.base.specs ? def.base.specs : []}),
                                make_node(def.flags.isUnSafe ? UglifyJS.AST_True : UglifyJS.AST_False, node)
                            ]
                        })
                    })],
                    [ToAst('var _ = ClassCtor.prototype')],
                    //compile ctors
                    [].concat.apply([], def.methods
                        .filter(function (_) { return isFactoryCtor(_.name)})
                        .map(function (ctorDef) {
                            processedMethods.push(ctorDef.name);
                            var argsNames = ctorDef.argsNames,
                                argsTypes = ctorDef.argsTypes,
                                body = ctorDef.body.raw,
                                name = ctorDef.name,
                                annotations = ctorDef.annotations;
                            body.name = '';
                            return [
                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Assign, node, {
                                        left: AccessNS('_.' + name, null, node),
                                        operator: '=',
                                        // TODO: insert properties initializations
                                        right: CompileGenericTypesRefs(genericTypesNames, CompileBASE(CompileSELF(body, 'ClassCtor'),
                                            // TODO: detect TRUE base class
                                            def.base ? def.base.raw.print_to_string() : baseClass,
                                            '$', parts.join('.')))
                                    })
                                }),
                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Call, node, {
                                        expression: AccessNS('ria.__API.ctor', null, node),
                                        args: [
                                            make_node(UglifyJS.AST_String, node, {value: ctorDef.name}),
                                            AccessNS('ClassCtor', null, node),
                                            AccessNS('_.' + name, null, node),
                                            make_node(UglifyJS.AST_Array, node, {
                                                elements: argsTypes.map(function (_) { return ProcessSELF(_, 'ClassCtor') })
                                            }),
                                            make_node(UglifyJS.AST_Array, node, {
                                                elements: argsNames.map(function (_) { return make_node(UglifyJS.AST_String, node, {value: _}) })
                                            }),
                                            make_node(UglifyJS.AST_Array, node, { elements: annotations.map(processAnnotation) })
                                        ]
                                    })
                                }),
                                name != '$' ? make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Assign, node, {
                                        left: AccessNS('ClassCtor.' + name, null, node),
                                        operator: '=',
                                        right: ToAst(ClassNamedCtor.toString().replace('_.$', '_.' + name))
                                    })
                                }) : null
                            ];
                        })),
                    //compile properties,
                    def.properties
                        .map(function (property) {
                            var name = property.name;
                            var getterName = property.getGetterName();
                            var setterName = property.getSetterName();

                            var getterDef = property.__GETTER_DEF;
                            processedMethods.push(getterName);
                            var setterDef = property.__SETTER_DEF;
                            processedMethods.push(setterName);

                            var getterBody = getterDef.body.raw,
                                setterBody = !property.flags.isReadonly ? setterDef.body.raw : null;

                            getterBody.name = '';
                            setterBody && (setterBody.name = '');
                            return [
                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Assign, node, {
                                        left: AccessNS('_.' + getterName, null, node),
                                        operator: '=',
                                        // TODO: insert properties initializations
                                        right: CompileGenericTypesRefs(genericTypesNames, CompileBASE(CompileSELF(getterBody, 'ClassCtor'),
                                            // TODO: detect TRUE base class
                                            def.base ? def.base.raw.print_to_string() : baseClass,
                                            getterName))
                                    })
                                }),

                                property.flags.isReadonly ? null : make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Assign, node, {
                                        left: AccessNS('_.' + setterName, null, node),
                                        operator: '=',
                                        // TODO: insert properties initializations
                                        right: CompileGenericTypesRefs(genericTypesNames, CompileBASE(CompileSELF(setterBody, 'ClassCtor'),
                                            // TODO: detect TRUE base class
                                            def.base ? def.base.raw.print_to_string() : baseClass,
                                            setterName))
                                    })
                                }),

                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Assign, node, {
                                        left: AccessNS('_.' + name, null, node),
                                        operator: '=',
                                        right: make_node(UglifyJS.AST_Null, node)
                                    })
                                }),

                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Call, node, {
                                        expression: AccessNS('ria.__API.property', null, node),
                                        args: [
                                            AccessNS('ClassCtor', null, node),
                                            make_node(UglifyJS.AST_String, node, {value: property.name}),
                                            property.type ? ProcessSELF(property.type, 'ClassCtor') : make_node(UglifyJS.AST_Null),
                                            make_node(UglifyJS.AST_Array, node, {elements: property.annotations.map(processAnnotation) }),
                                            AccessNS('_.' + getterName, null, node),
                                            property.flags.isReadonly ? make_node(UglifyJS.AST_Null) : AccessNS('_.' + setterName, null, node)
                                        ]
                                    })
                                })
                            ];
                        })
                        .reduce(function (node, _) { return _.concat(node); }, [])
                        .filter(function (_) { return _ != null; }),
                    //compile methods,
                    def.methods
                        .filter(function (_) { return processedMethods.indexOf(_.name) < 0 })
                        .map(function (method) {
                            var body = method.body.raw;
                            body.name = '';
                            return [
                                make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: isStaticMethod(method.name)
                                        ?  make_node(UglifyJS.AST_Assign, node, {
                                                left: AccessNS('ClassCtor.' + method.name, null, node),
                                                operator: '=',
                                                right: CompileSELF(body, 'ClassCtor')
                                        })
                                        : make_node(UglifyJS.AST_Assign, node, {
                                            left: AccessNS('_.' + method.name, null, node),
                                            operator: '=',
                                            // TODO: insert properties initializations
                                            right: CompileGenericTypesRefs(genericTypesNames, CompileBASE(CompileSELF(body, 'ClassCtor'),
                                                // TODO: detect TRUE base class
                                                def.base ? def.base.raw.print_to_string() : baseClass,
                                                method.name))
                                        })
                                }),
                                isProtected(method.name) || isStaticMethod(method.name) ? null : make_node(UglifyJS.AST_SimpleStatement, node, {
                                    body: make_node(UglifyJS.AST_Call, node, {
                                        expression: AccessNS('ria.__API.method', null, node),
                                        args: [
                                            AccessNS('ClassCtor', null, node),
                                            AccessNS('_.' + method.name, null, node),
                                            make_node(UglifyJS.AST_String, node, {value: method.name}),
                                            CompileReturnType(method.retType, 'ClassCtor', node),
                                            make_node(UglifyJS.AST_Array, node, {
                                                elements: method.argsTypes.map(function (_) { return ProcessSELF(_, 'ClassCtor') })
                                            }),
                                            make_node(UglifyJS.AST_Array, node, {
                                                elements: method.argsNames.map(function (_) {
                                                    return make_node(UglifyJS.AST_String, node, {value: _})
                                                })
                                            }),
                                            make_node(UglifyJS.AST_Array, node, {elements: method.annotations.map(processAnnotation) })
                                        ]
                                    })
                                })
                            ];
                        })
                        .reduce(function (node, _) { return _.concat(node); }, [])
                        .filter(function (_) { return _ != null; }),
                    [ToAst('ria.__API.compile(ClassCtor)')],
                    [ToAst('ClassCtor.OF = ria.__API.OF')],
                    [ToAst('return ClassCtor')]
                ).filter(function (_) { return _ })
            })
        });

        return CompilePublicSymbolDef(parts, defAstTree, node);
    }
}

function ClassCompiler(ns, node, descend, base) {
    return ClassCompilerBase(ns, node, descend, 'ria.__API.Class', 'CLASS');
}

compilers.push(ClassCompiler);