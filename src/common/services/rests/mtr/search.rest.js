(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('searchRest', searchRest);

  /** @ngInject */
  function searchRest(Restangular, _) {
    var search = 'searchResults';
    var service = {
      getResults: getResults,
      getInHosResults: getInHosResults,
      getFields: getFields,
      getOptions: getOptions,
      getMulitiResults: getMulitiResults
    };

    return service;

    function getResults(params) {
      return Restangular.one('/mtr/emr', search).get(_.assign(params, {
        offsets: [0,0,0,0,0,0,0,0],
        page: 20
      }));
    }

    function getInHosResults(data) {
      return Restangular.one('/mtr/emr/inhos/', 'searchingResult').customPOST(data);
    }

    function getFields() {
      return Restangular.all('/mtr/patSearchCondition/conditions').getList();
    }

    function getOptions() {
      return Restangular.one('/mtr/patSearchCondition/', 'regulations').get();
    }

    function getMulitiResults(list) {
      return Restangular.all('/mtr/patSearchCondition/query').customPOST(list);
    }
  }
})();