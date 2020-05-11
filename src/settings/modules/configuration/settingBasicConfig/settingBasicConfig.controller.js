(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('settingBasicConfig', settingBasicConfig);

  /** @ngInject */
  function settingBasicConfig($scope, configRest, $timeout, authHelperService, modalService, _) {

    var vm = this;

    // 初始化视图
    initViewModel();

    function initViewModel() {
      vm.loadConfiguration = {
        func: getConfiguration
      }

      vm.filter = {
        appResourceCode: "all",
        filterText: ""
      }

      $timeout(function () {
        vm.loadConfiguration.func();
      });
    }

    // 获取配置
    function getConfiguration() {

      return configRest.getConfigItem().then(function (response) {

        vm.appResourceList = authHelperService.getApps(null, true);
        vm.appResourceDic = {};
        _.forEach(vm.appResourceList, function (item) {
          vm.appResourceDic[item.resourceCode] = item;
        });
        vm.configList = response.plain().queryResult;
      });
    }

    // 配置项目过滤
    vm.appResourceFilter = function (config) {

      if (vm.filter.filterText) {

        var filterResult = config.configCode && config.configCode.toLowerCase().indexOf(vm.filter.filterText.toLowerCase()) != -1;
        filterResult = filterResult || (config.configValue && config.configValue.toLowerCase().indexOf(vm.filter.filterText.toLowerCase()) != -1);
        filterResult = filterResult || (config.configDesc && config.configDesc.toLowerCase().indexOf(vm.filter.filterText.toLowerCase()) != -1);
        filterResult = filterResult || (config.owner && config.owner.toLowerCase().indexOf(vm.filter.filterText.toLowerCase()) != -1);

        if (!filterResult)
          return false;
      }

      if (vm.filter.appResourceCode != 'all') {
        if (vm.filter.appResourceCode != config.appResourceId)
          return false;
      }

      return true;
    }

    //添加或编辑配置 
    vm.addOrEditConfig = function (config) {

      var editConfig = config ? angular.copy(config) : {
        configType: '1'
      };

      if (!editConfig.configType)
        editConfig.configType = '0';

      modalService.open({
        templateUrl: 'settings/modules/configuration/settingBasicConfig/basicConfig.modal.html',
        size: 'lg',
        data: {
          formData: editConfig,
          metaData: {
            appResourceList: vm.appResourceList,
            type: config ? "update" : "new"
          }
        },
        ok: function (editedConfigData) {

          // editedConfigData

          if (config) {
            // 更新
            return configRest.updateConfigItem(editedConfigData).then(function (response) {

              var index = vm.configList.indexOf(config);
              if (index != -1) {
                vm.configList.splice(index, 1, response.plain());
              }

              $scope.$emit('toast', {
                type: 'success',
                content: '更新配置成功'
              })
            });
          } else {
            // 添加
            return configRest.addConfigItem(editedConfigData).then(function (response) {

              vm.configList.unshift(response.plain());
              $scope.$emit('toast', {
                type: 'success',
                content: '添加配置成功'
              })
            });
          }
        },
        methodsObj: {
          addConfigListItem: function () {
            var that = this;
            if (!angular.isArray(that.formData.configRangeList))
              that.formData.configRangeList = [];
            that.formData.configRangeList.push({
              value: "新选项",
              description: ""
            });
          },
          deleteConfigListItem: function (index) {
            var that = this;
            that.formData.configRangeList.splice(index, 1);
          },
          setConfigValueInList: function (index) {
            var that = this;
            if (that.formData.configValue == that.formData.configRangeList[index].value)
              that.formData.configValue = "";
            else that.formData.configValue = that.formData.configRangeList[index].value;
          },
          setConfigValueAsDefault: function () {
            var that = this;
            that.formData.configDefaultValue = that.formData.configValue;
          }
        }
      })
    }

    // 删除配置
    vm.deleteConfig = function (config) {
      return configRest.deleteConfigItem(config.seqId).then(function () {

        var index = vm.configList.indexOf(config);
        vm.configList.splice(index, 1);

        $scope.$emit('toast', {
          type: 'success',
          content: '删除配置成功'
        })
      })
    }

    // 强制后台更新配置
    vm.forceServerConfigCacheRefresh = function () {
      configRest.refreshCache().then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '后台配置缓存更新成功'
        })
        vm.loadConfiguration.func();
      });
    }

    vm.configTypeConverter = function (typeCode) {
      if (typeCode == '0') {
        return "值";
      } else if (typeCode == '1') {
        return "序列";
      }

      return "—";
    }
  }
})();
