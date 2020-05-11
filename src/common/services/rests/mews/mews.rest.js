(function() {
  "use strict";

  angular.module("lachesis-common").factory("mewsRest", mewsRest);

  /** @ngInject */
  function mewsRest(Restangular, _) {
    var service = {
      // Mews评分与警报
      getMewsScoreByHid: getMewsScoreByHid,
      getMewsAlertByWard: getMewsAlertByWard,
      processMewsAlertById: processMewsAlertById,
      getMewsAlertLevel: getMewsAlertLevel,

      // Mews配置
      getMewsConfig: getMewsConfig,
      addMewsConfig: addMewsConfig,
      updateMewsConfig: updateMewsConfig
    };

    return service;

    function getMewsScoreByHid(args) {
      return Restangular.all("/mews/scores").customGET("", args);
    }

    function getMewsAlertByWard(args) {
      return Restangular.all("/mews/alerts").customGET("", args);
    }

    function processMewsAlertById(id, confirmed, needCopy) {
      return Restangular.all("/mews/alerts/" + id).customPOST({}, undefined, {
        confirmed: confirmed,
        needCopy: needCopy
      });
    }

    function getMewsAlertLevel(scores, wardCode) {
      return Restangular.all("/mews/alertLevel").customPOST(scores, undefined, {
        wardCode: wardCode
      });
    }

    function getMewsConfig(args) {
      return Restangular.all("/mewsConfig").customGET("", args);
    }

    function addMewsConfig(config) {
      return Restangular.all("/mewsConfig").customPOST(config);
    }

    function updateMewsConfig(config) {
      return Restangular.all("/mewsConfig").customPUT(config);
    }
  }
})();
