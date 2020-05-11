(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .controller("TransPaperController", TransPaperController);

  /** @ngInject */
  function TransPaperController(
    $q,
    sessionService,
    nursingRest,
    paperRest,
    moment,
    _
  ) {
    var vm = this,
      profile = sessionService.getProfile(),
      dicHelper = sessionService.getDicHelper();

    activate();

    function activate() {
      vm.loadMenu = {
        func: loadMenu,
        init: true
      };
      vm.loadContent = {
        func: loadContent
      };
      vm.dicHelper = dicHelper;
      vm.params = {
        isLongTerm: "1",
        execTypeCodes: ['INFUSION'],
        wardCode: profile.wardCode
      };
      vm.pluck = _.pluck;
      vm.tmpDate = moment().format('YYYY-MM-DD');
      paperRest.getTransColumns().then(function(data) {
        vm.columns = data;
        vm.units = _.chain(data).map(function(item) {
          return [{
            code: item.taskCode + '_person',
            label: '护士'
          }, {
            code: item.taskCode + '_time',
            label: '时间'
          }]
        }).flatten().value();
      });
    }

    function loadMenu() {
      return nursingRest.getInhosRecordsFromEmr(profile.wardCode).then(function(data) {
        vm.patients = _.map(data.plain(), function(item) {
          item.text = item.bedCode + "床 " + item.patName;
          return item;
        });
      });
    }

    function loadContent() {
      if (!vm.params.inhosCodes || !vm.params.inhosCodes.length) {
        return $q.resolve().then(function() {
          vm.list = [];
          vm.stat = {};
        });
      }
      return $q.all([getTrans(), getTransStat()]);
    }

    function getTrans() {
      return paperRest.getTrans(_.assign(vm.params, {
        beginTime: vm.tmpDate,
        endTime: vm.tmpDate
      })).then(function(data) {
        vm.list = data;
      });
    }

    function getTransStat() {
      return paperRest.getTransStat(_.assign(vm.params, {
        beginTime: vm.tmpDate,
        endTime: vm.tmpDate
      })).then(function(data) {
        vm.stat = data;
      });
    }
  }
})();
