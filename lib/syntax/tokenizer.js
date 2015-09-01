(ria = ria || {}).__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    function __clone(a) {
        return [].slice.call(a);
    }

    var Modifiers = function () {
        function Modifiers() { throw Error(); }
        function ModifiersImpl(raw) { this.valueOf = function () { return raw; } }
        ria.__API.extend(ModifiersImpl, Modifiers);

        var values = {};
        values['OVERRIDE'] = Modifiers.OVERRIDE = new ModifiersImpl('OVERRIDE');
        values['ABSTRACT'] = Modifiers.ABSTRACT = new ModifiersImpl('ABSTRACT');
        values['FINAL'] = Modifiers.FINAL = new ModifiersImpl('FINAL');
        values['READONLY'] = Modifiers.READONLY = new ModifiersImpl('READONLY');
        values['UNSAFE'] = Modifiers.UNSAFE = new ModifiersImpl('UNSAFE');
        Modifiers.fromValue = function (raw) {
            return values.hasOwnProperty(raw) ? values[raw] : undefined;
        };
        return Modifiers;
    }();

    ria.__SYNTAX.Modifiers = Modifiers;

    function FunctionToken(value) {
        this.value = value;
        this.raw = value;
    }

    FunctionToken.prototype.getName = function () {
        return this.value.name.name;
    };

    FunctionToken.prototype.getParameters = function () {
        return this.value.argnames.map(function (_) { return _.name; });
    };

    function FunctionCallToken(token) {
        this.call = token;
        this.raw = token;
    }

    FunctionCallToken.prototype.getName = function () {
        return this.call.expression.print_to_string();
    };

    FunctionCallToken.prototype.getArgs = function () {
        return this.call.args.map(function(_) { return _.print_to_string(); });
    };

    function StringToken (str) {
        this.value = str.value;
        this.raw = str;
    }

    function RefToken (ref) {
        this.value = ref.print_to_string();
        this.raw = ref;
    }

    function ModifierToken(mod) {
        this.value = mod;
    }

    function ArrayToken(value, raw) {
        this.values = value;
        this.raw = raw;
    }

    ArrayToken.prototype.getTokenizer = function () {
        return new Tokenizer(null, this.values);
    };

    function DoubleArrayToken(value, raw) {
        this.values = value;
        this.raw = raw;
    }

    function VoidToken() {}
    function SelfToken() {}

    function ExtendsToken(base) {
        if (base instanceof UglifyJS.AST_Call) {
            this.specs = base.args;
            base = base.expression.expression;
        }

        this.value = base.print_to_string();
        this.raw = base;
    }

    function ImplementsToken(ifcs) {
        this.raw = this.values = __clone(ifcs);
    }

    function GenericToken(desc) {
        this.value = desc;
    }

    function GeneralizeDescriptor(types) {
        this.types = types.slice();
    }

    GeneralizeDescriptor.prototype.define = function () {
    };

    GeneralizeDescriptor.prototype.undefine = function () {
    };

    function ParseGeneric(args) {
        var types = [];

        while(args.length) {
            var name = args.shift(), specs = [];
            if (args.length) {
                do {
                    var spec = args.shift();
                    if (spec instanceof Tokenizer.StringToken) {
                        args.unshift(spec);
                        break;
                    }

                    specs.push(spec);
                } while (args.length);
            }

            types.push([name, specs]);
        }

        return new GeneralizeDescriptor(types);
    }

    function Tokenizer(data, processed) {
        this.token = this.token.bind(this);

        this.data = data ? __clone(data).map(this.token) : processed;
    }

    Tokenizer.prototype.token = function (token) {
        if (token.print_to_string() == 'SELF')
            return new SelfToken();

        if (token.print_to_string() == 'VOID')
            return new VoidToken();

        if (Modifiers.fromValue(token.print_to_string()))
            return new ModifierToken(Modifiers.fromValue(token.print_to_string()));

        if (token instanceof UglifyJS.AST_Call && token.expression.print_to_string() == 'EXTENDS')
            return new ExtendsToken(token.args[0]);

        if (token instanceof UglifyJS.AST_Call && token.expression.print_to_string() == 'IMPLEMENTS')
            return new ImplementsToken(token.args.slice());

        if (token instanceof UglifyJS.AST_Call && token.expression.print_to_string() == 'GENERIC')
            return new GenericToken(ParseGeneric(__clone(token.args).map(this.token)));

        if (token instanceof UglifyJS.AST_Array && token.elements.length == 1 && token.elements[0] instanceof UglifyJS.AST_Array)
            return new DoubleArrayToken(__clone(token.elements[0].elements).map(this.token), token.elements[0]);

        if (token instanceof UglifyJS.AST_Array)
            return new ArrayToken(__clone(token.elements).map(this.token), token);

        if (token instanceof UglifyJS.AST_Call)
            return new FunctionCallToken(token);

        if (token instanceof UglifyJS.AST_Lambda)
            return new FunctionToken(token);

        if (token instanceof UglifyJS.AST_String)
            return new StringToken(token);

        if (token instanceof UglifyJS.AST_SymbolRef
            || token instanceof UglifyJS.AST_Dot)
            return new RefToken(token);

        throw Error('Unknown token : ' + (token.print_to_string ? token.print_to_string() : token ));
    };

    Tokenizer.prototype.check = function (type) {
        return this.data[0] instanceof type;
    };

    Tokenizer.prototype.next = function () {
        return this.data.shift();
    };

    Tokenizer.prototype.ensure = function(type) {
        if (!this.check(type))
            throw Error('Expected ' + type.name + ', got: ' + this.data[0].constructor.name + ', value: ' + JSON.stringify(this.data[0]));
    };

    Tokenizer.prototype.eot = function () {
        return this.data.length < 1;
    };

    Tokenizer.FunctionToken = FunctionToken;
    Tokenizer.FunctionCallToken = FunctionCallToken;
    Tokenizer.StringToken = StringToken;
    Tokenizer.RefToken = RefToken;
    Tokenizer.ModifierToken = ModifierToken;
    Tokenizer.ArrayToken = ArrayToken;
    Tokenizer.DoubleArrayToken = DoubleArrayToken;
    Tokenizer.VoidToken = VoidToken;
    Tokenizer.SelfToken = SelfToken;
    Tokenizer.ExtendsToken = ExtendsToken;
    Tokenizer.ImplementsToken = ImplementsToken;
    Tokenizer.GenericToken = GenericToken;

    ria.__SYNTAX.Tokenizer = Tokenizer;
})();