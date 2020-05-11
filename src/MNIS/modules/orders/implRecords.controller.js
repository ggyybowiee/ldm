(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('ImplRecordsController', ImplRecordsController);

  /** @ngInject */
  function ImplRecordsController($q, mnisCalc, nursingRest, ordersRest, sessionService, moment, _) {
    var vm = this, profile = sessionService.getProfile(), dicHelper = sessionService.getDicHelper();
    activate();

    function activate() {
      vm.load = {
        func: loadData,
        init: true
      };
      vm.loadOrders = {
        func: loadOrders
      };
      vm.dicHelper = dicHelper;
      vm.resetParams = resetParams;
      vm.patientsFilter = patientsFilter;
      vm.filterText = '';
      vm.dateOptions = {
      };
      vm.options = {
        value: 'inhosCode'
      };
      resetParams();
    }

    function loadData() {
      return nursingRest.getInhosRecordsFromEmr(profile.wardCode).then(function(data) {
        vm.patients = _.map(data.plain(), function(item) {
          item.text = item.bedCode + '床 ' + item.patName;
          return item;
        });
      });
    }

    function loadOrders() {
      if(!vm.selected || !vm.selected.length) {
        return $q.resolve([]).then(function(data) {
          vm.list = data;
        });
      }
      return ordersRest.getExecOrdersByHid(profile.wardCode, _.assign({
        inhosCodes: vm.selected
      },vm.params)).then(function(data) {
        vm.list = data;
      })
    }

    function resetParams() {
      vm.params = {
        beginTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD'),
        isLongTerm: '1',
        status: '',
        execTypeCodes: ''
      };
    }

    function patientsFilter(data) {
      return data.bedCode.indexOf(vm.filterText) > -1;
    }

  }
})();