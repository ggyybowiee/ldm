(function() {
  "use strict";

  angular
    .module("lachesis-mnis")
    .controller("RiskMonitoringController", controller);

  /** @ngInject */
  function controller($scope, sessionService, mewsRest, mewsService) {
    var vm = this;
    vm.profile = sessionService.getProfile();
    vm.filter = {};
    vm.filter.queryDate = new Date();
    vm.filter.cate = 2;

    initViewModel();

    function initViewModel() {
      vm.ruleDic = mewsService.getMewsAlertLevelDic();
    }

    // 本地查看过滤
    var cateWatcher = $scope.$watch("vm.filter.cate", function(value) {
      buildShowMewsScoreData();
    });
    $scope.$on("$destroy", cateWatcher);

    function buildShowMewsScoreData() {
      vm.showScoreData = [];
      for (var i = 0; vm.scoreData && i < vm.scoreData.length; i++) {
        if (vm.scoreFilter(vm.scoreData[i]))
          vm.showScoreData.push(vm.scoreData[i]);
      }
    }

    // 加载患者MEWS预警记录
    vm.loadWardMewsAlert = {
      func: getMewsAlert,
      init: true
    };

    // 获取MEWS警报记录
    function getMewsAlert() {
      if (!vm.filter.queryDate) return;

      return mewsRest
        .getMewsAlertByWard({
          wardCode: vm.profile.wardCode,
          startTime: vm.filter.queryDate,
          endTime: vm.filter.queryDate
        })
        .then(function(queryResult) {
          vm.scoreData = queryResult.queryResult;

          for (var i = 0; i < vm.scoreData.length; i++) {
            vm.scoreData[i] = mewsService.processMewsScoreForViewModel(
              vm.scoreData[i]
            );
          }
          buildShowMewsScoreData();
        });
    }

    // 列表过滤器
    vm.scoreFilter = function(score) {
      if (vm.filter.cate == "0") return true;
      else if (vm.filter.cate == "1") return score.isProcessed;
      else if (vm.filter.cate == "2") return !score.isProcessed;

      return false;
    };

    // 风险处理按钮点击
    vm.riskButtonOnClick = function(score) {
      // vm.processWardMewsAlert.func(score, index, true, false);
      mewsRest
        .processMewsAlertById(score.id, true, false)
        .then(function(queryResult) {
          $scope.$emit("toast", {
            type: "success",
            content: "操作已成功！"
          });
          getMewsAlert();
        });
    };
  }
})();
