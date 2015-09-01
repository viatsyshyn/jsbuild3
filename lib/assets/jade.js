/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 10:59 PM
 * To change this template use File | Settings | File Templates.
 */

var Jade = require('emp.ria-jade');

setFileHandler('jade', function JadeFileHandler(content, config, path) {
    return '__ASSETS["' + AssetsCache[path] + '"] = ' + Jade.compile(content, {client: true, compileDebug: false, self: true});
});