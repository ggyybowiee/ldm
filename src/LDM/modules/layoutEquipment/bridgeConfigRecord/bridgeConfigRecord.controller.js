(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BridgeConfigRecordController", BridgeConfigRecordController);

  /** @ngInject */
  function BridgeConfigRecordController(
    $rootScope,
    $scope,
    $state,
    deviceInfoService,
    sessionService,
    modalService,
    $filter,
    hospitalRest,
    _
  ) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();

    vm.dic = dicHelper.dic;
    vm.sendType = vm.dic.ldmSendType;
    vm.openDetail = openDetail;
    vm.getRecords = getRecords;
    vm.search = search;
    vm.queryText = "";
    vm.queryParams = {
      content: "",
      deviceType: 2,
      beginTime: "",
      endTime: "",
      page: 1,
      offset: 10
    };
    vm.wlanBands = [
      {
        code: "0",
        value: "自动切换"
      },
      {
        code: "1",
        value: "5G"
      },
      {
        code: "2",
        value: "2.4G"
      }
    ];

    vm.encryptTypes = [
      {
        code: "0",
        value: "不加密"
      },
      {
        code: "2",
        value: "WAP/WAP2-PSK"
      },
      {
        code: "1",
        value: "WEP"
      },
      {
        code: "3",
        value: "802.1xEAP"
      }
    ];

    function getRecords(tableState, StTableController) {
      vm.tableController = StTableController;
      var tableInnerState = StTableController.tableState();
      vm.queryParams.page = tableInnerState.pagination.start
        ? tableInnerState.pagination.start / tableInnerState.pagination.number +
          1
        : 1;

      return deviceInfoService
        .getDeviceSendRecords()
        .customGET("", vm.queryParams)
        .then(function(res) {
          vm.data = res.datas.map(function(item) {
            item.contentObject = angular.fromJson(item.contentString);
            return item;
          });
          vm.dataCopy = vm.data;
          var pageCount = Math.ceil(res.totalCount / vm.queryParams.offset);
          tableInnerState.pagination.numberOfPages = pageCount;
          tableInnerState.pagination.totalItemCount = res.totalCount;
        });
    }

    getDeviceBelong();
    function getDeviceBelong() {
      //获取所有科室名称
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }
    function getReceiveRecord(item) {
      return deviceInfoService
        .getDeviceReceiveRecord(item.id)
        .then(function(response) {});
    }

    function search() {
      getRecords(null, vm.tableController);
    }

    function openDetail(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/layoutEquipment/bridgeConfigRecord/recordDetail.modal.html",
        size: "lg",
        data: {
          formData: angular.merge({}, item),
          metaData: {
            currentRecord: "",
            wlanBands: [
              {
                code: "0",
                value: "自动切换"
              },
              {
                code: "1",
                value: "5G"
              },
              {
                code: "2",
                value: "2.4G"
              }
            ],
            encryptTypes: [
              {
                code: "0",
                value: "不加密"
              },
              {
                code: "2",
                value: "WAP/WAP2-PSK"
              },
              {
                code: "1",
                value: "WEP"
              },
              {
                code: "3",
                value: "802.1xEAP"
              }
            ]
          }
        },
        methodsObj: {
          getTrueOrFalse: function (value) {
            if (angular.isString(value)) {
              return '是';
            }

            if (_.isBoolean(value)) {
              if (value) {
                return '是'
              } else {
                return '否';
              }
            }

            if (_.isPlainObject(value)) {
              return '是';
            }

            if(angular.isNumber(value)){
              if(value === 1){
                return '是';
              }else{
                return '否';
              }
            }

            return '否';
          }
        },
        initFn: function() {
          var that = this;
          that.belongs = vm.belongs;
          that.encryptType = vm.encryptType;
          deviceInfoService.getCodes().then(function (response) {
            that.status = _.filter(response, { type: 'configResult' });
          });
          deviceInfoService
            .getDeviceReceiveRecords({ sendId: item.id })
            .then(function(response) {
              that.currentRecord = response;
            });
        },
        ok: function() {}
      });
    }
  }
})();
