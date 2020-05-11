(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('MEWSConfigController', MEWSConfigController);


  // TODO:
  // 分值校验

  /** @ngInject */
  function MEWSConfigController($scope, sessionService, mnisSessionCache, modalService, mewsService, mewsRest, _) {

    // 自动注入服务数据声明
    var vm = this;
    var profile = sessionService.getProfile();
    var dicHelper = sessionService.getDicHelper();
    var wardCode = profile.wardCode;


    // 添加配置
    vm.addConfigButtonOnClick = function () {

      var availableVitalSignType = getAvaliableVitalSignType();

      modalService.open({
        templateUrl: "MNIS/modules/configuration/mewsConfig/addMewsConfig.modal.html",
        size: "md",
        data: {
          formData: availableVitalSignType
        },
        ok: function (formData, selectedItem) {

          vm.mewsConfig.mewsScorecard.push(newMewsConfig(selectedItem.dicCode));
          return true;
        }
      });
    }

    // 获取配置
    vm.loadMewsConfig = {
      func: getMewsConfigLoader
    }

    function getMewsConfigLoader() {

      return mewsRest.getMewsConfig({
        wardCode: wardCode
      }).then(function (queryResult) {

        if (queryResult == undefined) {

          $scope.$emit("toast", {
            type: "warning",
            content: "未找到该病区的配置，系统使用默认配置"
          });

          mewsRest.getMewsConfig({
            wardCode: ""
          }).then(function (defaultConig) {
            vm.mewsConfig = defaultConig;
            vm.mewsConfig.isCreate = true;
            mewsService.processMewsConfigForViewModel(vm.mewsConfig);
          });

        } else {
          vm.mewsConfig = queryResult;
          vm.mewsConfig.isCreate = false;
          mewsService.processMewsConfigForViewModel(vm.mewsConfig);
          console.log(vm.mewsConfig);
        }
      })
    }

    // 保存配置
    vm.saveMewsConfig = function () {

      var savingMewsConfig = mewsService.prepareMewsConfigForSave(vm.mewsConfig)
      if (!vm.mewsConfig.isCreate) {
        mewsRest.addMewsConfig(savingMewsConfig).then(function () {
          saveMewsConfigSucess();
        })
      } else {
        mewsRest.updateMewsConfig(savingMewsConfig).then(function () {
          saveMewsConfigSucess();
        })
      }
    }

    function saveMewsConfigSucess() {
      $scope.$emit("toast", {
        type: "success",
        content: "保存成功"
      });
      vm.loadMewsConfig.func();
    }

    // 获取可配置的体征列表
    function getAvaliableVitalSignType() {
      var result = [];
      for (var i = 0; i < dicHelper.dic["vitalItem"].length; i++) {
        var dicItem = dicHelper.dic["vitalItem"][i];
        if (!isVitalSignExsit(dicItem))
          result.push(dicItem);
      }

      return result;
    }

    function isVitalSignExsit(dicItem) {
      for (var i = 0; i < vm.mewsConfig.mewsScorecard.length; i++) {
        var mewsScore = vm.mewsConfig.mewsScorecard[i];
        if (mewsScore.scoreType == dicItem.dicCode)
          return true;
      }
      return false;
    }

    // 删除计分规则配置项
    vm.deleteScoreConfig = function (config) {
      vm.mewsConfig.mewsScorecard.splice(vm.mewsConfig.mewsScorecard.indexOf(config), 1);
      return true;
    }

    // 计分规则中分数的占位符显示方式
    vm.scoreRangeButtonStatus = function (score, config) {
      return (config.scoreRange[score] != undefined && config.scoreRange[score].length > 0);
    }

    vm.getVitalSignTypeName = function (typeCode) {
      if (vm.vitalSignTypeDic[typeCode])
        return vm.vitalSignTypeDic[typeCode].dicName;

      return "请在字典中配置[" + typeCode + "]类型";
    }

    // 添加配置分值域段
    vm.addRangeItemButtonOnClick = function (config, rangeKey) {
      if (config.scoreRange[rangeKey] == undefined) {
        config.scoreRange[rangeKey] = [""];
      } else {
        config.scoreRange[rangeKey].push("");
      }
    }

    // 初始化ViewModel
    initViewModel();

    function initViewModel() {

      // 初始化体征类型字典
      vm.vitalSignTypeDic = {};
      dicHelper.dic["vitalItem"]
      for (var i = 0; i < dicHelper.dic["vitalItem"].length; i++) {
        var dicItem = dicHelper.dic["vitalItem"][i];
        vm.vitalSignTypeDic[dicItem.dicCode] = dicItem;
      }

      // 验证器
      vm.metaData = {};

      // 其它基础配置
      vm.switchOptions = [{
        value: 'true',
        label: '打开'
      }, {
        value: 'false',
        label: '关闭'
      }];
      vm.scoreRangeDic = ["0", "1", "2", "3"];
      vm.ruleDic = mewsService.getMewsAlertLevelDic();
      vm.alertRuleCurIndex = -1;
      vm.senseItemDic = _.chain(dicHelper)
        .get(['dic', 'sense']).map(function (item) {
          return {
            id: item.dicCode,
            value: item.dicName
          };
        })
        .value();

      vm.loadMewsConfig.func();
    }

    // 报警规则区配置鼠标移入
    vm.alertRuleMouseEnter = function (index) {
      vm.alertRuleCurIndex = index;
    }

    // 报警规则区配置鼠标移出
    vm.alertRuleMouseLeave = function (index) {
      vm.alertRuleCurIndex = -1;
    }

    // 删除值域项
    vm.deleteRangeItemOnClick = function (scoreRange, index) {
      scoreRange.splice(index, 1);
    }

    // 删除关联条件
    vm.deleteRuleButtonOnClick = function (rule, index) {

      if (rule.linkedConditions.length == 1) {
        $scope.$emit("toast", {
          type: "warning",
          content: "每个级别至少需要一个关联条件存在！"
        });
        return;
      }
      rule.linkedConditions.splice(index, 1);
    }

    // 添加关联条件
    vm.addRuleButtonOnClick = function (rule) {
      rule.linkedConditions.push(newMewsLinkedCondition());
    }

    //生成新MEWS体征配置
    function newMewsConfig(vitalSignType) {
      return {
        scoreType: vitalSignType,
        scoreRange: {
          "0": [""],
          "1": [],
          "2": [],
          "3": []
        },
        inUse: true,
        deletable: true
      }
    }

    function newRule() {
      return [{
          alertLevel: 3,
          linkedConditions: [newMewsLinkedCondition(), newMewsLinkedCondition()],
          nursingAdvise: "",
          isUse: true
        },
        {
          alertLevel: 2,
          linkedConditions: [newMewsLinkedCondition()],
          nursingAdvise: "",
          isUse: true
        },
        {
          alertLevel: 1,
          linkedConditions: [newMewsLinkedCondition()],
          nursingAdvise: "",
          isUse: true
        }
      ]
    }

    function newMewsLinkedCondition() {
      return {
        // 0-单项,1-总分
        condition: 0,
        point: 3
      }
    }
  }
})();
