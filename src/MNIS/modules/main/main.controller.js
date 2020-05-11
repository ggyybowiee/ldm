(function() {
  "use strict";

  angular.module("lachesis-mnis").controller("MainController", MainController);

  /** @ngInject */
  function MainController(
    $scope,
    $location,
    mewsRest,
    $state,
    sessionService,
    mewsService,
    websocketService,
    _
  ) {
    var vm = this;
    var profile = sessionService.getProfile();
    vm.openOuter = false;
    vm.mewsRisks = [];
    vm.mewsRiskDic = {};
    $scope.noHeader = {};

    activate();

    function activate() {
      if ($location.$$search.openOuter) {
        vm.openOuter = true;
        $scope.noHeader = {
          "margin-top": "-50px"
        };
        $state.go("main.docs", $location.$$search);
      }
    }

    function onMessageReceivedFromWebSocket(event) {
      // console.log("Web Socket", event.data);
      var risk = angular.fromJson(event.data);
      if (
        risk.msgType == "mews_alert"
      ) {
        if (risk.alertWindowOn && risk.content.wardCode == profile.wardCode) {
          addAlert(risk.content);
        }
      } else if (risk.msgType == "mews_alert_cancel") {
        var alert = _.find(vm.mewsRisks, function (item) {
          return item.id === risk.id;
        })
        removeAlert(alert);
      }
      $scope.$apply();
    }

    // 启动Mews WebSocket监听
    startMewsListening();

    function startMewsListening() {
      var handlers = {
        onmessage: onMessageReceivedFromWebSocket
      };

      // var host = location.host;
      // var socket = new WebSocket('ws://' + host + '/windranger/websocket');
      var url = websocketService.parseWebsocketUrl({
        // ip: '10.2.3.140',
        // port: '86',
        path: "/windranger/websocket"
      });
      websocketService.createSocketScoped("MEWS报警", url, handlers, $scope);
    }

    // Mews警报处理
    vm.alertOnWait = function(alert) {
      mewsRest
        .processMewsAlertById(alert.id, false, alert.transferToDoc)
        .then(function() {
          $scope.$emit("toast", {
            type: "warning",
            content: "MEWS警报稍候提醒！"
          });

          removeAlert(alert);
        });
    };

    vm.alertOnProcess = function(alert) {
      mewsRest
        .processMewsAlertById(alert.id, true, alert.transferToDoc)
        .then(function() {
          $scope.$emit("toast", {
            type: "success",
            content: "MEWS警报处理成功！"
          });

          removeAlert(alert);
        });
    };

    function addAlert(alert) {
      alert.transferToDoc = false;
      // 如果vm.mewsRiskDic[alert.id] 存在，删除这条MEWS警报信息，再重新新增一条MEWS报警信息
      if (vm.mewsRiskDic[alert.id]) {
        var index = _.findIndex(vm.mewsRisks, function (item) {
          return item.id === alert.id;
        });
        vm.mewsRisks.splice(index, 1);
        delete vm.mewsRiskDic[alert.id];
      }
      vm.mewsRiskDic[alert.id] = alert;
      vm.mewsRisks.push(mewsService.processMewsScoreForViewModel(alert));
    }

    function removeAlert(alert) {
      if (!alert) return;
      var index = vm.mewsRisks.indexOf(alert);
      if (index > -1) {
        vm.mewsRisks.splice(index, 1);
        delete vm.mewsRiskDic[alert.id];
      }
    }

    // 获取警告框样式
    vm.getAlertPopupStyle = function(index) {
      index = vm.mewsRisks.length - index - 1;

      var style = {
        transform: "scale(" + (1 - 0.08 * index) + ")",
        position: "absolute",
        bottom: 30 * index + "px",
        "z-index": 10000 - index
      };

      if (index == 0) style.position = "relative";

      return style;
    };

    $scope.$on("$stateChangeSuccess", function(e, toState) {
      var fullList = [
        "main.nursingDocEdit",
        "main.docs",
        "main.batchInput",
        "main.orders",
        "main.nursingPathConfigSetting",
        "main.beds",
        "main.whiteboard"
      ];
      if (fullList.indexOf(toState.name) > -1) {
        $scope.fullPage = true;
      } else {
        $scope.fullPage = false;
      }
    });

    var isIframeLoaded;

    $scope.$on("showIdoc", function() {
      angular.element(".idoc-container").css("display", "flex");
    });

    $scope.$on("hideIdoc", function() {
      angular.element(".idoc-container").hide();
    });

    $scope.$on("idocInit", function() {
      // angular.element(".idoc-container").css("display", "flex");
      // console.log(isIframeLoaded);
      if (isIframeLoaded) {
        return;
      }
      try {
        angular.element(".idoc-container").remove();
        angular
        .element("#idoc-body")
        .append("<div class='idoc-container'></div>");
        window.sdk
          .init({
            url: 'DOC/viewer/index.html#/view-doc?' + new Date().getTime(),
            containerSelector: ".idoc-container"
          })
          .then(function() {
            isIframeLoaded = true;
          });
      } catch (err) {
        console.log(err);
      }
    });
  }
})();
