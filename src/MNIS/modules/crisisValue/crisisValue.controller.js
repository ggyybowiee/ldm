(function() {

  angular.module('lachesis-mnis').controller('CrisisValue', CrisisValue);

  /** @ngInject */
  function CrisisValue(examLabelRest,moment,sessionService) {
    var vm = this;
    activate();

    function activate() {
      vm.wardCode = sessionService.getProfile().wardCode;
      vm.wardName = sessionService.getProfile().wardName;
      vm.dateOptions = {
      };
      paramsInit();
      vm.loadData = loadData;
    }

    function loadData() {
      examLabelRest.getCrisisValue(vm.params).then(function(res) {
        vm.reportList = res;
      }, function(err) {
        console.log(res);
      })
    }

    function paramsInit() {
      vm.params = {
        beginTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD'),
        wardCode: vm.wardCode
      };
    }

  }
})();
