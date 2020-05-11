(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('OrdersController', OrdersController);

  /** @ngInject */
  function OrdersController() {
        
    var vm = this
    // 患者信息变更
    vm.onPaitentChanged = function (newPatient) {
      vm.selectedPatient = newPatient;
      // vm.loadOrders.func();
    }

  }
})();
