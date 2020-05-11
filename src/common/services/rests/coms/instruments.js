(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('insturmentsService', insturmentsService);

  /** @ngInject */
  function insturmentsService(Restangular) {
    var instruments = '/coms/instruments';
    var packages = '/coms/packages';
    var maxSortNo = '/coms/instruments/maxSortNo';
    var packageMaxSortNo = '/coms/packages/maxSortNo';
    var service = {
      getInstruments: getInstruments,
      getMaxSortNo: getMaxSortNo,
      getPackageMaxSortNo: getPackageMaxSortNo,
      getInstrument: getInstrument,
      getPackages: getPackages,
      getPackage: getPackage,
      getPackageInstruments: getPackageInstruments
    };

    return service;

    function getInstruments() {
      return Restangular.all(instruments);
    }

    function getPackages() {
      return Restangular.all(packages);
    }

    function getPackage(code) {
      return Restangular.one(packages, code).get();
    }

    function getPackageInstruments(code) {
      return Restangular.one(packages , code).all('packageInstruments');
    }

    function getInstrument(id) {
      return Restangular.one(instruments, id).get();
    }

    function getMaxSortNo(params) {
      return Restangular.all(maxSortNo).customGET('', params);
    }

    function getPackageMaxSortNo(params) {
      return Restangular.all(packageMaxSortNo).customGET('', params);
    }
  }
})();
