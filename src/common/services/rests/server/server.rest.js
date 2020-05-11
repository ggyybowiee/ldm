(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('serverRest', serverRest);

  /** @ngInject */
  function serverRest(Restangular) {
    var server = '/ldm/products';
    var service = {
      getSystems: getSystems,
      getSystem: getSystem,
      getServers: getServers,
      getServices: getServices,
      getDbServices: getDbServices,
      dic: {
        0: {
          text: '正常',
          level: 'primary'
        },
        1000: {
          text: '低风险',
          level: 'warning'
        },
        1001: {
          text: '资源紧张',
          level: 'warning'
        },
        2000: {
          text: '服务中断',
          level: 'danger'
        },
        2001: {
          text: '网络中断',
          level: 'danger'
        },
        2002: {
          text: '数据库服务异常',
          level: 'danger'
        }
      },
      databaseDic: ['中断', '连通']
    };

    return service;

    function getSystems(params) {
      return Restangular.all(server).getList(params);
    }

    function getSystem(id) {
      return Restangular.one(server, id).get();
    }

    function getServers(id) {
      return Restangular.one(server, id).all('servers').getList();
    }

    function getServices(id) {
      return Restangular.one(server, id).all('services').getList();
    }

    function getDbServices(id) {
      return Restangular.one(server, id).all('dbServices').getList();
    }
  }
})();