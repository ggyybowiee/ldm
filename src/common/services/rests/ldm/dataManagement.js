(function() {
  'use strict';

  angular.module('lachesis-common').factory('dataManagementService', dataManagementService);

  /** @ngInject */
  function dataManagementService(Restangular) {
    var dataPackage = '/ldm/data/package',
      cancelPackage = '/ldm/data/package/cancel';
    var service = {
      getDataPackage: getDataPackage,
      postDataPackage: postDataPackage,
      deleteDataPackage: deleteDataPackage,
      cancelPost: cancelPost,
      updateDownLoadTimes: updateDownLoadTimes
    };

    return service;

    function getDataPackage(params) {
      return Restangular.all(dataPackage).customGET('', params);
    }

    function postDataPackage(params) {
      return Restangular.all(dataPackage)
        .withHttpConfig({ transformRequest: angular.identity })
        .customPOST(null, undefined, params, { "Content-Type": undefined });
    }

    function deleteDataPackage(id) {
      return Restangular.one(dataPackage, id).customDELETE();
    }

    function cancelPost(id) {
      return Restangular.one(cancelPackage, id).post();
    }

    function updateDownLoadTimes(id) {
      return Restangular.one(dataPackage, id).all('downloadTimes').customPUT();
    }
  }
})();
