(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('ImplPrintController', ImplPrintController);

  /** @ngInject */
  function ImplPrintController($q, $interval, $timeout, modalService, mnisCalc, nursingRest, ordersRest, sessionService, moment, _) {
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
      vm.options = {
        value: 'inhosCode'
      };
      vm.syncPrint = syncPrint;
      vm.printFilter = printFilter;
      vm.orderStatus = [
        {
          dicCode: '1',
          dicName: '正常'
        },
        {
          dicCode: '0',
          dicName: '停止'
        }
      ]
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
      if(!vm.selected || !vm.selected.length || !vm.params.execTypeCodes || !vm.params.execTypeCodes.length) {
        return $q.resolve([]).then(function(data) {
          vm.list = [];
          vm.checked = [];
        });
      }
      var beginTime, endTime, date = moment(vm.tmpParams.date);
      if(+vm.tmpParams.today) {
        beginTime = date.format('YYYY-MM-DD');
        endTime = date.add(1, 'days').format('YYYY-MM-DD');
      } else {
        beginTime = date.add(1, 'days').format('YYYY-MM-DD');
        endTime = date.add(1, 'days').format('YYYY-MM-DD');
      }
      return ordersRest.getLabelPrint(profile.wardCode, _.assign({
        beginTime: beginTime,
        endTime: endTime,
        inhosCodes: vm.selected
      }, vm.params)).then(function(data) {
        vm.list = _.map(data.plain(), function(item) {
          item.patient = _.find(vm.patients, {
            inhosCode: item.inhosCode
          });
          return item;
        });
        vm.checked = [];
      });
    }

    function resetParams() {
      vm.params = {
        isLongTerm: '1',
        orderStatus: '1',
        execTypeCodes: _.pluck(dicHelper.dic.orderType, 'dicCode'),
        isPrint: '0'
      };
      vm.tmpParams = {
        date: moment().format('YYYY-MM-DD'),
        today: 1
      };
    }

    function printFilter(checked) {
      var filterList = [];
      _.each(checked, function(orderbar) {
        filterList.push(_.find(vm.list, function(item) {
          return item.orderbar == orderbar;
        }))
      });
      vm.filterList = filterList;
    }

    function syncPrint() {
      var data = _.chain(vm.checked).map(function(orderbar) {
        return _.find(vm.list, {
          orderbar: orderbar
        });
      }).map(function(order) {
        return _.pick(order, 'orderGroupNo', 'orderbar', 'planTime', 'inhosCode', 'orderSortNo');
      }).value();
      console.log('ordersPrint data: ==>');
      console.log(data);
      ordersRest.ordersPrint(data).then(function() {
        vm.loadOrders.func();
      });
    }

  }
})();
