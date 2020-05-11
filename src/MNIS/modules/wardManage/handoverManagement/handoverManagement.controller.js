(function() {

  angular.module('lachesis-mnis').controller('HandoverManagementController', HandoverManagementController);

  /** @ngInject */
  function HandoverManagementController($scope,
    $q,
    sessionService,
    mnisSessionCache,
    nursingRest,
    paperRest,
    moment,
    _) {
    var vm = this,
      profile = sessionService.getProfile(),
      dicHelper = sessionService.getDicHelper(),
      wardHelper = mnisSessionCache.getWardHelper();

    vm.loadContent = {
      func: loadContent,
      init: true
    };

    activate();

    function activate() {
      vm.dicHelper = dicHelper;
      vm.wardHelper = wardHelper;
      vm.queryList = queryList;
      vm.dateChange = dateChange;
      vm.saveEditData = saveEditData;
      vm.tmpDate = moment().format("YYYY-MM-DD");
      vm.params = {
        wardCode: profile.wardCode,
        eventKeys: '',
        teamCode: '',
        startTime: vm.tmpDate + ' 00:00:00',
        endTime: moment(vm.tmpDate).add(1, 'days').format('YYYY-MM-DD') + ' 00:00:00',
        num: 20,
        offset: 0,
        countAll: true
      };
      vm.pageItem = {
        maxSize: 10,
        totalItems: 0,
        count: '20',
        page: 1
      }
      getHosUserShiftExt();
    }

    var watcher = $scope.$watch("vm.params.teamCode", function (value) {
      if (vm.shiftList && value != undefined) {
        vm.params.teamCode = value;

        dateChange();
      }
    });
    $scope.$on("$destroy", watcher);

    function queryList(page) {
      vm.params.num = +vm.pageItem.count;
      vm.params.offset = (page - 1) * vm.params.num;

      dateChange();
    }

    function dateChange() {
      vm.params.startTime = vm.tmpDate + ' 00:00:00';
      vm.params.endTime = moment(vm.tmpDate).add(1, 'days').format('YYYY-MM-DD') + ' 00:00:00';

      if (vm.params.teamCode !== '') {
        var findShift = _.find(vm.shiftList, function (item) {
          return item.teamCode === vm.params.teamCode;
        });

        if (findShift) {
          vm.params.startTime = vm.tmpDate + ' ' + moment(findShift.startTime).format("HH:mm:ss");
          vm.params.endTime = moment(vm.tmpDate).add(1, 'days').format('YYYY-MM-DD') + ' ' + moment(findShift.startTime).format("HH:mm:ss");
        }
      }

      loadHandoverData();
    }

    // 获取班次列表
    function getHosUserShiftExt() {
      nursingRest.getHosUserShiftExt({
        wardCode: profile.wardCode,
        status: 1
      }).then(function (data) {
        vm.shiftList = data;
        vm.shiftList.unshift({
          teamCode: '',
          shiftName: '全天'
        });
      });
    }

    function loadHandoverData() {
      return nursingRest.getHandoverItemCount({
        wardCode: profile.wardCode,
        teamCode: vm.params.teamCode,
        startTime: vm.params.startTime,
        endTime: vm.params.endTime
      }).then(function (res) {
        vm.allTypes = _.chain(res.plain())
                       .map(function(item) {
                         var findObj = _.find(vm.dicHelper.dic.whiteBoardEvent, function (data) {
                           return item.event === data.dicCode;
                         })

                         return _.assign(findObj, {
                           count: item.count
                         });
                       })
                       .sortBy('seqId')
                       .value() || [];
        vm.all = vm.allTypes[0];
        vm.itemTypes = vm.allTypes.slice(1);
        vm.params.eventKeys = _.pluck(vm.allTypes.slice(1), "dicCode");

        loadContent();
      });
    }

    function loadContent() {
      return nursingRest.getHandoverList(vm.params).then(function (data) {
        vm.list = data.queryResult || [];
        vm.pageItem.totalItems = data.totalCnt;
      });
    }

    function saveEditData(data) {
      return nursingRest.updateHandover(data).then(function () {
        dateChange();

        $scope.$emit('toast', {
          content: '操作成功'
        });
      });
    }
  }
})();
