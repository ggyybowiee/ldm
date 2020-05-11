(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NDAconfigRecordController", NDAconfigRecordController);

  /** @ngInject */
  function NDAconfigRecordController(
    $rootScope,
    $scope,
    modalService,
    deviceInfoService,
    sessionService,
    $state,
    $filter,
    hospitalRest,
    _
  ) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();

    vm.dic = dicHelper.dic;
    vm.sendType = vm.dic.ldmSendType;
    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.openDetail = openDetail;
    vm.getRecords = getRecords;
    vm.search = search;
    vm.queryText = "";
    vm.queryParams = {
      content: "",
      deviceType: 1,
      beginTime: "",
      endTime: "",
      page: 1,
      offset: 10
    };

    vm.queryByType = {
      deviceType: 1
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
    function getRecords(tableState, StTableController, isSearch) {

      vm.tableController = StTableController;
      var tableInnerState = StTableController.tableState();
      isSearch ? vm.queryParams.page = 1 : vm.queryParams.page = tableInnerState.pagination.start ? (tableInnerState.pagination.start / tableInnerState.pagination.number + 1) : 1;

      return deviceInfoService
        .getDeviceSendRecords()
        .customGET("", vm.queryParams)
        .then(function(res) {
          vm.data = res.datas.map(function(item) {
            item.contentObject = angular.fromJson(item.contentString);
            return item;
          });

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

    function search() {
      getRecords(null, vm.tableController, 1);
    }

    function openDetail(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/layoutEquipment/NDAconfigRecord/recordDetail.modal.html",
        size: "lg",
        data: {
          formData: angular.merge({}, item),
          metaData: {
            currentRecord: "",
            status: {},
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
            ],
            syncInterval: [{
              code: '300000',
              value: '5分钟'
            },{
              code: '600000',
              value: '10分钟'
            },{
              code: '1800000',
              value: '30分钟'
            },{
              code: '3600000',
              value: '1小时'
            },{
              code: '43200000',
              value: '12小时'
            },{
              code: '86400000',
              value: '1天'
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
        },
        getPDAMethod: function(value) {
          if(angular.isString(value)) {
            if(value === 'keyboard'){
              return '键盘接收方式';
            }else if(value === 'broadcast'){
              return '广播接收方式';
            }
          }
        }
      },
        initFn: function() {
          var that = this;
          that.belongs = vm.belongs;
          deviceInfoService.getCodes().then(function (response) {
              var status = _.filter(response, { type: 'configResult' });
              that.status = status;
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
