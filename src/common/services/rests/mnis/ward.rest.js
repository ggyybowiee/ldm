(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('wardRest', wardRest);

  /** @ngInject */
  function wardRest(Restangular) {
    var HTMLTemplate = '/mnis/config/print';
    var types = [{
      url: '/mnis/workload/user',
      method: 'get',
      cate: 'one'
    }, {
      url: '/mnis/workload/ward',
      method: 'getList',
      cate: 'all'
    }, {
      url: '/mnis/workload/type',
      method: 'get',
      cate: 'one'
    }];
    var service = {
      getWorkloads: getWorkloads,
      getHTMLTemplate: getHTMLTemplate
    };

    return service;

    function getWorkloads(type, params) {
      return Restangular[types[type].cate](types[type].url)[types[type].method](params);
    }

    function getHTMLTemplate(params) {
      return Restangular.one(HTMLTemplate).get(params);
    }
  }
})();
