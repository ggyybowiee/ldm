(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('examExtPanel', examExtPanel);


  function examExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        editData: "=",
        extendEcho: "=",
        insertCallback: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, examLabelRest, $timeout, moment, $filter, nursingRecordUtil) {

        var vm = this;

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

          vm.reportText = "";
          vm.reportText += "检查印象\n" + (vm.selectedExam.patExamReport.examPara || "") + "\n\n";
          vm.reportText += "检查所见：\n" + (vm.selectedExam.patExamReport.description || "") + "\n\n";
          vm.reportText += "检查印象：\n" + (vm.selectedExam.patExamReport.impression || "") + "\n\n";
          vm.reportText += "检查建议：\n" + (vm.selectedExam.patExamReport.recommendation || "") + "\n\n";
        }


        // 获取检查列表
        function getExams() {

          resetParams();
          vm.getExamLabelParams.pid = $scope.patientInfo.patCode;
          vm.getExamLabelParams.inhosCode = $scope.patientInfo.inhosCode;
          return examLabelRest.getExamLabel(vm.getExamLabelParams).then(function (response) {
            vm.examList = $filter('orderBy')(response.plain(), '-patExamMaster.examDateTime');
            if (vm.examList.length > 0)
              vm.selectExam(vm.examList[0]);
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

        vm.textareaOnBlur = function () {
          var textarea = angular.element('#patient-exam-ext-import-textarea')[0];
          vm.importText = textarea.value.substr(textarea.selectionStart, textarea.selectionEnd - textarea.selectionStart);
        }

        // 插入引用部分
        vm.insertText = function () {
          if (!vm.importText) {
            $rootScope.$broadcast('toast', {
              type: 'warning',
              content: '请选择需要引用内容'
            });
            return;
          }
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, vm.importText, $scope, $scope.insertCallback);
          vm.importText = "";
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/examExtPanel.tpl.html"
    }

    return directive;
  }
})();
