(function () {
    'use strict';
  
    angular
      .module('lachesis-mnis')
      .controller('NursingPathWardNameStatistics', NursingPathWardNameStatistics);
  
    /** @ngInject */
    function NursingPathWardNameStatistics(moment, URI, $state, $stateParams, $scope, sessionService, nursingPathRest, _) {
  
      // 自动注入服务数据声明
      var vm = this,
        profile = sessionService.getProfile();

      activate();

      function activate() {
        vm.load = {
          func: loadData,
          init: true
        };
        vm.params = {
          wardCode: $stateParams.wardCode || profile.wardCode,
          beginTime: $stateParams.beginTime || moment().subtract(1, 'month').format('YYYY-MM-DD'),  // 默认显示就近一个月
          endTime: $stateParams.endTime || moment().format('YYYY-MM-DD'),
          num: 20,
          offset: 0,
          countAll: true
        };
        vm.goBack = goBack;
        vm.queryList = queryList;
        vm.exportExcel = exportExcel;
        vm.search = search;
        vm.list = [];
        vm.wardList = [];
        loadHosWard();

        vm.singleData = {};
        loadSingleData();

        vm.pageItem = {
          maxSize: 10,
          totalItems: 0,
          count: '20',
          page: 1
        }
      }

      function loadHosWard() {
        nursingPathRest.getHosWardList().then(function (data) {
          vm.wardList = data.queryResult;
        })
      }

      function loadSingleData() {
        nursingPathRest.getNursingPathSingle(vm.params).then(function (data) {
          vm.singleData = data;
        });
      }

      function loadData() {
        loadSingleData();
        return nursingPathRest.getNursingPathWardList(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function search() {
        vm.params.offset = 0;
        vm.pageItem.page = 1;
        loadSingleData();
        nursingPathRest.getNursingPathWardList(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function queryList(page) {
        vm.params.num = +vm.pageItem.count;
        vm.params.offset = (page - 1) * vm.params.num;
        loadData();
      }

      function exportExcel() {
        var newParam = _.omit(vm.params, ['num', 'offset', 'countAll']);
        var uri = URI('/windranger/mnis/path/stat/ward/export').query(newParam);
        return uri.toString();
      }

      function goBack() {
        history.back();
      }
    }
  })();
  