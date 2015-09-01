/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 10:59 PM
 * To change this template use File | Settings | File Templates.
 */

setFileHandler('txt', function JadeFileHandler(content, config, path) {
    return 'jade.globals = jade.globals || {}; __ASSETS["' + AssetsCache[path] + '"] = "' + content + '"';
});