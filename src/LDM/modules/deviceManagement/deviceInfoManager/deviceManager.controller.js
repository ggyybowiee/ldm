(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller(
      "LDMDeviceInfoManagerController",
      LDMDeviceInfoManagerController
    );

  /** @ngInject */
  function LDMDeviceInfoManagerController(
    $scope,
    modalService,
    deviceInfoService,
    Restangular,
    roleService,
    hospitalRest,
    $filter,
    $timeout,
    _
  ) {
    var vm = this;

    vm.today = $filter("date")(new Date(), "yyyy-MM-dd");
    vm.openAdd = openAdd;
    vm.openDetail = openDetail;
    vm.openNewDevice = openNewDevice;
    vm.del = del;
    vm.queryParams = {
      eqpName: "",
      eqpType: "",
      eqpBelong: "",
      eqpStatus: 10001
    };

    vm.load = {
      init: true,
      func: init
    };

    getDeviceTypes();
    getDeviceBelong();

    function init() {
      getRoles();
      return getDevices(vm.queryParams).then(function(response) {
        vm.devices = $filter('orderBy')(response,['content.basicInfo.eqpType','content.basicInfo.eqpName']);
      });
    }

    function getRoles() {
      return roleService.getRoles().then(function (data) {
        vm.roles = data;
      });
    }

    function getDevices(params) {
      return deviceInfoService.getDevices(params);
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

    function openAdd(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceManagement/deviceInfoManager/add.modal.html",
        size: "lg",
        data: {
          metaData: {
            types: vm.types,
            belongs: vm.belongs,
            roles: vm.roles
          },
          formData: item
            ? Restangular.copy(item)
            : { content: { basicInfo: {} } }
        },
        ok: function(data) {
          return save.call(this, data, !item);
        },
        initFn: function() {
          this.getRooms();
          this.getBeds();
        },
        methodsObj: {
          getRooms: function() {
            var that = this;

            that.formData.content.basicInfo.eqpBelong &&
              getRooms(that.formData.content.basicInfo.eqpBelong).then(function(
                response
              ) {
                that.rooms = response.plain();
              });
          },
          getBeds: function() {
            var that = this;
            that.formData.content.basicInfo.roomCode &&
              getBeds(that.formData.content.basicInfo.eqpBelong, {
                roomCode: that.formData.content.basicInfo.roomCode
              }).then(function(response) {
                that.beds = response.plain();
              });
          },
          setRequired: function() {
            //序列号与mac地址需填其一。设置这两项是否为required
            var that = this;
            if (
              (that.formData.content.basicInfo && that.formData.content.basicInfo.sn &&
                that.formData.content.basicInfo.sn.length > 0) ||
              (that.formData.content.basicInfo && that.formData.content.basicInfo.mac &&
                that.formData.content.basicInfo.mac.length > 0)
            ) {
              return false;
            } else return true;
          }
        }
      });
    }

    function openDetail(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceManagement/deviceInfoManager/detail.modal.html",
        size: "md",
        data: {
          formData: angular.merge({}, item),
          metaData: {
            currentDevice: item,
            deviceTypes: vm.types,
            belongs: vm.belongs,
            status: {
              isMacOpen: false,
              isHardwareOpen: false,
              isOperaSysOpen: false,
              isOtherOpen: false
            }
          }
        },
        initFn: function() {
          var that = this;
          deviceInfoService.getDevice(item.id).then(function(response) {
            that.metaData.detail = response;
          });
        }
      });
    }

    function openNewDevice() {
      var instance = modalService.open({
        templateUrl:
          "LDM/modules/deviceManagement/deviceInfoManager/newDevice.modal.html",
        size: "lg",
        data: {
          formData: {},
          metaData: {
            types: vm.types,
            belongs: vm.belongs,
            startTime: vm.today,
            endTime: vm.today
          }
        },
        initFn: function() {
          var that = this;
          that.isLoading = true;
          getDevices({
            eqpStatus: 10000,
            startTime: vm.today,
            endTime: vm.today
          }).then(function(response) {
            that.isLoading = false;
            that.formData.newDevices = response;
            that.formData.newDevices.forEach(function(item, index) {
              item.seqNum = index;
              if (!that["rooms" + index] && item.content.basicInfo.eqpBelong) {
                getRooms(item.content.basicInfo.eqpBelong).then(function(
                  response
                ) {
                  that["rooms" + index] = response.plain();
                });
              }

              if (!that["rooms" + index] && item.content.basicInfo.roomCode) {
                getBeds(item.content.basicInfo.eqpBelong, {
                  roomCode: item.content.basicInfo.roomCode
                }).then(function(response) {
                  that["beds" + index] = response.plain();
                });
              }
            });
          });
        },
        methodsObj: {
          search: function() {
            var that = this;
            that.isLoading = true;
            getDevices({
              eqpStatus: 10000,
              startTime: that.metaData.startTime,
              endTime: that.metaData.endTime
            }).then(function(response) {
              that.isLoading = false;
              that.formData.newDevices = response;
              that.formData.newDevices.forEach(function(item, index) {
                item.seqNum = index;
                if (
                  !that["rooms" + index] &&
                  item.content.basicInfo.eqpBelong
                ) {
                  getRooms(item.content.basicInfo.eqpBelong).then(function(
                    response
                  ) {
                    that["rooms" + index] = response.plain();
                  });
                }

                if (!that["rooms" + index] && item.content.basicInfo.roomCode) {
                  getBeds(item.content.basicInfo.eqpBelong, {
                    roomCode: item.content.basicInfo.roomCode
                  }).then(function(response) {
                    that["beds" + index] = response.plain();
                  });
                }
              });
            });
          },
          add: function(index) {
            var that = this;
            var selectDevice = that.formData.newDevices[index];

            Object.keys(selectDevice).forEach(function(key) {
              if (key.indexOf("Des") >= 0) {
                delete selectDevice[key];
              }
            });
            selectDevice.content.basicInfo.eqpStatus = 10001;
            delete selectDevice.seqNum;
            selectDevice.put().then(function() {

              that.formData.newDevices.splice(index,1);
              that.formData.newDevices.forEach(function(item, index) {
                item.seqNum = index;
              });
              $scope.$emit("toast", {
                type: "success",
                content: "添加成功！"
              });
            });
          },
          getRooms: function(index, wardCode) {
            var that = this;

            getRooms(wardCode).then(function(response) {
              that["rooms" + index] = response.plain();
            });
          },
          getBeds: function(index, wardCode, roomCode) {
            var that = this;
            getBeds(wardCode, {
              roomCode: roomCode
            }).then(function(response) {
              that["beds" + index] = response.plain();
            });
          }
        }
      });
      //模态框关闭后，调用设备信息管理里的接口，重新加载已添加设备列表。
      instance.closed.then(function () {
        vm.load.func();
      })
    }

    function getRooms(wardCode) {
      return hospitalRest.getRooms(wardCode);
    }

    function getBeds(wardCode, params) {
      return hospitalRest.getBeds(wardCode, params);
    }

    function save(data, isNew) {
      data.content.basicInfo.eqpStatus === 10001;
      if (!isNew) {
        Object.keys(data).forEach(function(key) {
          if (key.indexOf("Des") >= 0) {
            delete data[key];
          }
        });
        return data.put().then(function(response) {
          $scope.$emit("toast", {
            type: "success",
            content: "更新成功！"
          });
          var index = _.findIndex(vm.devices, { 'id': data.id });

          vm.devices.splice(index,1);
          $timeout(function(){
            vm.devices.splice(index,0,response);
          }, 100);
        });
      } else {
        return deviceInfoService.postDevice(data).then(function(response) {
          if (response) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功！"
            });
            vm.load.func();
          }
        });
      }
    }

    function del(item) {
      return item.customDELETE(item.seqId).then(function() {
        var index = _.indexOf(vm.devices, item);
        vm.devices.splice(index,1);
        $scope.$emit("toast", {
          type: "success",
          content: "已删除！"
        });
        //vm.load.func();
      });
    }
  }
})();
