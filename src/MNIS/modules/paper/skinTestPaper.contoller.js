(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .controller("SkinTestPaperController", SkinTestPaperController);

  /** @ngInject */
  function SkinTestPaperController(
    $q,
    sessionService,
    modalService,
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
        wardCode: profile.wardCode,
        testStatus: ''
      };
      vm.tmpDate = moment().format('YYYY-MM-DD');
      vm.pluck = _.pluck;
      vm.showPic = showPic;
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
          vm.stat = 0;
        });
      }
      return $q.all([getSkinTest(), getSkinTestStat()]);
    }

    function getSkinTest() {
      return paperRest.getSkinTest(_.assign(vm.params, {
        beginTime: vm.tmpDate,
        endTime: vm.tmpDate,
        inhosCode: vm.selected
      })).then(function(data) {
        vm.list = data;
      });
    }

    function getSkinTestStat() {
      return paperRest.getSkinTestStat(_.assign(vm.params, {
        beginTime: vm.tmpDate,
        endTime: vm.tmpDate
      })).then(function(data) {
        vm.stat = data;
      });
    }

    function showPic(data) {
      modalService.open({
        size: 'lg',
        templateUrl: 'MNIS/modules/paper/pic.modal.html',
        methodsObj: {
          pic: {
            imageAfter: data.imageAfter,
            imageBefore: data.imageBefore
          }
        }
      })
    }
  }
})();
