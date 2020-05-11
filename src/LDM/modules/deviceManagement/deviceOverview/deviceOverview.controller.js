(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('LDMDeviceOverviewController', LDMDeviceOverviewController);

  /** @ngInject */
  function LDMDeviceOverviewController(
    $scope,
    modalService,
    $interval,
    monitoringService,
    deviceInfoService,
    hospitalRest,
    $q,
    $window,
    $filter,
    moment,
    _
  ) {
    var vm = this;

    vm.size = {};
    vm.date = new Date();
    vm.load = {
      init: true,
      func: init
    };
    vm.codes = [];
    vm.errorInfos = [];
    vm.onlineInfos = [];
    vm.types = [];
    //饼图颜色
    vm.devicesColor = [
      '#5aaddc',
      '#b07bd5',
      '#5bc9ca',
      '#b3cf5c',
      '#846cca',
      '#6579e1'
    ];
    vm.onlineStatusColor = ['#b0cbdb', '#5aaddc'];
    vm.runningStatusColor = ['#5aaddc', '#f8bb37', '#f74d81'];
    //饼图模板
    vm.pieTemplate = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#000000',
        formatter: '{a} {b}: {c} ({d}%)',
        textStyle: {
          color: '#ffffff',
          fontSize: 16
        },
        extraCssText: 'height: 36px;padding-left: 15px;padding-right: 15px;border-radius: 36px;opacity: 0.6;'
      },
      legend: {
        orient: 'horizontal',
        x: 'center',
        y: 'bottom',
        itemWidth: 24,
        itemHeight: 10,
        data: []
      },
      series: [
        {
          name: '',
          type: 'pie',
          center: ['50%', '40%'],
          radius: ['30%', '70%'],
          hoverOffset: 20,
          avoidLabelOverlap: false,
          label: {
            normal: {
              show: false,
              position: 'center'
            },
            emphasis: {
              show: true,
              width: 60,
              textStyle: {
                fontSize: 20,
                color: '#3f78bf'
              }
            }
          },
          labelLine: {
            normal: {
              show: true,
              position: 'center'
            }
          },
          itemStyle: {
            normal: {
              // show: true,
              // shadowBlur: 5
            }
          },
          data: []
        }
      ]
    };
    //饼状图源数据,对应所有数据，在线状态，运行状态
    vm.pieOption = {};
    angular.copy(vm.pieTemplate, vm.pieOption);
    vm.onlineStatistic = {};
    angular.copy(vm.pieTemplate, vm.onlineStatistic);
    vm.errorStatistic = {};
    angular.copy(vm.pieTemplate, vm.errorStatistic);

    //线形图模板
    vm.lineTemplate = {
      title: {
        show: 'false',
        top: 0
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: [
            '60',
            '55',
            '50',
            '45',
            '40',
            '35',
            '30',
            '25',
            '20',
            '15',
            '10',
            '5',
            '0'
          ]
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: '蓝桥实时数据量',
          type: 'line',
          stack: '总量',
          smooth: true,
          itemStyle: {
            normal: {
              color: '#89acd7'
            }
          },
          lineStyle: {
            normal: {
              color: '#89acd7'
            }
          },
          areaStyle: {
            normal: {
              color: '#89acd7'
            }
          },
          data: []
        }
      ]
    };

    vm.isDeviceAvaiable = isDeviceAvaiable;
    vm.clickDevice = clickDevice;
    vm.devices = [
      {
        type: '',
        name: ''
      }
    ];
    vm.queryParams = {
      startTime: vm.date,
      endTime: vm.date
    };

    vm.queryDevices = [1004, 1005, 1001, 1002, 1003, -1];
    vm.deviceNames = ['蓝桥', '输液监测器', 'NDA', '医生推车', '护士推车'];
    //初始化时调用
    getDeviceTypes();
    getCode().then(init);

    getBlueBridgeThroughput();

    function init() {
      getDeviceCount(vm.queryDevices);
      getOnlineCount(vm.queryDevices);
      getErrorCount(vm.queryDevices);
      getBlueBridgeOnlineCount(1004);
    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType().then(function(response) {
        //获取可以统计的设备类型。目前没有医生推车和护士推车的code，所以通过名字匹配得到设备code。
        vm.types.length = 0;
        //获取界面显示的设备名对应的设备类型code
        response.map(function(item) {
          if (vm.deviceNames.indexOf(item.name) !== -1) {
            vm.types.push({ name: item.name, code: item.code });
          }
        });
        //-1表示其他设备
        vm.types.push({ name: '其他设备', code: -1 });
        vm.queryTypes = angular.copy(vm.types);
      });
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function(response) {
        vm.codes = response;
        vm.onlineInfos = _.filter(vm.codes, { type: 'onlineStatus' });
        vm.errorInfos = _.filter(vm.codes, { type: 'errorLevel' });
      });
    }

    function setOption(codes, count, targetOption, name, color) {
      var types = codes.slice();
      if (types.length === 0) {
        types.push({
          code: -999,
          name: '暂无设备'
        });
      }
      targetOption.legend.data = types.map(function(item) {
        return item.name;
      });
      var data = [];
      //通过映射getCode和getOnlineCount中得到数据的状态码，提取出对应的name和value，赋给图像。
      types.forEach(function(item) {
        //newData = {name: "", value: };
        var newData = {};
        newData.name = item.name;
        if ($filter('filter')(count, { code: item.code }).length > 0) {
          newData.value = $filter('filter')(count, {
            code: item.code
          })[0].count;
        } else {
          newData.value = 0;
        }
        data.push(newData);
      });
      targetOption.series[0].data = data;
      targetOption.series[0].name = name;
      targetOption.color = types[0].code === -999 ? ['#999'] : color;
      return targetOption;
    }

    function getDeviceCount(params) {
      //获取设备数量统计信息，并通过setOption()传入饼图。
      return deviceInfoService
        .getDeviceCount({ deviceType: params })
        .then(function(response) {
          vm.deviceCount = response;
          vm.pieTemplate.color = vm.devicesColor;
          setOption(
            vm.queryTypes,
            vm.deviceCount,
            vm.pieOption,
            '设备数量统计',
            vm.devicesColor
          );
          vm.deviceCountNumber = response.reduce(getSum, 0);
        });
    }

    function getOnlineCount(params) {
      //获取设备在线状态信息，并通过setOption()传入饼图。
      return deviceInfoService
        .getOnlineCount({ deviceType: params })
        .then(function(response) {
          vm.onlineCount = response;
          setOption(
            vm.onlineInfos,
            vm.onlineCount,
            vm.onlineStatistic,
            '在线状态统计',
            vm.onlineStatusColor
          );
        });
    }

    function getBlueBridgeOnlineCount(blueBridge) {
      //获取设备蓝桥设备在、离线信息。
      return deviceInfoService
        .getOnlineCount({ deviceType: blueBridge })
        .then(function(response) {
          vm.blueBridgeOnlineCount = response;
          vm.blueBridgeOnlineCount.online = $filter('filter')(response, {
            code: '1'
          })[0]
            ? $filter('filter')(response, { code: '1' })[0].count
            : 0;
          vm.blueBridgeOnlineCount.offline = $filter('filter')(response, {
            code: '0'
          })[0]
            ? $filter('filter')(response, { code: '0' })[0].count
            : 0;
        });
    }

    function getErrorCount(params) {
      //获取设备异常状态信息，并通过setOption()传入饼图。
      return deviceInfoService
        .getOperationCount({ deviceType: params })
        .then(function(response) {
          vm.errorCount = response;
          setOption(
            vm.errorInfos,
            vm.errorCount,
            vm.errorStatistic,
            '运行状态统计',
            vm.runningStatusColor
          );
        });
    }

    function getBlueBridgeThroughput() {
      //查询最近一分钟蓝桥数据量，不传参.每5秒查询一次
      getThroughput();
      vm.interval_bBThroughput = $interval(function() {
        getThroughput();
      }, 5000);
    }

    function getThroughput() {
      return deviceInfoService
        .getBlueBridgeThroughtput()
        .then(function(response) {
          vm.blueBridgeThroughput = response.map(function(item) {
            return item.value;
          });
          vm.lineTemplate.series[0].data = vm.blueBridgeThroughput;
        });
    }
    function isDeviceAvaiable(deviceName) {
      if (vm.types && $filter('filter')(vm.types, { name: deviceName }).length !== 0)
        return true;
      else return false;
    }

    function clickDevice(deviceName) {
      var code = $filter('filter')(vm.types, { name: deviceName })[0].code;
      if (vm.queryDevices.indexOf(code) === -1) {
        vm.queryDevices.push(code);
        vm.queryTypes.push($filter('filter')(vm.types, { name: deviceName })[0]);
      } else {
        vm.queryDevices.splice(vm.queryDevices.indexOf(code), 1);
        vm.queryTypes.splice(vm.queryTypes.indexOf($filter('filter')(vm.queryTypes, { name: deviceName })[0]), 1);
      }
      init();
    }

    function getSum(total, num) {
      return total + num.count;
    }

    //窗口关闭时，中断定时器interval功能。
    $scope.$on('$destroy', function() {
      $interval.cancel(vm.interval_bBThroughput);
    });

    // $scope.$watch($window.width(),function(newValue, oldValue){
    //   alert();
    // })
    // angular.element($window).bind('resize', onResize);

    // function onResize() {
    //  var panelWidth = angular.element('#deviceOverview').width();
    //  var lineChart = angular.element('#LineChart').width();
    //   if(panelWidth > 1600){
    //     lineChart.offsetWidth=800;
    //   }else if(panelWidth < 1000){
    //     lineChart.offsetWidth=560;
    //   } else {
    //     lineChart.offsetWidth= (panelWidth/2);
    //   }
    //   $scope.$digest();
    // }

    $scope.$on('$destory', function() {
      $window.off('resize');
    });
  }
})();
