(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('patientSelectorBar', patientSelectorBar)
    .filter('arrayToString', function () {
      return function (array) {
        var result = "";
        if (angular.isArray(array)) {
          for (var i = 0; i < array.length; i++) {
            result += ((i == 0) ? '' : ',') + array[i];
          }
        }

        return result;
      }
    });


  function patientSelectorBar($rootScope,  _, nursingRest, sessionService, moment, taskRemindRest, modalService) {

    var directive = {
      restrict: "E",
      scope: {
        onPatientSelected: '=',
        initPatientCode: '=',
        wardCode: '=',
        isPatLoadingEcho: "=",
        patients: '='
      },
      replace: true,
      transclude: true,

      controller: function ($q, $scope, $timeout) {
        var vm = this;
        vm.filterText = "";
        vm.profile = sessionService.getProfile();
        var wardCode = $scope.wardCode || vm.profile.wardCode;
        vm.filter = {
          showType: 0,
          isOpen: false
        };

        vm.sortList = sortList;
        vm.toggle = toggle;
        vm.sortType = '';

        vm.params = {
          beginTime: moment().subtract(3, 'months').format('YYYY-MM-DD'),
          endTime: moment().format('YYYY-MM-DD')
        };

        vm.loadPatientRecord = {
          func: initPatientRecord,
          init: true
        };

        vm.loadHistoryPatients = {
          func: getOutHosRecord,
          init: true
        };

        vm.loadPatients = {
          func: getInhosRecord,
          init: true
        }

        vm.openPatientList = function () {
          vm.loadPatients.func();
        }

        vm.search = function () {
          if (
            new Date(vm.params.beginTime).getTime() >
            new Date(vm.params.endTime).getTime()
          ) {
            $scope.$emit("toast", {
              type: "warning",
              content: "开始日期不能大于结束日期"
            });
            return;
          }
          vm.loadHistoryPatients.func();
        }

        // 病人信息更改监听
        var patientsWatcher = $scope.$watch('patients', function (value) {
          if (value) {
            var findPatient = _.find(value, {
              'inhosCode': $scope.initPatientCode
            });

            if (findPatient.realTimeEvaluateList && findPatient.realTimeEvaluateList.length > 0) {
              findPatient.realTimeEvaluateList = _.filter(findPatient.realTimeEvaluateList, function (item) {
                return item.riskLevel !== '04';
              });
            }

            vm.patient = findPatient;
          }
        });
        $scope.$on('$destroy', patientsWatcher);

        // 获取患者列表
        vm.loadPatientRecord.func();

        function initPatientRecord() {
          $scope.isPatLoadingEcho.isOpen = true;
          // , getTransferHosRecord() getInhosRecord(),
          $q.all([getOutHosRecord(), getTransferHosRecord(), getPatientByInhosCode()]).then(function (results) {

            if ($scope.initPatientCode) {

              var findPatient = _.find($scope.patients, {
                'inhosCode': $scope.initPatientCode
              });

              vm.currentIndex = _.findIndex($scope.patients, {
                'inhosCode': $scope.initPatientCode
              });

              if (setSelectedPatient(findPatient, 0)) {
                return;
              }

              var findTransferPatient = _.find(vm.transferPatients, {
                'inhosCode': $scope.initPatientCode
              });

              if (setSelectedPatient(findTransferPatient, 1)) {
                return;
              }

              var findHistoryPatient = _.find(vm.historyPatients, {
                'inhosCode': $scope.initPatientCode
              });
              
              if (setSelectedPatient(findHistoryPatient, 2)) {
                return;
              }

              var findPatientByInhosCode = _.find(vm.patientsByInhosCode, {
                'inhosCode': $scope.initPatientCode
              });

              if (setSelectedPatient(findPatientByInhosCode, 2)) {
                return;
              }

              // 临时方案
              if ($scope.patients.length > 0) {
                setSelectedPatient($scope.patients[0]);
                return;
              }

              // TODO:通过输入住院号查找的患者
              selectedPatientByHid($scope.initPatientCode);

            } else if ($scope.patients.length > 0) {
              setSelectedPatient($scope.patients[0]);
            } else {
              $scope.isPatLoadingEcho.isOpen = false;
            }

          });
        }

        var doSomethingByTabType = {
          0: getInhosRecordByOrder,
          1: getTransferHosRecord,
          2: getOutHosRecord
        }

        function sortList(type, tabType) {
          vm.sortType = type + tabType;
          doSomethingByTabType[tabType](type);
        }

        function getInhosRecordByOrder(orderBy) {
          return nursingRest.getInhosRecordsByOrder(wardCode, {
            orderBy: orderBy || ''
          }).then(function (data) {
            vm.patients = _.get(data, 'queryResult') || [];
          });
        }

        function getInhosRecord() {
          return nursingRest.getInhosRecords(wardCode).then(function (data) {
            vm.patients = data;
          });
        }

        function getPatientByInhosCode(orderBy) {
          return nursingRest.getPatientByInhosCode({
            searchKey: $scope.initPatientCode || '',
            orderBy: orderBy || ''
          }).then(function (res) {
            vm.patientsByInhosCode = res.plain();
          });
        }

        // 获取出院患者信息
        function getOutHosRecord(orderBy) {
          var params = {
            wardCode: wardCode,
            beginTime: vm.params.beginTime,
            endTime: vm.params.endTime,
            orderBy: orderBy || ''
          };
          return nursingRest.getHisRecords(params).then(function (data) {
            vm.historyPatients = _.get(data, 'queryResult') || [];
          });
        }

        function getTransferHosRecord(orderBy) {
          return nursingRest.getTransferByWard({
            wardCode: wardCode,
            beginTime: moment().subtract(3, 'months').format('YYYY-MM-DD'),
            endTime: moment().format('YYYY-MM-DD'),
            orderBy: orderBy || ''
          }).then(function (data) {
            vm.transferPatients = _.get(data, 'queryResult') || [];
          });
        }

        vm.isCurInHosPatient = function () {
          return !vm.patStatus || vm.patStatus == 0;
        }

        // 上一个患者
        vm.previewPatientBtnOnClick = function () {
          if (vm.isCurInHosPatient()) {
            var index = _.findIndex($scope.patients, function (item) {
              return item.inhosCode === vm.patient.inhosCode;
            }) - 1;
            
            vm.currentIndex = index;
            if (index >= 0)
              setSelectedPatient($scope.patients[index], 0);
          }
        }

        // 下一个患者
        vm.nextPatientBtnOnClick = function () {
          if (vm.isCurInHosPatient()) {
            var index = _.findIndex($scope.patients, function (item) {
              return item.inhosCode === vm.patient.inhosCode;
            }) + 1;

            vm.currentIndex = index;
            if (index < $scope.patients.length)
              setSelectedPatient($scope.patients[index], 0);
          }
        }

        // 选中患者
        vm.patientSelector = function (pat, patStatus) {
          vm.filter.isOpen = false;
          vm.sortType = '';
          setSelectedPatient(pat, patStatus);
        }

        function toggle() {
          if (!vm.filter.isOpen) {
            vm.sortType = '';
          }
        }

        function setSelectedPatient(patient, patStatus) {

          if (patient == undefined) {
            vm.editInhosCode = "";
            return false;
          }

          vm.patStatus = patStatus;

          if (patient.realTimeEvaluateList && patient.realTimeEvaluateList.length > 0) {
            patient.realTimeEvaluateList = _.filter(patient.realTimeEvaluateList, function (item) {
              return item.riskLevel !== '04';
            });
          }

          vm.patient = patient;
          delete vm.patientRemindList;
          vm.editInhosCode = vm.patient.displayCode;

          if ($scope.onPatientSelected) {
            $scope.onPatientSelected(vm.patient);
            $scope.isPatLoadingEcho.isOpen = false;
          }

          taskRemindRest.taskRemindsResource(vm.patient.inhosCode).customGET().then(function (response) {
            vm.patientRemindList = response.plain();
          });

          return true;
        }

        // 住院号编辑ENTER
        vm.inhosCodeEnter = function () {
          selectedPatientByHid(vm.editInhosCode);
        }

        // 住院号编辑结束
        vm.inhosCodeCancel = function () {
          vm.editInhosCode = vm.patient.displayCode;
        }

        function selectedPatientByHid(inhosCode) {
          // TODO:通过输入住院号查找的患者
          
        }

        vm.searchPatientFilter = function (item) {
          if (!vm.searchText || vm.searchText == "") {
            return true;
          }

          if (_.startsWith(item.displayCode, vm.searchText) || item.patName.indexOf(vm.searchText) !== -1) {
            return true;
          }

          if (item.bedCode && item.bedCode.indexOf(vm.searchText) !== -1) {
            return true;
          }

          return false;
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/directives/patientSelectorBar/patientSelectorBar.tpl.html"
    }

    return directive;
  }
})();
