(function() {

  angular.module('lachesis-mnis').controller('ExamController', ExamController);

  /** @ngInject */
  function ExamController($q, $scope, recordRest, sessionService, nursingRest, moment, _, $stateParams, ordersRest, examLabelRest, modalService) {
    var vm = this, profile = sessionService.getProfile(), dicHelper = sessionService.getDicHelper();
    activate();

    function activate() {
      vm.patientsFilter = patientsFilter;
      vm.filterText = '';
      vm.load = {
        func: loadData,
        init: true
      };
      vm.loadOrders = {
        func: loadOrders
      };
      vm.dicHelper = dicHelper;
      vm.dateOptions = {
      };
      vm.resetParams = resetParams;
      vm.indexPatient = $scope.$parent.$parent.vm.patient;
      vm.getExamLabelParams = {
        pid: null,
        inhosCode: null,
        begin: '2017-03-01',
        end: '2018-04-04'
      };
      vm.examLabelList = null;
      vm.detail = detail;
      resetParams();
    }

    function detail(item) {
      var openPop = function() {
        var option = {
              size: 'lg',
              templateUrl: 'MNIS/modules/examLabel/examLabel.tpl.html',
              data: {

              },
              ok: function(data){
                console.log('ok')
              },
              methodsObj: {
                current: item,
                indexPatient: vm.indexPatient
              }
          }
        modalService.open(option)
      };
      openPop();
    }

    function loadData() {
      return nursingRest.getInhosRecords(profile.wardCode).then(function(data) {
        vm.patients = data;
      });
    }

    function loadOrders() {
      if(!$stateParams.inhosCode) {
        return $q.resolve([]).then(function(data) {
          vm.list = data;
        });
      }

      vm.getExamLabelParams.pid = $stateParams.patCode;
      vm.getExamLabelParams.inhosCode = $stateParams.inhosCode;
      return examLabelRest.getExamLabel(vm.getExamLabelParams).then(function(response){
        vm.examLabelList = response;
      }, function(error) {
        console.log(error)
      })
    }

    function patientsFilter(data) {
      return data.bedCode.indexOf(vm.filterText) > -1;
    }

    function resetParams() {
      vm.getExamLabelParams = {
        begin: moment().format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
        pid: '',
        inhosCode: ''
      };
    }
  }
})();
