(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BridgeConfigController", BridgeConfigController);

  /** @ngInject */
  function BridgeConfigController(
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
    vm.pushConfigs = pushConfigs;
    vm.queryParams = { deviceType: "2" };

    deviceInfoService.getDeviceConfigs(vm.queryParams).then(function(res) {
      vm.data = res;
    });

    var wardHelper = ldmSessionCache.getWardHelper();

    activate();

    function activate() {
      vm.open = open;
    }

    function open(item) {
      modalService.open({
        templateUrl: "LDM/modules/layoutEquipment/bridgeConfig/detail.modal.html",
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
              value: '2.5G'
            }, {
              code: '2',
              value: '5G'
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
            }]
          }
        },
        initFn: function() {
          var that = this;

          that.trueFalseMap = {
            'true': '是',
            'false': '否'
          };

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

            return '否';
          }
        },
        ok: function() {
          console.log("tarol");
        }
      });
    }

    function del(row) {
      return row.remove().then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已删除！"
        });

        deviceInfoService.getDeviceConfigs(vm.queryParams).then(function(res) {
          vm.data = res;
        });
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
        sendType: '2'
      }, _.pick(row, ['createPerson', 'deviceType']))).then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已推送配置~"
        });
      });
    }
  }
})();
