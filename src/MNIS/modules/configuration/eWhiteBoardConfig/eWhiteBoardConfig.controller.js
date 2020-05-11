(function () {
    'use strict';
  
    angular
      .module('lachesis-mnis')
      .controller('EWhiteBoardConfigController', EWhiteBoardConfigController);
  
    /** @ngInject */
    function EWhiteBoardConfigController($scope, nursingRest, sessionService, _) {
      var vm = this;
      var dicHelper = sessionService.getDicHelper();
      var dic = dicHelper.dic;
      var profile = sessionService.getProfile();
      vm.formData = {
        basicConfig: {},
        leftSideConfig: {
          showECGDeviceOnBedList: false,
          showMEWSPathOnBedList: false,
          showCritical: false,
          showSevere: false,
          showDischarged: false,
          showSurgery: false
        },
        wardOverviewConfig: {}
      };
      vm.nurseLevel = dicHelper.dic.nurseLevel;
      vm.showNursingLevel = false;
      vm.dangerLevel= [
        {
          dicName: '危'
        },
        {
          dicName: '重'
        }
      ]
      vm.pageThemes = [{
        key: 'light',
        value: '浅色版'
      }, {
        key: 'dark',
        value: '深色版'
      }];
      vm.showWays = [{
        key: '0',
        value: '文字'
      }, {
        key: '1',
        value: '彩色图标'
      }];
      vm.wardInfosToShow = dealWithSysDicData(dic.wardInfosToShow);
      vm.nursingContentsToShow = dealWithSysDicData(dic.nursingContentsToShow);
      vm.specialInspectionsToShow = dealWithSysDicData(dic.specialInspectionsToShow);
      vm.patientInfosToShow = dealWithSysDicData(dic.patientInfosToShow);
      vm.nursingInfosToShow = dealWithSysDicData(dic.nursingInfosToShow);
      vm.evaluateNature = dealWithSysDicData(dic.evaluateNature);
      vm.patVitalEvent = dealWithSysDicData(dic.patVitalEvent);
      vm.orderType = dealWithSysDicData(dic.orderType);
      vm.vitalItem = dealWithSysDicData(dic.vitalItem);
      vm.vitalItem = vm.vitalItem.concat(vm.evaluateNature);

      vm.save = save;
      vm.move = move;
      vm.isInCollection = isInCollection;
      vm.removeClick = removeClick;
      vm.addClickWardOverviewConfig = addClickWardOverviewConfig;
      vm.addClickWardBedListConfig = addClickWardBedListConfig;
      vm.addClickVitalEventConfig = addClickVitalEventConfig;
      vm.addClickTaskPlanConfig = addClickTaskPlanConfig;

      var watcher = $scope.$watch("vm.formData.bedListConfig.nursingInfosToShow", function (value) {
        if (value) {
          var findObj = _.find(value, function (item) {
            return item.itemCode == 'nursingLevel';
          });

          if (findObj) {
            vm.showNursingLevel = true;
          }
        }
      });
      $scope.$on("$destroy", watcher);

      activate();

      function activate() {
        getWhiteBoardConfig();
      }

      function dealWithSysDicData(data) {
        var transferData = _.map(data, function (item) {
          return {
            itemCode: item.dicCode,
            itemName: item.dicName,
            showEmptyItem: item.showEmptyItem ? item.showEmptyItem : false
          }
        });
        return transferData;
      }

      function getWhiteBoardConfig() {
        return nursingRest.getWhiteBoardConfig().customGET('', {
          wardCode: profile.wardCode
        }).then(function (response) {
          if (!_.get(response, "config")) {
            return;
          }
          var data = response.config;
          vm.formData = data;
        });
      }

      function save() {
        var data = angular.merge({}, vm.formData);

        nursingRest.getWhiteBoardConfig().customPOST({
          config: data,
          wardCode: profile.wardCode
        }).then(function () {
          $scope.$emit('toast', '保存成功');
        });
      }

      function move(collection, type, orderIndex) {
        var index = _.findIndex(collection, function (item) {
          return orderIndex === item.orderIndex;
        });

        if (type === 'up') {
          if (collection[index].orderIndex === 0) {
            return;
          }
          var prevIndex = _.findIndex(collection, function (item) {
            return item.orderIndex === collection[index].orderIndex - 1;
          });
          collection[prevIndex].orderIndex = collection[index].orderIndex;
          collection[index].orderIndex -= 1;
        }

        if (type === 'down') {
          if (collection[index].orderIndex === collection.length - 1) {
            return;
          }
          var nextIndex = _.findIndex(collection, function (item) {
            return item.orderIndex === collection[index].orderIndex + 1;
          });
          collection[nextIndex].orderIndex = collection[index].orderIndex;
          collection[index].orderIndex += 1;
        }
      
      }

      function isInCollection(collection, item) {
        if (!collection) {
          return true;
        }
        var found = _.find(collection, function (rowItem) {
          return item.itemCode === rowItem.itemCode;
        });

        return !found;
      }

      function removeClick(event, list, itemCode) {
        if (itemCode == 'nursingLevel') {
          vm.showNursingLevel = false;
        }
        event.originalEvent.stopPropagation();

        var index = _.findIndex(list, function (item) {
          return item.itemCode == itemCode;
        });

        var findObj = _.find(list, function (item) {
          return item.itemCode == itemCode;
        });

        list.splice(index, 1);

        var findArr = _.chain(list)
                       .filter(function (item) {
                        return item.orderIndex > findObj.orderIndex;
                      })
                      .map(function (item) {
                        item.orderIndex--;
                        return item;
                      })
                      .value();
        list = _.uniq(list.concat(findArr));

      }

      function addClickWardOverviewConfig(item, attr) {
        if (!vm.formData.wardOverviewConfig) {
          vm.formData.wardOverviewConfig = {};
          vm.formData.wardOverviewConfig[attr] = [];
        } else if (!vm.formData.wardOverviewConfig[attr]) {
          vm.formData.wardOverviewConfig[attr] = [];
        }
        item.orderIndex = vm.formData.wardOverviewConfig[attr].length;
        vm.formData.wardOverviewConfig[attr].push(item);
      }

      function addClickWardBedListConfig(item, attr) {
        if (!vm.formData.bedListConfig) {
          vm.formData.bedListConfig = {};
          vm.formData.bedListConfig[attr] = [];
        } else if (!vm.formData.bedListConfig[attr]) {
          vm.formData.bedListConfig[attr] = [];
        }
        item.orderIndex = vm.formData.bedListConfig[attr].length;
        vm.formData.bedListConfig[attr].push(item);

        if (attr == 'nursingInfosToShow' && item.itemCode == 'nursingLevel') {
          vm.showNursingLevel = true;
        }
      }

      function addClickVitalEventConfig(item, attr) {
        if (!vm.formData.vitalEventConfig) {
          vm.formData.vitalEventConfig = {};
          vm.formData.vitalEventConfig[attr] = [];
        } else if (!vm.formData.vitalEventConfig[attr]) {
          vm.formData.vitalEventConfig[attr] = [];
        }
        item.orderIndex = vm.formData.vitalEventConfig[attr].length;
        vm.formData.vitalEventConfig[attr].push(item);
      }

      function addClickTaskPlanConfig(item, attr) {
        if (!vm.formData.taskPlanConfig) {
          vm.formData.taskPlanConfig = {};
          vm.formData.taskPlanConfig[attr] = [];
        } else if (!vm.formData.taskPlanConfig[attr]) {
          vm.formData.taskPlanConfig[attr] = [];
        }
        item.orderIndex = vm.formData.taskPlanConfig[attr].length;
        vm.formData.taskPlanConfig[attr].push(item);
      }
    }
  })();
  