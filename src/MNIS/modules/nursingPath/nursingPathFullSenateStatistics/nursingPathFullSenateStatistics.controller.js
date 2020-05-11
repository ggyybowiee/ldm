(function () {
    'use strict';
  
    angular
      .module('lachesis-mnis')
      .controller('NursingPathFullSenateStatistics', NursingPathFullSenateStatistics);
  
    /** @ngInject */
    function NursingPathFullSenateStatistics(moment, URI, $state, $scope, sessionService, nursingPathRest, _) {
  
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
          beginTime: moment().subtract(1, 'month').format('YYYY-MM-DD'),  // 默认显示就近一个月
          endTime: moment().format('YYYY-MM-DD'),
          num: 20,
          offset: 0,
          countAll: true,
          orderBy: ''
        };
        vm.goCurrentWardName = goCurrentWardName;
        vm.queryList = queryList;
        vm.exportExcel = exportExcel;
        vm.search = search;
        vm.sortList = sortList;
        vm.sortType = '';
        vm.list = [];
        vm.singleData = {};
        loadSingleData();

        vm.pageItem = {
          maxSize: 10,
          totalItems: 0,
          count: '20',
          page: 1
        }
      }

      function loadSingleData() {
        nursingPathRest.getNursingPathSingle(vm.params).then(function (data) {
          vm.singleData = data;
        });
      }

      function loadData() {
        loadSingleData();
        return nursingPathRest.getNursingPathFullSenateStatistics(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function search() {
        vm.params.offset = 0;
        vm.pageItem.page = 1;
        loadSingleData();
        nursingPathRest.getNursingPathFullSenateStatistics(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function sortList(type) {
        vm.sortType = type;
        vm.params.orderBy = type;
        loadData();
      }

      function queryList(page) {
        vm.params.num = +vm.pageItem.count;
        vm.params.offset = (page - 1) * vm.params.num;
        loadData();
      }

      function goCurrentWardName(row) {
        // TODO: 跳转到该科室的报表详情页面
        $state.go('main.nursingPathWardNameStatistics', {
          wardCode: row.wardCode,
          beginTime: vm.params.beginTime,
          endTime: vm.params.endTime
        });
      }

      function exportExcel() {
        var newParam = _.omit(vm.params, ['num', 'offset', 'countAll']);
        newParam.wardCode = profile.wardCode;
        var uri = URI('/windranger/mnis/path/stat/all/export').query(newParam);
        return uri.toString();
      }
    }
  })();
  