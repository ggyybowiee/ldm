/**
 * Created by gary on 16/4/1.
 */
(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BlueBridgeMapController", BlueBridgeMapController);

  /** @ngInject */
  function BlueBridgeMapController(
    $rootScope,
    $scope,
    $q,
    $timeout,
    // $sce,
    deviceInfoService,
    sessionService,
    dragMarkerService,
    hospitalRest,
    utilService,
    $stateParams,
    modalService,
    _
  ) {
    //从ARSMS复制来

    dragMarkerService.reset();

    var vm = this,
      profile = sessionService.getProfile();
    var location = deviceInfoService.getLocation();

    var building = null, level = null;
    vm.src = null;
     if($stateParams){
      building = $stateParams.building;
      level = $stateParams.level;
      vm.src = $stateParams.src;
     }

    vm.list = [];
    vm.doSave = doSave;
    vm.getTiers = getTiers;
    vm.setCurrentTier = setCurrentTier;
    vm.formData = {};
    vm.isInMarkers = isInMarkers;
    vm.resetPosition = resetPosition;
    vm.openUploadMapImg = openUploadMapImg;
    vm.saveBridge = saveBridge;
    vm.startEditLocation = startEditLocation;
    // vm.markerTooltip = markerTooltip;

    vm.setMarkers = dragMarkerService.markers;

    hospitalRest.getWards().then(function(response) {
      vm.wards = response;
    });

    vm.eqpBelong = sessionService.getProfile().wardCode;
    $scope.$watch('vm.eqpBelong', getBridges);

    angular
      .element(document)
      .off("keyup")
      .on("keyup", handleMarkKeyup);

    var positionServ = {
      original_img_size: {
        width: 2045,
        height: 1252,
        scale: 2045 / 1252
      },
      left_list: null,
      offset_left: 0,
      bg_wrap_width: 1,
      bg_wrap_height: 1,
      inner_bg_width: 1,
      inner_offset_left: 1,
      zoom_scale: 1,
      bg_scaled_height: 1,
      bg_offset_top: 1,

      init: function() {
        var imageSource = angular.element(".bridge-map-bg");
        var image_src = imageSource.attr("imgSrc");
        if (!image_src) {
          return;
        }
        var map_bg = angular.element(".bridge-map-bg")[0];
        var map_bg_scale = map_bg.clientWidth / map_bg.clientHeight;
        var image = new Image();

        // image_src = image_src.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
        image.src = image_src;

        positionServ.original_img_size.width = image.width;
        positionServ.original_img_size.height = image.height;
        positionServ.original_img_size.scale =
          positionServ.original_img_size.width /
          positionServ.original_img_size.height;
        positionServ.left_list = document.querySelector(
          ".hardware-map_mark-list"
        );

        positionServ.bg_wrap_width = map_bg.clientWidth;
        positionServ.bg_wrap_height = map_bg.clientHeight;

        if (map_bg_scale > positionServ.original_img_size.scale) {
          positionServ.inner_bg_height = map_bg.clientHeight;
          positionServ.inner_bg_width =
            positionServ.inner_bg_height * positionServ.original_img_size.scale;
        } else {
          positionServ.inner_bg_width = map_bg.clientWidth;
          positionServ.inner_bg_height =
            positionServ.inner_bg_width / positionServ.original_img_size.scale;
        }

        positionServ.inner_offset_left =
          (positionServ.bg_wrap_width - positionServ.inner_bg_width) / 2;
        positionServ.zoom_scale =
          positionServ.inner_bg_width / positionServ.original_img_size.width;
        positionServ.bg_scaled_height =
          positionServ.inner_bg_width /
          (positionServ.original_img_size.width /
            positionServ.original_img_size.height);
        positionServ.bg_offset_top =
          (positionServ.bg_wrap_height - positionServ.bg_scaled_height) / 2;
      },

      getPosition: function(marker) {
        // var position = [];
        var that = this;
        that.init();
        // var _elem = angular.element(elem);
        var position = {};
        var real_left =
          (marker.left - that.inner_offset_left) / that.zoom_scale;
        var real_top = (marker.top - that.bg_offset_top) / that.zoom_scale;

        position.mac = marker.content.basicInfo.mac;
        position.id = marker.id;

        if (real_left >= 0 && real_top >= 0) {
          position.left = real_left.toFixed(2);
          position.top = real_top.toFixed(2);
          // position.push(position);
        }

        return position;
      },
      fill: function(real_position) {
        return {
          left: (
            real_position.left * positionServ.zoom_scale +
            positionServ.inner_offset_left
          ).toFixed(2),
          top: (
            real_position.top * positionServ.zoom_scale +
            positionServ.bg_offset_top
          ).toFixed(2),
          isRested: true
        };
      }
    };

    init();

    function init() {
      return getBuildings();
    }

    function doSave(marker, isUpdate) {
      if (transformData()) {
        var data = positionServ.getPosition(marker);

        data = _.assign(
          {},
          {
            // mac: data.mac,
            coordinate: data.left + ";" + data.top,
            deviceId: data.mac,
            id: marker.locationId
          },
          vm.formData
        );

        // 由原先的批量保存更改为单个保存
        return save(data, isUpdate);
      }
    }

    function isInMarkers(bridge) {
      return (
        _.findIndex(dragMarkerService.markers, function(marker) {
          return (
            bridge.content.basicInfo.mac ===
            (marker.content ? marker.content.basicInfo.mac : marker.deviceId)
          );
        }) >= 0
      );
    }

    function transformData() {
      if (!vm.formData.level) {
        $rootScope.$broadcast("toast", {
          type: "warning",
          content: "请选择楼号"
        });

        return;
      }

      if (!vm.formData.building) {
        $rootScope.$broadcast("toast", {
          type: "warning",
          content: "请选择楼层"
        });

        return;
      }

      return true;
    }

    function save(data, isUpdate) {
      return savePosition(data, isUpdate).then(function(response) {
        if (response) {
          $rootScope.$broadcast("toast", {
            type: "success",
            content: "已保存设置"
          });
          return response;
        }
      });
    }

    function getBuildings() {
      hospitalRest
        .getBuildings()
        .getList()
        .then(function(response) {
          vm.buildings = response;
          if(building){
            vm.formData.building = building;
            if(level){
              getTiers();
            }
          }
        });
    }

    function getTiers() {
      vm.imgSrc = null;
      vm.formData.level = null;
      hospitalRest
        .getTiers(vm.formData.building || building)
        .getList()
        .then(function(response) {
          vm.tiers = response;
          if(level){
            vm.formData.level = level;
            setCurrentTier();
          }
        });
    }

    function setCurrentTier() {
      vm.currentTier = _.find(vm.tiers, function(item) {
        if(item.tierCode === vm.formData.level) return item;
      });
      // vm.imgSrc = 'windranger/hospital/showImg?url=' + vm.currentTier.imgPath;
      vm.imgSrc = vm.currentTier.imgPath;
    }

    function resetPosition() {
      positionServ.init();
      dragMarkerService.markers.forEach(function(marker) {
        // 只重置一次
        if (marker.isRested) {
          return;
        }
        if (
          marker.level !== vm.formData.level ||
          marker.building !== vm.formData.building
        ) {
          return;
        }
        _.assign(
          marker,
          positionServ.fill({
            left: marker.left,
            top: marker.top
          })
        );
        $scope.$apply();
      });
    }

    function getBridges() {
      return deviceInfoService
        .getDevices({
          eqpType: 1004,
          eqpBelong: vm.eqpBelong,
          eqpStatus: 10001
        })
        .then(function(response) {
          var reqList = [];
          var macArray = [];
          if (response) {
            vm.bridges = response;

            vm.bridges = vm.bridges.filter(function(bItem) {
              if (
                bItem.content.basicInfo.mac !== "" &&
                typeof bItem.content.basicInfo.mac !== "undefined"
              ) {
                // reqList.push(getBridgeLocation(bItem.content.basicInfo.mac));
                macArray.push(bItem.content.basicInfo.mac);
              }

              return !!bItem.content.basicInfo.mac;
            });

            if(macArray.length > 0){
              return getBridgeLocation(macArray).then(function(response) {
                if (response) {
                  response.forEach(addMarkerToService);

                  return true;
                }
              });
            }else return true;
          }
        });
    }

    function addMarkerToService(location, i) {
      var position = {
        left: location.coordinate.split(";")[0],
        top: location.coordinate.split(";")[1]
      };
      var currentDevice = _.find(vm.bridges, function(item) {
        return location.deviceId === item.content.basicInfo.mac;
      });
      var copy = angular.copy(currentDevice);
      var deviceId = copy.id;
      delete copy.id; // device id

      dragMarkerService.addMarker(
        _.assign({}, copy, {
          link: "id",
          // 拖拽源id
          sourceId: "id" + deviceId,
          uid: utilService.guid(),
          left: position.left,
          top: position.top,
          locationId: location.id,
          level: location.level,
          building: location.building
        })
      );
    }

    function handleMarkKeyup(event) {
      if (event.originalEvent.which !== 46) {
        return;
      }

      var activeMarker = angular.element(".map-markers__item.active");
      var uid = activeMarker.attr("id");
      var sourceId = activeMarker.data("sourceId");
      var sourceElement = angular.element("#" + sourceId);

      var marker = _.find(dragMarkerService.markers, function(marker) {
        return uid === marker.uid;
      });
      var promise = deletePosition(marker);
      if (promise) {
        promise.then(function(response) {
          if (response) {
            dragMarkerService.removeMarker(marker.uid);
            // 添加hide使marker立即隐藏，service操作有延迟
            activeMarker.addClass("hide");

            sourceElement && sourceElement.removeClass("hide");

            $rootScope.$broadcast("toast", {
              type: "success",
              content: "已删除标注！"
            });
          }
        });
      }
    }

    function getBridgeLocation(macs) {
      return location.getList({
        deviceIds: macs
      });
    }

    function savePosition(data, isUpdate) {
      if (isUpdate) {
        return location.customPUT(data, data.id);
      }
      return location.post(data);
    }

    function deletePosition(marker) {
      if (marker.locationId) {
        return location.customDELETE(marker.locationId);
      }
    }

    $scope.$on('$destory',function(){
      $stateParams = null;
    });

    // function markerTooltip(marker) {
    //   return $sce.trustAsHtml(marker.content.basicInfo.eqpName + '<br />' + marker.content.basicInfo.mac);
    // }

    function uploadMap() {
      var formData = new FormData();
      formData.append('image', vm.uploadMapFile);

      hospitalRest.setTiers({
        buildingCode: vm.formData.building,
        tierCode: vm.formData.level
      }, formData).then(function (resp) {
        level = vm.formData.level;
        getTiers();
      });
    }

    function openUploadMapImg() {
      window.onFileInputChange = function (name, value, elt) {
        vm.uploadMapFile = elt.files[0];
        vm.formData.uploadMapFile = elt.files[0];
        var formControl = document.getElementById('formControl');
        var fileInput = document.getElementById('fileInput');
        var saveBtn = document.getElementById('saveUploadMapImg');
        var errElt = document.getElementById('sizeLimitErr');

        if (!vm.uploadMapFile) {
          formControl.classList.add('has-error');
          saveBtn.setAttribute('disabled', true);
          errElt.style.display = 'block';
          fileInput.classList.push('fileInput');
        } else if (vm.uploadMapFile.size > 1024 * 1024 * 2) {
          formControl.classList.add('has-error');
          saveBtn.setAttribute('disabled', true);
          errElt.style.display = 'block';
        } else {
          formControl.classList.remove('has-error');
          saveBtn.removeAttribute('disabled');
          errElt.style.display = 'none';
        }
        $scope.$digest();
      };
      modalService.open({
        templateUrl: 'LDM/modules/layoutEquipment/bridgeMapConfig/uploadImg.tpl.html',
        size: 'md',
        scope: $scope,
        data: {
          formData: {
          }
        },
        ok: function() {
          uploadMap();
          modalService.close();
        }
      })
    }

    function saveBridge(bridge) {
      vm.edittingLocation = null;
      bridge.put();
    }

    function startEditLocation(bridge) {
      vm.edittingLocation = bridge.content.basicInfo.mac;
      setTimeout(function () {
        angular.element('#location-input-' + bridge.id).focus();
      }, 0);
    }
  }
})();
