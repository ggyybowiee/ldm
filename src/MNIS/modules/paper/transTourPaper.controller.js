(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .controller("TransTourPaperController", TransTourPaperController);

  /** @ngInject */
  function TransTourPaperController(
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
        isLongTerm: '1',
        wardCode: profile.wardCode
      };
      vm.pluck = _.pluck;
      vm.dicHelper = dicHelper;
      vm.tmpDate = moment().format('YYYY-MM-DD');
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
        });
      }
      return paperRest
        .getTransTour(_.assign(vm.params, {
          beginTime: vm.tmpDate,
          endTime: vm.tmpDate
        }))
        .then(function(data) {
          vm.list = _.chain(data).groupBy('orderbar').values().sortBy(function(arr) {
            return arr[0].bedCode;
          }).value();
        });
    }
  }
})();
