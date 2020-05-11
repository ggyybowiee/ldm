(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('vitalsignExtPanel', vitalsignExtPanel);


  function vitalsignExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        extendEcho: "=",
        editData: "=",
        patientInfo: "=",
        tpl: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, $timeout, sessionService, moment, nursingRecordUtil, modalService, $filter, _, nursingRest) {

        var vm = this;
        vm.dic = sessionService.getDicHelper().dic;
        vm.vitalSignTypeDic = {};
        _.forEach(vm.dic.vitalItem, function (item) {
          vm.vitalSignTypeDic[item.dicCode] = item;
        });
        vm.vitalSignItemSourceDic = {};
        _.forEach(vm.dic.vitalItemSource, function (item) {
          vm.vitalSignItemSourceDic[item.dicCode] = item;
        });

        // 初始化视图模型
        initViewModel();

        function initViewModel() {

          vm.loadVitalsign = {
            func: getVitalSign
          }

          vm.timePointVitalsignTypes = ['temperature', 'bloodPress', 'breath', 'pulse', 'heartRate', 'oxygenSaturation', 'sense', 'mews'];
          vm.exsitVitalsignTypes = [];
          _.forEach($scope.tpl.components, function (item) {
            if (vm.timePointVitalsignTypes.indexOf(item.key) != -1) {
              vm.exsitVitalsignTypes.push({
                type: item.key,
                text: item.text,
                display: 'value'
              });
              vm.exsitVitalsignTypes.push({
                type: item.key,
                text: item.text,
                display: 'source'
              });
            }
          });

          // 患者监听器
          var patientWatcher = $scope.$watch('patientInfo', function (value) {
            if (value) {
              resetParams();
              $timeout(function () {
                vm.loadVitalsign.func();
              })
            }
          });
          $scope.$on('$destroy', patientWatcher);

          $timeout(function () {

            vm.filter = {
              showIndex: 0,
              showType: '0'
            }
          })
        }

        // 选择体征项目
        vm.insertVitalSignItem = function (timePointItem) {

          var hasValue = false;
          _.forEach(vm.exsitVitalsignTypes, function (vitalSignType) {
            if ($scope.editData.data[vitalSignType.type])
              hasValue = true;
          });

          if (hasValue) {
            modalService.open({
              templateUrl: 'MNIS/components/nursingDoc/popupEditRow/extendPanel/vitalsignExtConfirmPanel.modal.html',
              size: "sm",
              ok: function (data, overwrite) {
                if (overwrite)
                  replaceAllValue(timePointItem);
                else
                  fillEmptyValue(timePointItem);

                return true;
              }
            });
          } else {
            replaceAllValue(timePointItem);
          }
        }


        // 覆盖所有值
        function replaceAllValue(timePointItem) {
          _.forEach(vm.exsitVitalsignTypes, function (vitalSignType) {
            if (timePointItem[vitalSignType.type] != undefined)
              $scope.editData.data[vitalSignType.type] = timePointItem[vitalSignType.type].vitalSignsValues;
          });
        }

        // 补充未填值
        function fillEmptyValue(timePointItem) {
          _.forEach(vm.exsitVitalsignTypes, function (vitalSignType) {
            if (!$scope.editData.data[vitalSignType.type] && timePointItem[vitalSignType.type] != undefined)
              $scope.editData.data[vitalSignType.type] = timePointItem[vitalSignType.type].vitalSignsValues;
          });
        }

        function resetParams() {

          var stDate = new Date(moment(new Date(nursingRecordUtil.getRecordDate($scope.editData))).format('YYYY-MM-DD'));
          var edDate = new Date(moment(new Date(stDate)).subtract(-1, 'days').format('YYYY-MM-DD'));

          vm.queryParam = {
            startDate: stDate,
            endDate: edDate,
            gatherType: '0',
            inhosCode: $scope.patientInfo.inhosCode
          };
        }

        function getVitalSign() {

          vm.queryParam.endDate = new Date(moment(new Date(vm.queryParam.startDate)).subtract(-1, 'days').format('YYYY-MM-DD'));

          return nursingRest.getVitalsignsForImport(vm.queryParam).then(function (response) {

            var nursingRecordDate = nursingRecordUtil.getRecordDate($scope.editData);
            var nearestTimePoint = undefined;

            var recrodDateGroup = _.groupBy(response.plain(), 'recordDate');
            var timePointList = [];
            _.forEach(recrodDateGroup, function (value, key) {

              var timePointValue = {
                recordDate: key
              };

              var hasValue = false;
              _.forEach(value, function (vital) {
                if (_.findIndex(vm.exsitVitalsignTypes, {
                    'type': vital.vitalSigns
                  }) != -1) {
                  timePointValue[vital.vitalSigns] = vital;
                  hasValue = true;
                }
              });

              if (hasValue) {

                timePointList.push(timePointValue);
                if (!nearestTimePoint) {
                  nearestTimePoint = timePointValue;
                } else if (Math.abs(new Date(timePointValue.recordDate) - nursingRecordDate) < Math.abs(new Date(nearestTimePoint.recordDate) - nursingRecordDate)) {
                  nearestTimePoint = timePointValue;
                }
              }
            });


            if (nearestTimePoint)
              nearestTimePoint.isNear = true;
            vm.timePointList = $filter('orderBy')(timePointList, '-recordDate');
          });
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/vitalsignExtPanel.tpl.html"
    }

    return directive;
  }
})();
