(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('patientTestList', patientTestList);

  /** @ngInject */
  function patientTestList(examLabelRest) {
    var directive = {
      restrict: 'E',
      scope: {
        patientInfo: '='
      },
      templateUrl: 'MNIS/directives/patientRecord/testList/patientTestList.tpl.html',
      controller: function ($scope, $filter, moment, sessionService, $timeout, _) {

        var vm = this;
        vm.dicHelper = sessionService.getDicHelper();
        vm.hospitalInfo = sessionService.getHospitalInfo();

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {

          if (value) {
            vm.current = value.inhosCode;
            $timeout(function () {
              vm.loadPatientTest.func();
            })
          }
        });
        $scope.$on('$destroy', patientWatcher);

        //加载患者医嘱 
        function getPatientTest() {
          resetParams();
          vm.getTestParams.pid = $scope.patientInfo.patCode;
          vm.getTestParams.inhosCode = $scope.patientInfo.inhosCode;
          vm.selectedTest = null;
          return examLabelRest.getTestLabel(vm.getTestParams).then(function (response) {
            vm.testList = $filter('orderBy')(response.plain(), '-labMaster.requestedDateTime');

            if (vm.testList.length > 0)
              vm.selectedTest = vm.testList[0];
          });
        }

        // 重置查询参数
        function resetParams() {
          vm.getTestParams = {
            begin: moment($scope.patientInfo.inDate).format('YYYY-MM-DD'),
            end: moment().format('YYYY-MM-DD')
          };
        }

        // 选中检验状态
        vm.selectText = function (testReport) {
          vm.selectedTest = testReport;
        }

        initModelView();
        // 初始化视图
        function initModelView() {

          vm.filter = {
            showType: 0
          };

          // 医嘱加载
          vm.loadPatientTest = {
            func: getPatientTest
          };


        }

      },
      controllerAs: 'vm'
    };

    return directive;
  }

})();
