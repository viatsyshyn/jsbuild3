/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/12/13
 * Time: 9:49 AM
 * To change this template use File | Settings | File Templates.
 */

function ExceptionCompiler(ns, node, descend) {
    return ClassCompilerBase(ns, node, descend, 'ria.__API.Exception', 'EXCEPTION');
}

compilers.push(ExceptionCompiler);