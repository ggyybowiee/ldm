(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("cloudNbFlowService", cloudNbFlowService);

  /** @ngInject */
  function cloudNbFlowService(Restangular) {
    var nbFlow = "/ldmCloud/nbFlow";
    var service = {
      getNbFlow: getNbFlow
    };

    return service;

    function getNbFlow() {
      return Restangular.all(nbFlow).getList();
    }
  }
})();
