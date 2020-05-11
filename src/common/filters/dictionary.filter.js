(function () {
  'use strict';

  angular.module('lachesis-common')
    .filter('dicName', function (sessionService) {
      return function (dicCode, dicType) {
        return sessionService.getDicHelper().getDicName(dicType, dicCode);
      };
    }).filter('dicInfo', function (sessionService) {
      return function (dicType) {
        return sessionService.getDicHelper().dic[dicType];
      };
    });

})();
