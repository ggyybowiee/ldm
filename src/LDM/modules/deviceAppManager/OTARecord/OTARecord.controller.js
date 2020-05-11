(function() {
    "use strict";
  
    angular
      .module("lachesis-ldm")
      .controller("OTARecordController", OTARecordController);
  
    /** @ngInject */
    function OTARecordController(
      $rootScope,
      $scope,
      $state,
      modalService,
      deviceInfoService,
      ldmSessionCache,
      hospitalRest,
      _
    ) {
    }
  })();