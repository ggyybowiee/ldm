(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('testExtPanel', testExtPanel);


  function testExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        editData: "=",
        extendEcho: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, $timeout, examLabelRest, $filter, moment, nursingRecordUtil, _) {

        var vm = this;

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {

          if (value) {
            vm.current = value.inhosCode;
            vm.selectedTests = [];
            vm.avalibleItems = [];
            vm.selectedItems = [];

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
        vm.selectTest = function (testReport) {
          var index = vm.selectedTests.indexOf(testReport);
          if (index == -1) {
            vm.selectedTests.push(testReport);
            _.forEach(testReport.reportItems, function (item) {
              vm.avalibleItems.push(item);
            })
          } else {
            vm.selectedTests.splice(index, 1);
            _.remove(vm.avalibleItems, {
              'testCode': testReport.labMaster.testCode
            });
            _.remove(vm.selectedItems, {
              'testCode': testReport.labMaster.testCode
            });
          }

          generateImportText();

        }

        // 选中检验项状态
        vm.selectedItem = function (testReportItem, option) {

          if (testReportItem != undefined) {
            var index = vm.selectedItems.indexOf(testReportItem);
            if (index == -1) {
              vm.selectedItems.push(testReportItem);
            } else {
              vm.selectedItems.splice(index, 1);
            }
          } else if (option == 0) {
            // 全不选
            vm.selectedItems = [];
          } else if (option == 1) {
            // 全选
            vm.selectedItems = [];
            _.forEach(vm.avalibleItems, function (item) {
              vm.selectedItems.push(item);
            });
          } else if (option == -1) {
            //  反选
            var newSelectedItems = [];
            _.forEach(vm.avalibleItems, function (item) {
              if (vm.selectedItems.indexOf(item) == -1)
                newSelectedItems.push(item);
            })

            vm.selectedItems = newSelectedItems;
          }

          generateImportText();
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

        function generateImportText() {

          var showReports = {};
          _.forEach(vm.selectedTests, function (report) {
            var reportCopy = angular.copy(report.labMaster)
            reportCopy.showItems = [];
            showReports[report.labMaster.testCode] = reportCopy;
          })

          _.forEach(vm.selectedItems, function (item) {
            if (showReports[item.testCode] != undefined)
              showReports[item.testCode].showItems.push(item);
          })

          var importText = "";
          _.forEach(showReports, function (value, key) {

            if (value.showItems.length > 0)
              importText += "" + value.testCause + ": ";

            _.forEach(value.showItems, function (item, index) {
              importText += (item.itemName + "," + item.result + (item.units || "")) + ((index == value.showItems.length - 1) ? " " : ", ");
            });
          });

          vm.appendText = importText;
        }

        // 引用文字
        vm.importText = function () {
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, vm.appendText, $scope, $scope.insertCallback);
        }

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/testExtPanel.tpl.html"
    }

    return directive;
  }
})();
