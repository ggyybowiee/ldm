(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .controller("OrderPaperController", OrderPaperController);

  /** @ngInject */
  function OrderPaperController(
    $scope,
    $q,
    sessionService,
    mnisSessionCache,
    nursingRest,
    paperRest,
    moment,
    _
  ) {
    var vm = this,
      profile = sessionService.getProfile(),
      dicHelper = sessionService.getDicHelper(),
      wardHelper = mnisSessionCache.getWardHelper();


    vm.loadMenu = {
      func: loadMenu,
      init: true
    };

    vm.loadContent = {
      func: loadContent
    };

    activate();

    function activate() {
      vm.dicHelper = dicHelper;
      vm.wardHelper = wardHelper;
      vm.pluck = _.pluck;
      vm.syncPrint = syncPrint;
      vm.saveRemark = _.debounce(saveRemark, 1000, true);
      vm.params = {
        isLongTerm: "1",
        execTypeCodes: _.pluck(dicHelper.dic.orderType, "dicCode"),
        wardCode: profile.wardCode
      };
      vm.tmpDate = moment().format("YYYY-MM-DD");
    }

    vm.reloadMenuContent = function () {
      // vm.params.inhosCodes = [];
      vm.loadMenu.func().then(function () {
        var patientCodes = _.map(vm.patients, 'inhosCode');
        vm.params.inhosCodes = _.intersection(vm.params.inhosCodes, patientCodes);
        vm.loadContent.func();
      });
    };

    function loadMenu() {
      return nursingRest.getHisRecordsInSlot(profile.wardCode, {
        beginTime: vm.tmpDate,
        endTime: vm.tmpDate
      }).then(function(data) {
        vm.patients = _.chain(data.plain())
                        .map(function(item) {
                          item.text = (item.status === '0' ? '[出院] ' : '') + (item.bedCode ? item.bedCode + "床 " : '') + item.patName;
                          return item;
                        })
                        .sortBy(function (item) {
                          return 2 - item.status;
                        })
                        .value();
      });
    }

    function loadContent() {
      if (!vm.params.inhosCodes || !vm.params.inhosCodes.length || !vm.params.execTypeCodes.length) {
        return $q.resolve().then(function() {
          vm.list = [];
        });
      }
      return paperRest
        .getOrderPaper(
          _.assign(
            {
              beginTime: vm.tmpDate,
              endTime: vm.tmpDate
            },
            vm.params
          )
        )
        .then(function(data) {
          vm.list = _.chain(data).map(function(sheet) {
            sheet.orderList = _.chain(sheet.orderList).groupBy("orderGroupNo").values().sortBy(function(arr) {
              return arr[0].startDateTime;
            }).value();
            return sheet;
          })
          .sortBy(function (item) {
            return 2 - _.get(_.find(vm.patients, { inhosCode: item.inhosCode }), 'status');
          })
          .value();
        });
    }

    function syncPrint() {
      var arr = _.chain(vm.list)
        .map(function(sheet) {
          return _.pick(
            sheet,
            "administrationCode",
            "executeDate",
            "inhosCode",
            "repeatIndicator",
            "wardCode",
            "printPerson",
            "printTime"
          );
        })
        .filter(function(sheet) {
          return !sheet.printPerson;
        })
        .value();
      return paperRest.postPrint(arr).then(function() {
        vm.loadContent.func();
      });
    }

    function saveRemark(data) {
      return paperRest.putRemark(data).then(function() {
        vm.loadContent.func();
        $scope.$emit('toast', {
          content: '操作成功'
        });
      });
    }
  }
})();
