(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NDAconfigurationController", NDAconfigurationController);

  /** @ngInject */
  function NDAconfigurationController(
    $rootScope,
    $scope,
    $state,
    modalService,
    deviceInfoService,
    ldmSessionCache,
    hospitalRest,
    _
  ) {
    var vm = this;
    vm.del = del;
    vm.open = open;
    vm.pushConfigs = pushConfigs;
    vm.queryParams = { deviceType: "1" };

    var wardHelper = ldmSessionCache.getWardHelper();

    vm.load = {
      init: true,
      func: init
    };

    activate();

    function activate() {
      getWards();
    }

    function init() {
      return deviceInfoService.getDeviceConfigs(vm.queryParams).then(function(res) {
        vm.data = res;
      });
    }

    function open(item) {
      modalService.open({
        templateUrl: "LDM/modules/layoutEquipment/NDAconfig/detail.modal.html",
        size: "lg",
        data: {
          formData: angular.merge({}, item),
          metaData: {
            currentConfig: item,
            wards: vm.wards,
            wlanBands: [{
              code: '0',
              value: '自动切换'
            }, {
              code: '1',
              value: '5G'
            }, {
              code: '2',
              value: '2.4G'
            }],
            encryptTypes: [{
              code: '0',
              value: '不加密'
            }, {
              code: '2',
              value: 'WAP/WAP2-PSK'
            }, {
              code: '1',
              value: 'WEP'
            }, {
              code: '3',
              value: '802.1xEAP'
            }],
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
        initFn: function() {
          var that = this;

          deviceInfoService.getDeviceConfig(item.id).then(function(response) {
            that.data = response;
          });
        },
        methodsObj: {
          pushConfigs: pushConfigs,
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
        }
      });
    }

    function del(row) {
      return row.remove().then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已删除！"
        });

        vm.load.func();
      });
    }
    function getWards() {
      return hospitalRest.getWards().then(function(response) {
        vm.wards = response;
      });
    }

    function pushConfigs(row) {
      return deviceInfoService.getDeviceSendRecords().post(_.assign({}, {
        configId: row.id,
        sendType: '1'
      }, _.pick(row, ['createPerson', 'deviceType']))).then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已推送配置!"
        });
      });
    }
  }
})();
