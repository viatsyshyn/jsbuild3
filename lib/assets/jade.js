/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 8/15/13
 * Time: 10:59 PM
 * To change this template use File | Settings | File Templates.
 */

!function (setFileHandler) {
    var Jade = null;

    setFileHandler('jade', function (content, config, path) {
        var myCfg = config.getPluginConfig('jade');
        Jade = Jade || require(myCfg.compiler || 'jade');
        return '__ASSETS["' + AssetsCache[path] + '"] = ' + Jade.compile(content, myCfg.options);
    });
}(setFileHandler);
