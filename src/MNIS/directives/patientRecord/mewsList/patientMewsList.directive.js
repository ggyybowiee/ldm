(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("patientMewsList", patientMewsList);

  /** @ngInject */
  function patientMewsList() {
    var directive = {
      restrict: "E",
      scope: {
        patientInfo: "="
      },
      templateUrl: "MNIS/directives/patientRecord/mewsList/patientMewsList.tpl.html",
      controller: function (
        $scope,
        $filter,
        $compile,
        moment,
        mewsRest,
        mewsService,
        sessionService,
        chartsService,
        $timeout,
        websocketService,
        $interval,
        _
      ) {
        var vm = this;
        var profile = sessionService.getProfile();

        // 初始化视图
        initViewModel();

        // 获取患者MEWS评分
        function getMewsScore() {
          if (!vm.filter.beginTime || !vm.filter.endTime) return;

          return mewsRest
            .getMewsScoreByHid({
              startTime: moment(vm.filter.beginTime).format("YYYY-MM-DD"),
              endTime: moment(vm.filter.endTime).format("YYYY-MM-DD"),
              inhosCode: $scope.patientInfo.inhosCode
            })
            .then(function (data) {
              vm.scoreData = data.queryResult;
              for (var i = 0; i < vm.scoreData.length; i++) {
                vm.scoreData[i] = mewsService.processMewsScoreForViewModel(
                  vm.scoreData[i]
                );
              }

              $timeout(function () {
                drawPatientMewsEchart();
                chartsService.refresh(vm.chart.identity, vm.chart.config);
              });
            });
        }

        // 汇制图表
        function drawPatientMewsEchart() {
          var showDataType = [{
              title: "总分",
              value: "totalScore"
            },
            {
              title: "体温",
              value: "temperature"
            },
            {
              title: "心率",
              value: "heartRate"
            },
            {
              title: "呼吸",
              value: "breath"
            },
            {
              title: "收缩压",
              value: "bloodPress"
            },
            {
              title: "意识",
              value: "sense"
            }
          ];

          var xAxisDate = [];
          var dataSet = [];

          _.forEachRight(vm.scoreData, function (scoreDataItem) {
            var dateTime = scoreDataItem.createTime;
            var dateAsString = $filter("date")(dateTime, "MM-dd HH:mm");
            xAxisDate.push(dateAsString);
          });

          var lengendArray = [];
          var lengendShow = {};

          // 值处理
          var max = 4;
          for (var i = 0; i < showDataType.length; i++) {
            var rowData = {
              name: showDataType[i].title,
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: "10",
              sampling: "average",
              connetNulls: true,
              showAllSymbol: true,
              data: [],
              vitalValueData: [],
              cursor: 'pointer',
              zlevel: 100 - i
            };

            // Lengend
            lengendArray.push(showDataType[i].title);
            var valuePath = showDataType[i].value;
            lengendShow[showDataType[i].title] = true;

            _.forEachRight(vm.scoreData, function (scoreDataItem) {

              var valueNode = 0;
              var vitalSignValueNode = "—";
              if (valuePath == "totalScore")
                valueNode = scoreDataItem[valuePath];
              else if (scoreDataItem[valuePath]) {
                valueNode = scoreDataItem[valuePath].score;
                vitalSignValueNode = scoreDataItem[valuePath].value;
              } else {
                valueNode = null;
              }
              max = Math.max(max, valueNode);
              rowData.data.push(valueNode);
              rowData.vitalValueData.push(vitalSignValueNode);
            });

            dataSet.push(rowData);
          }

          // MAX设置为离当前最大值最近的偶数
          do {
            max++;
          } while (max % 2 != 0);

          var defaultSeriesColor = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'];

          vm.chart.config = {
            title: {
              left: "left",
              text: "MEWS评分曲线"
            },
            tooltip: {
              formatter: function (params, ticket, callback) {

                var totalScore = _.get(dataSet, [0, 'data', _.get(params, [0, 'dataIndex'])]);
                totalScore = (totalScore == undefined) ? "—" : totalScore;

                var tooltipHTML = '<div class="mews-chart-tooptip-panel">';
                tooltipHTML += ' <div class="mews-chart-tooptip-header">' + '<span>MEWS</span>';
                tooltipHTML += '<span><b>' + totalScore + '</b>&nbsp;分</span>'
                tooltipHTML += '</div>' + ' <div class="mews-chart-tooptip-content">' + '<ul>'


                _.forEach(dataSet, function (set, index) {

                  if (index != 0) {
                    var score = _.get(set.data, _.get(params, [0, 'dataIndex']));
                    score = (score == undefined) ? "—" : score;

                    var vitalValue = _.get(set.vitalValueData, _.get(params, [0, 'dataIndex'])) || '-';
                    var itemHTML = '<li>' +
                      '<div>' +
                      '<span><span style="color:' + defaultSeriesColor[index % defaultSeriesColor.length] + '">●</span>&nbsp;&nbsp;' + set.name + '：' + vitalValue + '</span>' +
                      '<span><b>' + score + '</b>&nbsp;分</span>' +
                      '</div>' +
                      '</li>';

                    tooltipHTML += itemHTML;
                  }
                })
                tooltipHTML += '</ul>' + '</div>' + '</div>'


                return tooltipHTML;
              },
              backgroundColor: "transparent"
            },
            legend: {
              data: lengendArray,
              selected: lengendShow
            },
            xAxis: {
              type: "category",
              boundaryGap: false,
              data: xAxisDate
            },
            yAxis: {
              min: -2,
              max: max,
              interval: 2,
              type: "value"
            },
            dataZoom: [{},
              {
                type: "inside"
              }
            ],
            series: dataSet,
            color: defaultSeriesColor
          };
        }

        // 初始化视图
        function initViewModel() {
          vm.loadMewsScore = {
            func: getMewsScore
          };

          vm.ruleDic = mewsService.getMewsAlertLevelDic();

          vm.filter = {
            beginTime: null,
            endTime: new Date(),
            showType: 0
          };
          vm.scoreData = [];

          vm.chart = {
            identity: chartsService.getId(),
            dimension: "870:225",
            config: chartsService.lineInit()
          };

          var showTypeWathcer = $scope.$watch("vm.filter.showType", function (
            val
          ) {
            if (val === 1) {
              $timeout(function () {
                chartsService.refresh(vm.chart.identity, vm.chart.config);
              });
            }
          });
          $scope.$on("$destroy", showTypeWathcer);

          // 患者监听器
          var patientWatcher = $scope.$watch("patientInfo", function (value) {
            if (value) {
              $timeout(function () {
                vm.filter.beginTime = value.inDate;
                vm.loadMewsScore.func();
              });
            }
          });
          $scope.$on("$destroy", patientWatcher);

          // 启动Mews WebSocket监听
          startMewsListening();

          // 业页时间更新计时器
          vm.now = new Date();
          var timer = $interval(function () {
            vm.now = new Date();
          }, 1000);
          $scope.$on("destroy", function () {
            $interval.cancel(timer);
          });

          // MEWS实时分数记录
          vm.realTimeMewsScore = {
            mews: {
              vitals: {},
              totalScore: {}
            },
            source: {}
          };

          // initRealTimeSocre
          var lastMewsRecordList = _.get($scope.patientInfo, [
            "mewsRecord",
            "vitals"
          ]);
          _.forEach(lastMewsRecordList, function (vitalSignNewNode) {
            mewsService.processVitalSignNodeForViewModel(vitalSignNewNode);
          });
          updateRealtimeMewsScoreByVitals(lastMewsRecordList);
        }

        function onMessageReceivedFromWebSocket(event) {
          try {
            var eventData = angular.fromJson(event.data);
            if (eventData.msgType == "realVital") {
              var vitalSignNewNodeList = eventData.content;
              _.forEach(vitalSignNewNodeList, function (vitalSignNewNode) {
                mewsService.processVitalSignNodeForViewModel(vitalSignNewNode);
              });
              vitalSignNewNodeList = updateRealtimeMewsScoreByVitals(
                vitalSignNewNodeList,
                eventData.source
              );

              setRealTimeNodeValue(
                vm.realTimeMewsScore.source,
                [eventData.source],
                vitalSignNewNodeList
              );
            }
            $scope.$apply();
          } catch (error) {
            console.log(error);
            console.log(event.data);
          }
        }

        function updateRealtimeMewsScoreByVitals(vitalsList, source) {
          var vitalSignNewNode = {};
          _.forEach(vitalsList, function (vitalItem) {
            vitalSignNewNode[vitalItem.vitalSign] = vitalItem;
            if (
              !vm.realTimeMewsScore.mews.vitals[vitalItem.vitalSign] ||
              (vm.realTimeMewsScore.mews.vitals[vitalItem.vitalSign].newValue &&
                new Date(
                  vm.realTimeMewsScore.mews.vitals[
                    vitalItem.vitalSign
                  ].newValue.recordDate
                ) <= new Date(vitalItem.recordDate))
            ) {
              var realValue = angular.copy(vitalItem);
              realValue.source = source;

              setRealTimeNodeValue(
                vm.realTimeMewsScore.mews.vitals,
                [vitalItem.vitalSign],
                realValue
              );
              updateRealtimeMewsScore();
            }
          });

          return vitalSignNewNode;
        }

        function updateRealtimeMewsScore() {
          var totalScore = 0;
          var singleVitalSign = [];
          _.forEach(vm.realTimeMewsScore.mews.vitals, function (item) {
            totalScore += item.newValue.score;
            singleVitalSign.push({
              vitalSign: item.newValue.vitalSign,
              score: item.newValue.alertLevel
            });
          });

          if (
            _.get(vm.realTimeMewsScore.mews, ["totalScore", "newValue"]) !=
            totalScore
          ) {
            setRealTimeNodeValue(
              vm.realTimeMewsScore.mews,
              ["totalScore"],
              totalScore
            );

            mewsRest
              .getMewsAlertLevel(singleVitalSign, profile.wardCode)
              .then(function (result) {
                vm.realTimeMewsScore.mews.totalScoreAlertLevel = result;
              });
          }
        }

        function setRealTimeNodeValue(node, path, newValue) {
          var oldPath = angular.copy(path);
          oldPath.push("oldValue");
          var newPath = angular.copy(path);
          newPath.push("newValue");

          _.set(node, oldPath, _.get(node, newPath));
          _.set(node, newPath, newValue);
        }

        function onSocketConnected() {
          var initData = {
            msgType: "realVital",
            args: {
              inhosCode: $scope.patientInfo.inhosCode
            }
          };
          vm.realtimeMewsSocketScope.__socket.send(angular.toJson(initData));
        }

        function startMewsListening() {
          var handlers = {
            onmessage: onMessageReceivedFromWebSocket,
            onopen: onSocketConnected
          };

          // var host = location.host;
          // var socket = new WebSocket('ws://' + host + '/windranger/websocket');
          var url = websocketService.parseWebsocketUrl({
            // ip: "10.2.3.179",
            // port: "9003",
            path: "/windranger/websocket"
          });
          vm.realtimeMewsSocketScope = websocketService.createSocketScoped(
            "实时MEWS评分",
            url,
            handlers,
            $scope
          );
        }
      },
      controllerAs: "vm"
    };

    return directive;
  }
})();
