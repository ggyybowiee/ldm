(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('ordersRest', ordersRest);

  /** @ngInject */
  function ordersRest(Restangular, _) {
    var order = '/mnis/orders/',
        config = '/mnis/SplitConfigs';
    var service = {
      getOrdersByHid: getOrdersByHid,
      getExecOrdersByHid: getExecOrdersByHid,
      getLabelPrint: getLabelPrint,
      ordersPrint: ordersPrint,
      getOrderDetail: getOrderDetail,
      getSplitConfig: getSplitConfig,
      createSplitConfig: createSplitConfig,
      updateSplitConfig: updateSplitConfig,
      delSplitConfig: delSplitConfig,
      updateOrderInfo: updateOrderInfo
    };

    return service;

    function getOrdersByHid(dept, hid, params) {
      return Restangular.all('/mnis/orders/' + dept).getList(_.assign({
        inhosCode: hid
      }, params));
    }

    function getExecOrdersByHid(dept, params) {
      return Restangular.all('/mnis/execOrders/' + dept).getList(params);
    }

    function getLabelPrint(dept, params) {
      return Restangular.all('/mnis/orderLabelPrint/' + dept).getList(params);
    }

    function ordersPrint(list) {
      return Restangular.all('/mnis/printOrders').customPOST(list);
    }

    function getOrderDetail(gid) {
      return Restangular.all('/mnis/orderExeDetail').getList({
        orderGroupNo: gid
      });
    }

    function getSplitConfig() {
      return Restangular.all(config).getList();
    }

    function createSplitConfig(data) {
      return Restangular.all(config).customPOST(data);
    }

    function updateSplitConfig(id, data) {
      return Restangular.one(config, id).customPUT(data);
    }

    function delSplitConfig(id) {
      return Restangular.one(config, id).remove();
    }

    function updateOrderInfo(orderGroupNo, params) {
      return Restangular.all(order + orderGroupNo).customPUT(params);
    }
  }
})();