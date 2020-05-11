(function () {
    'use strict';
  
    angular
      .module('lachesis-mnis')
      .controller('NursingPathPatient', NursingPathPatient);
  
    /** @ngInject */
    function NursingPathPatient($state, $scope, sessionService, nursingPathRest, _) {
  
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
          wardCode: profile.wardCode,
          searchKey: '',
          pathTplId: '',
          pathStatus: '',
          num: 20,
          offset: 0,
          countAll: true
        };
        vm.goDoc = goDoc;
        vm.queryList = queryList;
        vm.search = search;
        vm.list = [];
        vm.pathList = [];
        loadPathList();

        vm.pageItem = {
          maxSize: 10,
          totalItems: 0,
          count: '20',
          page: 1
        }
      }

      function loadPathList() {
        nursingPathRest.getNursingPathConfigByWardCode({
          wardCode: profile.wardCode
        }).then(function (data) {
          vm.pathList = data.queryResult || [];
        })
      }

      function loadData() {
        return nursingPathRest.getNursingPathPatientList(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function search() {
        vm.params.offset = 0;
        vm.pageItem.page = 1;
        nursingPathRest.getNursingPathPatientList(vm.params).then(function (data) {
          vm.list = data.queryResult || [];
          vm.pageItem.totalItems = data.totalCnt;
        });
      }

      function queryList(page) {
        vm.params.num = +vm.pageItem.count;
        vm.params.offset = (page - 1) * vm.params.num;
        loadData();
      }

      function goDoc(row) {
        $state.go('main.docs', {
          inhosCode: row.inhosCode,
          patCode: row.patCode
        });
      }
    }
  })();
  