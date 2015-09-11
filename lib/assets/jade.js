/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 10:59 PM
 * To change this template use File | Settings | File Templates.
 */

!function (setFileHandler) {
    var Jade = null,
        path = require('path');

    setFileHandler('jade', function (content, config, filename) {
        var myCfg = config.getPluginConfig('jade');
        Jade = Jade || require(path.resolve(config.getBasePath(), myCfg.compiler || 'node_modules/jade/index.js'));
        return '__ASSETS["' + AssetsCache[filename] + '"] = ' + Jade.compile(content, myCfg.options);
    });
}(setFileHandler);
