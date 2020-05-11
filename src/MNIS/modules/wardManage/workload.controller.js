(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('WorkloadController', WorkloadController);

  /** @ngInject */
  function WorkloadController(wardRest, sessionService, modalService, moment) {
    var vm = this, profile = sessionService.getProfile(), dicHelper = sessionService.getDicHelper();

    activate();

    function activate() {
      vm.thisMonth = thisMonth;
      vm.thisSeason = thisSeason;
      vm.dicHelper = dicHelper;
      vm.openMy = openMy;
      vm.openNurse = openNurse;
      vm.openCate = openCate;
      vm.params = {
        type: '0',
        beginTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD')
      };
      vm.load = {
        func: loadData,
        init: true
      };
    }

    function loadData() {
      var params = {};
      params.beginTime = vm.params.beginTime;
      params.endTime = vm.params.endTime;
      if(vm.params.type === '0') {
        params.userCode = profile.userCode;
      }else if(vm.params.type === '1') {
        params.wardCode = profile.wardCode;
      }else {
        params.wardCode = profile.wardCode;
      }
      return wardRest.getWorkloads(vm.params.type, params).then(function(data) {
        if(vm.params.type == 0) {
          delete data.total;
        }
        vm.data = data.plain();
        vm.curType = vm.params.type;
      });
    }

    function thisMonth() {
      vm.params.beginTime = moment().startOf('month').format('YYYY-MM-DD');
      vm.params.endTime = moment().format('YYYY-MM-DD');
    }

    function thisSeason() {
      vm.params.beginTime = moment().startOf('quarter').format('YYYY-MM-DD');
      vm.params.endTime = moment().format('YYYY-MM-DD');
    }

    function openMy(data) {
      modalService.open({
        size: 'middle',
        templateUrl: 'MNIS/modules/wardManage/my.modal.html',
        methodsObj: {
          data: data,
          dicHelper: dicHelper
        }
      });
    }

    function openNurse(data) {
      modalService.open({
        size: 'middle',
        templateUrl: 'MNIS/modules/wardManage/nurse.modal.html',
        methodsObj: {
          data: data,
          dicHelper: dicHelper
        }
      });
    }

    function openCate(data) {
      modalService.open({
        size: 'middle',
        templateUrl: 'MNIS/modules/wardManage/cate.modal.html',
        methodsObj: {
          data: data,
          dicHelper: dicHelper
        }
      });
    }
  }
})();