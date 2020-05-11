(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .filter('nursingLevelColor', function (sessionService, _) {

      var nursingLevelColorDic = {};
      _.forEach(_.get(sessionService.getDicHelper().dic, 'nurseLevelColor'), function (item) {
        nursingLevelColorDic[item.dicCode] = item;
      });

      return function (nursingLevel) {

        nursingLevel = nursingLevel || "-1";

        var levelColor = _.get(nursingLevelColorDic, [nursingLevel, 'dicName']);
        return levelColor || 'transparent';
      }
    });

})();
