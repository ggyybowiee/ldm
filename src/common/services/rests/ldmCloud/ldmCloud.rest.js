(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("ldmCloudService", ldmCloudService);

  /** @ngInject */
  function ldmCloudService(Restangular) {

    var service = {
      getStatistics: getStatistics
    };

    return service;

    function getStatistics(hosCode, params) {
      return Restangular.all('/ldmCloud/infusionMsgStatistic').customGET(hosCode, params);
    }
  }
})();
