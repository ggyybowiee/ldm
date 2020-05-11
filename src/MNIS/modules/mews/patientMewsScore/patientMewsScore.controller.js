(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('PatientMewsScoreContorller', controller);


  /** @ngInject */
  function controller($scope, $filter, mewsRest, mewsService, chartsService, $timeout) {

    var vm = this;

    $scope.$watch('vm.filter.showType', function (val) {
      if (val === 1) {
        $timeout(function () {
          chartsService.refresh(vm.chart.identity, vm.chart.config);
        });
      }
    });

    vm.filter = {
      beginTime: null,
      endTime: new Date(),
      showType: 0
    };
    vm.scoreData = [];

    vm.chart = {
      identity: chartsService.getId(),
      dimension: '870:225',
      config: chartsService.lineInit()
    };


    // 患者信息变更
    vm.onPaitentChanged = function (newPatient) {
      vm.selectedInhosRecord = newPatient;
      vm.filter.beginTime = newPatient.inDate;
      vm.loadInhosPatMewsScore.func();
    }

    // 加载患者mews评分记录
    vm.loadInhosPatMewsScore = {
      func: getMewsScore
    }

    function getMewsScore() {

      return mewsRest.getMewsScoreByHid({
        startTime: vm.filter.beginTime,
        endTime: vm.filter.endTime,
        inhosCode: vm.selectedInhosRecord.inhosCode
      }).then(function (data) {

        vm.scoreData = data.queryResult;
        for (var i = 0; i < vm.scoreData.length; i++) {
          vm.scoreData[i] = mewsService.processMewsScoreForViewModel(vm.scoreData[i]);
        }

        $timeout(function () {
          drawPatientMewsEchart();
          chartsService.refresh(vm.chart.identity, vm.chart.config);
        });
      });
    }

    function drawPatientMewsEchart() {

      var showDataType = [{
        title: '总分',
        value: 'totalScore'
      }, {
        title: '体温',
        value: 'temperature'
      }, {
        title: '心率',
        value: 'heartRate'
      }, {
        title: '呼吸',
        value: 'breath'
      }, {
        title: '收缩压',
        value: 'bloodPress'
      }];

      var xAxisDate = [];
      var dataSet = [];
      for (var i = 0; i < vm.scoreData.length; i++) {

        var dateTime = vm.scoreData[i].createTime;
        var dateAsString = $filter('date')(dateTime, "MM-dd HH:mm");
        xAxisDate.push(dateAsString);
      }

      var lengendArray = [];
      var lengendShow = {};
      for (i = 0; i < showDataType.length; i++) {
        var rowData = {
          name: showDataType[i].title,
          type: "line",
          smooth: true,
          symbol: 'circle',
          symbolSize: '10',
          sampling: 'average',
          connetNulls: true,
          showAllSymbol: true,
          data: []
        };

        // Lengend
        lengendArray.push(showDataType[i].title);
        var valuePath = showDataType[i].value;
        if (valuePath == "totalScore")
          lengendShow[showDataType[i].title] = true;
        else lengendShow[showDataType[i].title] = false;

        // 值处理
        for (var j = 0; j < vm.scoreData.length; j++) {
          if (valuePath == "totalScore")
            rowData.data.push(vm.scoreData[j][valuePath]);
          else if (vm.scoreData[j][valuePath]) {
            rowData.data.push(vm.scoreData[j][valuePath].score);
          } else {
            rowData.data.push(0);
          }
        }
        dataSet.push(rowData);
      }

      vm.chart.config = {
        title: {
          left: 'left',
          text: 'MEWS评分曲线'
        },
        tooltip: {},
        legend: {
          data: lengendArray,
          selected: lengendShow
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxisDate
        },
        yAxis: {
          min: -2,
          max: 16,
          interval: 2,
          type: 'value'
        },
        dataZoom: [{}, {
          type: 'inside'
        }],
        series: dataSet
      };
    }

    initViewModel();

    function initViewModel() {
      vm.ruleDic = mewsService.getMewsAlertLevelDic();
    }
  }

})();
