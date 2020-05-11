(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("LDMDeviceMonitoringController", LDMDeviceMonitoringController);

  /** @ngInject */
  function LDMDeviceMonitoringController(
    $scope,
    $rootScope,
    modalService,
    $interval,
    monitoringService,
    deviceInfoService,
    hospitalRest,
    sysRest,
    $q,
    $filter,
    $window,
    moment,
    $location,
    _
  ) {
    var vm = this;

    vm.today = new Date();
    vm.todayFormat = $filter("date")(new Date(), "yyyy-MM-dd");
    vm.openDetail = openDetail;
    vm.load = {
      init: true,
      func: init
    };
    vm.codes = [];
    vm.queryParams = {
      onlineStatus: "",
      errorLevel: "",
      eqpType: "",
      key: "",
      eqpBelong: ""
    };

    //线形图模板
    vm.lineTemplate = {
      title: {
        text: "全天电量变化"
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          animation: false,
          label: {
            backgroundColor: "#6a7985"
          }
        }
      },
      axisLine: {
        lineStyle: {
          color: "#3f78bf"
        }
      },
      xAxis: {
        type: "time",
        // type: "category",
        // boundaryGap : false,
        // data:['00:00','06:00','12:00','18:00','23:59'],
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: "value",
        splitLine: {
          show: false
        },
        data: ["0", "20", "40", "60", "80", "100"],
        color: "#3f78bf",
        axisLabel: {
          show: true,
          interval: "auto",
          formatter: "{value}%"
        }
      },
      series: [
        {
          name: "设备电量",
          type: "line",
          showSymbol: false,
          hoverAnimation: false,
          smooth: true,
          itemStyle: {normal: {
            color: '#89acd7'
          }},
          lineStyle: {normal: {
            color: '#89acd7'
          }},
          data: []
        },
        {
          name: "设备电量",
          type: "line",
          showSymbol: false,
          data: [
            { value: [vm.todayFormat + " 00:00:00", 0] },
            { value: [vm.todayFormat + " 23:59:59", 0] }
          ],
          itemStyle: { normal: { opacity: 0, color: '#89acd7' } },
          lineStyle: { normal: { opacity: 0, color: '#89acd7' } }
        }
      ]
    };

    function init() {
      return getMonitors(vm.queryParams).then(function(response) {
        vm.statuses = response;
      });
    }

    getCode();
    getDeviceTypes();
    getDeviceBelong();

    function getCode() {
      return deviceInfoService.getCodes().then(function(response) {
        vm.codes = response;
        vm.connectInfos = _.filter(vm.codes, { type: "onlineStatus" });
        vm.errorInfos = _.filter(vm.codes, { type: "errorLevel" });
        vm.batteryInfos = _.filter(vm.codes, { type: "batteryStatus" });
      });
    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.types = response;
      });
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function getMonitors() {
      return monitoringService.getStatus("brief", vm.queryParams);
    }

    function openDetail(row) {
      var params = {
        eqpSn: row.basicInfo.sn,
        eqpMac: row.basicInfo.mac
      };

      var historyParams = {
        eqpSn: row.basicInfo.sn,
        eqpMac: row.basicInfo.mac,
        startTime: vm.todayFormat,
        endTime: vm.todayFormat
      };

      modalService.open({
        templateUrl:
          "LDM/modules/deviceManagement/deviceMonitoring/detail.modal.html",
        size: "lg",
        data: {
          metaData: {
            belongs: vm.belongs,
            types: vm.types,
            codes: vm.codes,
            lineTemplate: vm.lineTemplate
          }
        },
        initFn: function() {
          var that = this;
          that.metaData.deviceInfo = row;
          that.metaData.isGetLog = false;
          var network = monitoringService.getStatus("online", params);
          var record = monitoringService.getStatus("operation", params);
          var logInfo = monitoringService.getLogInfo(params);
          var errorInfo = monitoringService.getStatus("error", params);
          var locationInfo = monitoringService.getStatus("location", params);
          var batteryInfo = monitoringService.getStatus("battery", params);
          var recordDetail = monitoringService.getStatus(
            "operation/history",
            params
          );
          var batteryInfoDetail = monitoringService.getStatus(
            "battery/history",
            historyParams
          );
          that.metaData.selectedDate = new Date();
          that.metaData.selectedDateFormat = vm.todayFormat;
          that.oldDate = new Date();
          // TODO:测试数据
          // that.currentDate = moment().format("YYYY-MM-DD");
          // that.onlineTime = (
          //   (new Date().getTime() -
          //     new Date(that.currentDate + " 08:38:00").getTime()) /
          //   (1000 * 60 * 60)
          // ).toFixed(1);

          $q
            .all([
              network,
              record,
              logInfo,
              errorInfo,
              locationInfo,
              batteryInfo,
              recordDetail,
              batteryInfoDetail
            ])
            .then(function(response) {
              that.metaData.network = response[0];
              that.metaData.record = response[1];
              that.metaData.logInfo = response[2];
              that.metaData.errorInfo = response[3];
              that.metaData.locationInfo = response[4];
              that.metaData.batteryInfo = response[5];
              that.metaData.recordDetail = response[6];
              // that.metaData.lineTemplate.series[0].data = response[7];
              that.metaData.lineTemplate.series[0].data = convertHistoryForm(
                response[7],
                vm.todayFormat
              );
              //that.metaData.lineTemplate.series[0].data = response[7];
            });
        },
        methodsObj: {
          downloadLogFile: function(url) {
            window.open("windranger/ldm/logs?URL=" + url, url);
          },
           downloadFile: function(id) {
            if(id){
              var uri = URI('/windranger/sys/sysAttachment/' + id + '/file');
              return uri.toString();
            }
          },
          getLog: function(){
            var that = this;
            monitoringService.getLog({eqpMac: that.metaData.deviceInfo.basicInfo.mac}).then(function(res){
              that.metaData.isGetLog = true;
            })
          },
          selectDate: function(num) {
            var that = this;
            that.oldDate = that.metaData.selectedDate;
            if (num > 0) {
              if (moment(that.metaData.selectedDateFormat).isBefore(vm.todayFormat)) {
                that.oldDate.setTime(that.oldDate.getTime() + 24 * 60 * 60 * 1000);
                that.metaData.selectedDate = that.oldDate;
                that.metaData.selectedDateFormat = $filter("date")(
                  that.oldDate,
                  "yyyy-MM-dd"
                );
                historyParams.startTime = that.metaData.selectedDateFormat;
                historyParams.endTime = that.metaData.selectedDateFormat;
                that.metaData.lineTemplate.series[1].data = [
                  { value: [that.metaData.selectedDateFormat + " 00:00:00", 0] },
                  { value: [that.metaData.selectedDateFormat + " 23:59:59", 0] }
                ];
                monitoringService
                  .getStatus("battery/history", historyParams)
                  .then(function(res) {
                    var data = convertHistoryForm(
                      res,
                      that.metaData.selectedDateFormat
                    );
                    that.metaData.lineTemplate.series[0].data = data;
                  });
              } else {
                // vm.tooltip = "已是最后一天";
              }
            } else if (num < 0) {
              that.oldDate.setTime(that.oldDate.getTime() - 24 * 60 * 60 * 1000);
              that.metaData.selectedDate = that.oldDate;
              that.metaData.selectedDateFormat = $filter("date")(
                that.oldDate,
                "yyyy-MM-dd"
              );
              historyParams.startTime = that.metaData.selectedDateFormat;
              historyParams.endTime = that.metaData.selectedDateFormat;
              that.metaData.lineTemplate.series[1].data = [
                { value: [that.metaData.selectedDateFormat + " 00:00:00", 0] },
                { value: [that.metaData.selectedDateFormat + " 23:59:59", 0] }
              ];
              monitoringService
                .getStatus("battery/history", historyParams)
                .then(function(res) {
                  var data = convertHistoryForm(
                    res,
                    that.metaData.selectedDateFormat
                  );
                  that.metaData.lineTemplate.series[0].data = data;
                });
            }
          }
        }
      });
    }

    function convertHistoryForm(oldHistory, date) {
      var history = [];
      if (angular.isArray(oldHistory) && oldHistory.length > 0) {
        for (var i = 0; i < oldHistory.length; i++) {
          var value = { value: [] };
          value.value.push(
            $filter("date")(oldHistory[i].sendTime, "yyyy/MM/dd HH:mm:ss")
          );
          value.value.push(oldHistory[i].content.residualCapacity);
          history.push(value);
        }
        //历史记录里最后一条记录的时间经常会与当前时间有间隔，取服务器当前时间点和记录里最后一条记录的电量组成一条数据添加到记录中。记录会显示到当前时间。
        if(moment(date).isSame(vm.todayFormat)){
          var serverTime = new Date();
          sysRest.getServerTime().then(function(response) {
            serverTime = response;
            history.push({
              value: [$filter("date")(serverTime, "yyyy/MM/dd HH:mm:ss"), history[history.length - 1].value[1]]
            });
          });
        }
      }
      return history;
    }
  }
})();
