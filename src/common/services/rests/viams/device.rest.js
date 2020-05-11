(function() {
  'use strict';

  angular.module('lachesis-common').factory('bodySignDeviceService', deviceService);

  /** @ngInject */
  function deviceService(Restangular, _) {
    // var mockRestangular = Restangular.withConfig(function(RestangularConfigurer) {
    //   RestangularConfigurer.setBaseUrl('mock');
    // });
    var device = '/Viam/viamEqpInfos';
    var bind = '/Viam/viamEqpPats';
    var gatherData = '/Viam/eqpGatherDatas';
    var latestGatherData = '/Viam/lastEqpGatherDatas';
    var copyData = '/Viam/copySigns';
    var bedVo = '/Viam/viamBedVos';
    var bedInfo = '/Viam/viamBedInfo';
    var dataReport = '/Viam/gatherDataReport';
    var useMode = '/Viam/pulseUseMode';
    var gatherMode = '/Viam/breathGatherMode';
    var gatherConfig = '/Viam/vitalGatherConfig';

    var service = {
      getDevices: getDevices,
      getBind: getBind,
      getGatherData: getGatherData,
      getLatestGatherData: getLatestGatherData,
      getCopyData: getCopyData,
      getBodySign: getBodySign,
      getBedInfo: getBedInfo,
      gatherLastData: _.noop,
      gatherData: _.noop,
      getCopyDataByPatID: _.noop,
      copy: _.noop,
      deleteData: _.noop,
      gatherDataReport: gatherDataReport,
      getUseMode: getUseMode,
      delUseMode: delUseMode,
      createUseMode: createUseMode,
      getGatherMode: getGatherMode,
      createGatherMode: createGatherMode,
      getGatherConfig: getGatherConfig
    };

    return service;

    function getDevices() {
      return Restangular.all(device);
    }

    function getBind() {
      return Restangular.all(bind);
    }

    function getGatherData() {
      return Restangular.all(gatherData);
    }

    function getLatestGatherData() {
      return Restangular.all(latestGatherData);
    }

    function getCopyData() {
      return Restangular.all(copyData);
    }

    function getBodySign() {
      return Restangular.all(bedVo);
    }

    function getBedInfo() {
      return Restangular.all(bedInfo);
    }

    function gatherDataReport(params) {
      return Restangular.all(dataReport).getList(params);
    }

    function getUseMode() {
      return Restangular.all(useMode).getList();
    }

    function createUseMode(ward, data) {
      return Restangular.all(useMode).customPOST(data, undefined, {
        wardCode: ward
      });
    }

    function delUseMode(name, ward) {
      return Restangular.one(useMode).customDELETE(undefined, {
        modeName: name,
        wardCode: ward
      });
    }

    function getGatherMode() {
      return Restangular.all(gatherMode).getList();
    }

    function createGatherMode(ward, data) {
      return Restangular.all(gatherMode).customPOST(undefined, undefined, {
        wardCode: ward,
        breathFreq: data
      });
    }

    function getGatherConfig(params) {
      return Restangular.one(gatherConfig).get(params);
    }

  }
})();
