(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('patientExamList', patientExamList);

  /** @ngInject */
  function patientExamList() {
    var directive = {
      restrict: 'E',
      replace: true,
      scope: {
        patientInfo: '='
      },
      templateUrl: 'MNIS/directives/patientRecord/examList/patientExamList.tpl.html',
      controller: function ($scope, $filter, sessionService, $timeout, examLabelRest, moment) {

        var vm = this;
        vm.dicHelper = sessionService.getDicHelper();
        vm.hospitalInfo = sessionService.getHospitalInfo();

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {

          if (value) {
            vm.current = value.inhosCode;
            $timeout(function () {
              vm.loadExams.func();
            })
          }
        });
        $scope.$on('$destroy', patientWatcher);

        // 重置查询参数
        function resetParams() {
          vm.getExamLabelParams = {
            begin: moment($scope.patientInfo.inDate).format('YYYY-MM-DD'),
            end: moment().format('YYYY-MM-DD')
          };
        }

        vm.selectExam = function (exam) {
          vm.selectedExam = exam;
        }


        // 获取检查列表
        function getExams() {

          resetParams();
          vm.getExamLabelParams.pid = $scope.patientInfo.patCode;
          vm.getExamLabelParams.inhosCode = $scope.patientInfo.inhosCode;
          return examLabelRest.getExamLabel(vm.getExamLabelParams).then(function (response) {
            vm.examList = $filter('orderBy')(response.plain(), '-patExamMaster.examDateTime');
            if (vm.examList.length > 0)
              vm.selectedExam = vm.examList[0];
          })
        }

        initModelView();
        // 初始化视图
        function initModelView() {

          vm.loadExams = {
            func: getExams
          }

          vm.getExamLabelParams = {};
        }

      },
      controllerAs: 'vm'
    };

    return directive;
  }

})();
