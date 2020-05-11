(function() {

  angular.module('lachesis-mnis').controller('TaskRemindPaperController', TaskRemindPaperController);

  /** @ngInject */
  function TaskRemindPaperController($rootScope, taskRemindRest, moment, sessionService, $location) {
    var vm = this;
    activate();
    var currentTabType = "evaluate";

    function activate() {
      vm.vitalSign = {
        list: [],
        maxSize: 10,
        totalItems: 0,
        count: '20',
        page: 1,
        num: 20,
        offset: 0,
        countAll: true
      }
      vm.evaluate = {
        list: [],
        maxSize: 10,
        totalItems: 0,
        count: '20',
        page: 1,
        num: 20,
        offset: 0,
        countAll: true
      }

      vm.wardCode = sessionService.getProfile().wardCode;
      vm.dateOptions = {};
      paramsInit();
      vm.toRecord = toRecord;
      vm.toForm = toForm;
      vm.disable = disable;
      vm.queryList = queryList;
      vm.search = search;
    }

    function search() {
      if (currentTabType === 'evaluate') {
        vm.vitalSign.page = 1;
        vm.vitalSign.offset = 0;
      } else if (currentTabType === 'vitalSign') {
        vm.evaluate.page = 1;
        vm.evaluate.offset = 0;
      }
      vm.tabSelect(currentTabType);
    }

    function queryList(page, type) {
      if (type === 'evaluate') {
        vm.evaluate.num = +vm.evaluate.count;
        vm.evaluate.offset = (page - 1) * vm.evaluate.num;
      } else if (type === 'vitalSign') {
        vm.vitalSign.num = +vm.vitalSign.count;
        vm.vitalSign.offset = (page - 1) * vm.vitalSign.num;
      }
      vm.tabSelect(currentTabType);
    }

    function paramsInit() {
      vm.params = {
        dateTime: moment().format('YYYY-MM-DD'),
        process: '0',
        wardCode: vm.wardCode
      };
    }

    // 录入
    function toRecord(item) {
      location.href = $location.$$absUrl.split('#')[0] + '#/docs?inhosCode=' + item.inhosCode + '&patCode=' + item.patCode + '&sheetId=' + item.sheetId + '&tplId=' + item.tplId + '&type=vitalSign';
    }

    vm.tabSelect = function (type) {
      currentTabType = type;
      if (type === 'evaluate') {
        taskRemindRest.getTaskRemindList({
          wardCode: vm.params.wardCode,
          process: vm.params.process,
          ruleType: 'evaluate',
          startTime: vm.params.dateTime,
          endTime: vm.params.dateTime,
          num: vm.evaluate.num,
          offset: vm.evaluate.offset,
          countAll: vm.evaluate.countAll
        }).then(function (res) {
          vm.evaluate.list = res.queryResult || [];
          vm.evaluate.totalItems = res.totalCnt;
        });
      } else if (type === 'vitalSign'){
        taskRemindRest.getTaskRemindList({
          wardCode: vm.params.wardCode,
          process: vm.params.process,
          ruleType: 'vitalSign',
          startTime: vm.params.dateTime,
          endTime: vm.params.dateTime,
          num: vm.vitalSign.num,
          offset: vm.vitalSign.offset,
          countAll: vm.vitalSign.countAll
        }).then(function (res) {
          vm.vitalSign.list = res.queryResult || [];
          vm.vitalSign.totalItems = res.totalCnt;
        });
      }
    }

    function disable(item) {
      return taskRemindRest.taskRemindsResource(item.id).customDELETE().then(function () {
        $rootScope.$broadcast('toastr', {
          type: 'success',
          content: '已作废'
        });

        if (vm.vitalSign.list.length === 1) {
          vm.vitalSign.num = +vm.vitalSign.count;
          vm.vitalSign.page--;
          vm.vitalSign.offset = (vm.vitalSign.page - 1) * vm.vitalSign.num;
        }
        if (vm.evaluate.list.length === 1) {
          vm.evaluate.num = +vm.evaluate.count;
          vm.evaluate.page--;
          vm.evaluate.offset = (vm.evaluate.page - 1) * vm.evaluate.num;
        }
        vm.tabSelect(currentTabType);
      });
    }

    // 填表
    function toForm(item) {
      location.href = $location.$$absUrl.split('#')[0] + '#/docs?inhosCode=' + item.inhosCode + '&patCode=' + item.patCode + '&sheetId=' + item.sheetId + '&tplId=' + item.tplId + '&type=evaluate';
    }
  }
})();
