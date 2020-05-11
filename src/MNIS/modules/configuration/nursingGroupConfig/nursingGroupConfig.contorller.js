(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('NursingGroupConfigController', NursingGroupConfigController);

  /** @ngInject */
  function NursingGroupConfigController($scope, $filter, moment, sessionService, userShiftRest, modalService, _) {

    // 自动注入服务数据声明
    var vm = this;
    var profile = sessionService.getProfile();
    var wardCode = profile.wardCode;


    // 加载护士班次
    vm.loadNursingDuty = {
      func: getNursingDuty,
      init: true
    };

    function getNursingDuty() {
      return userShiftRest.getUserDuty({
        wardCode: wardCode
      }).then(function (data) {
        vm.nursingDuty = data;
        for (var i = 0; i < vm.nursingDuty.length; i++)
          processNursingDutyAfterGet(vm.nursingDuty[i]);

        if (vm.nursingDuty.length > 0) {
          vm.selectedDuty = vm.nursingDuty[0];
          vm.loadNursingGroup.func();
        }
      });
    }

    // 选择班次
    vm.selectDuty = function (duty) {
      if (vm.selectedDuty == duty)
        return;

      vm.selectedDuty = duty;
      vm.loadNursingGroup.func();
    }

    // 获取选中班次类型
    vm.getSelectedDutyClass = function (duty) {
      return duty == vm.selectedDuty ? "duty-selected" : "";
    }

    // 添加班次
    vm.addDuty = function () {

      var newDuty = newNursingDuty();

      modalService.open({
        size: "sm",
        templateUrl: "MNIS/modules/configuration/nursingGroupConfig/nursingDutyEdit.modal.html",
        data: {
          formData: newDuty
        },
        ok: function () {

          newDuty = processNursingDutyBeforeSave(newDuty);
          userShiftRest.addUserDuty(newDuty).then(function (data) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功"
            });

            processNursingDutyAfterGet(data);
            vm.nursingDuty.push(data);
            vm.selectedDuty = data;
            vm.loadNursingGroup.func();
          });
          return true;
        },
        methodsObj: {},
        initFn: function () {
          var modal = this;
          modal.type = "新增";
        }
      });
    }

    // 删除班次
    vm.deleteDuty = function (duty, index) {

      userShiftRest.deleteUserDuty(duty.seqId).then(function () {
        $scope.$emit("toast", {
          type: "success",
          content: "删除成功"
        });
        vm.nursingDuty.splice(index, 1);
        vm.selectedDuty = null;
      });
    }

    // 编辑班次
    vm.editDuty = function (duty, index) {

      var dutyCopy = angular.copy(duty);
      modalService.open({
        size: "sm",
        templateUrl: "MNIS/modules/configuration/nursingGroupConfig/nursingDutyEdit.modal.html",
        data: {
          formData: dutyCopy
        },
        ok: function () {

          dutyCopy = processNursingDutyBeforeSave(dutyCopy);
          userShiftRest.updateUserDuty(dutyCopy).then(function (data) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功"
            });
            processNursingDutyAfterGet(data);
            vm.nursingDuty.splice(index, 1, data);
            vm.selectedDuty = data;
            vm.loadNursingGroup.func();
          });
          return true;
        },
        methodsObj: {},
        initFn: function () {
          var modal = this;
          modal.type = "编辑";
        }
      });
    }


    // 护士分组信息
    vm.loadNursingGroup = {
      func: getNursingGroup
    };

    // 获取护士班次下分组
    function getNursingGroup() {
      if (!vm.selectedDuty)
        return;

      return userShiftRest.getUserGroup({
        wardCode: wardCode,
        shiftName: vm.selectedDuty.shiftName
      }).then(function (data) {
        vm.nursingGroup = data.queryResult;
        for (var i = 0; i < vm.nursingGroup.length; i++) {
          processNursingGroupAfterGet(vm.nursingGroup[i]);
        }
      });
    }

    // 添加分组
    vm.addNursingGroupButtonOnClick = function () {
      var groupCopy = newNursingGourp();
      modalService.open({
        size: "sm",
        templateUrl: "MNIS/modules/configuration/nursingGroupConfig/nursingGroupEdit.modal.html",
        data: {
          formData: groupCopy
        },
        ok: function () {
          var findIndex = _.findIndex(vm.nursingGroup, { teamName: groupCopy.teamName});

          if (findIndex > -1) {
            $scope.$emit("toast", {
              type: "warning",
              content: "添加失败：该床位分组已存在"
            });
            return false;
          }

          userShiftRest.addUserGroup(groupCopy).then(function (data) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功"
            });
            processNursingGroupAfterGet(data);
            vm.nursingGroup.push(data);
          });
          
          return true;
        },
        methodsObj: {
          validateBedRange: function () {

            var that = this;
            var bedItem = that.formData.bedRange.split(",");

            var singleBedReg = /^[\d]+$/;
            var bedRangeReg = /^[\d]+-[\d]+$/;

            for (var i = 0; i < bedItem.length; i++) {
              if (!(singleBedReg.test(bedItem[i]) || bedRangeReg.test(bedItem[i]))) {
                return false;
              }
            }

            return true;
          }
        },
        initFn: function () {
          var modal = this;
          modal.type = "新增";
        }
      });
    }

    vm.editNursingGroup = function (group, index) {
      var groupCopy = angular.copy(group);
      modalService.open({
        size: "sm",
        templateUrl: "MNIS/modules/configuration/nursingGroupConfig/nursingGroupEdit.modal.html",
        data: {
          formData: groupCopy
        },
        ok: function () {
          var findIndex = _.findIndex(vm.nursingGroup, { teamName: groupCopy.teamName });

          if (findIndex > -1) {
            $scope.$emit("toast", {
              type: "warning",
              content: "编辑失败：该床位分组已存在"
            });
            return false;
          }

          userShiftRest.updateUserGroup(groupCopy).then(function (data) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功"
            });
            processNursingGroupAfterGet(data);
            vm.nursingGroup.splice(index, 1, data);
          });
          return true;
        },
        methodsObj: {
          validateBedRange: function () {

            var that = this;
            var bedItem = that.formData.bedRange.split(",");

            var singleBedReg = /^[\d]+$/;
            var bedRangeReg = /^[\d]+-[\d]+$/;

            for (var i = 0; i < bedItem.length; i++) {
              if (!(singleBedReg.test(bedItem[i]) || bedRangeReg.test(bedItem[i]))) {
                return false;
              }
            }

            return true;
          }
        },
        initFn: function () {
          var modal = this;
          modal.type = "编辑";
        }
      });
    }

    // 删除分组
    vm.deleteNursingGroupButtonOnClick = function (group, index) {

      userShiftRest.deleteUserGroup(group.seqId).then(function () {
        $scope.$emit("toast", {
          type: "success",
          content: "删除成功"
        });
        if (vm.nursingGroup.length === 1) {
          vm.loadNursingDuty.func();
        }
        vm.nursingGroup.splice(index, 1);
      });

    }

    // 初始化ViewModel
    initViewModel();

    function initViewModel() {

      vm.metaData = {};
    }

    function newNursingDuty() {
      return {
        startTimeString: "8:00",
        endTimeString: "18:00",
        // 1-启用，9-禁用
        status: "1",
        wardCode: wardCode
      }
    }

    function newNursingGourp() {
      return {
        shiftName: vm.selectedDuty.shiftName,
        bedRange: "",
        // 1-启用，9-禁用
        status: "1",
        teamName: "",
        wardCode: wardCode
      }
    }

    // NursingDuty时间段预处理
    function processNursingDutyAfterGet(nursingDuty) {
      var date = $filter('date');
      nursingDuty.startTimeString = date(nursingDuty.startTime, 'HH:mm');
      nursingDuty.endTimeString = date(nursingDuty.endTime, 'HH:mm');
      nursingDuty.status += "";
    }

    function processNursingDutyBeforeSave(nursingDuty) {

      var copy = angular.copy(nursingDuty)

      copy.startTime = new Date("1970-01-01 " + copy.startTimeString);
      copy.endTime = new Date("1970-01-01 " + copy.endTimeString);
      copy.startTime = moment(copy.startTime).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      copy.endTime = moment(copy.endTime).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');

      delete copy.startTimeString;
      delete copy.endTimeString;
      return copy;
    }

    // NursingGroup
    function processNursingGroupAfterGet(nursingGroup) {
      nursingGroup.status += "";
    }
  }
})();
