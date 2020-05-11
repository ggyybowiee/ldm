(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("deviceAppService", deviceAppService);

  /** @ngInject */
  function deviceAppService(Restangular) {
    // var softWare = '/ldm/SoftUpgradeManages';
    // var updatable = '/ldm/SoftUpgradeManages/getUpgradeSoft';
    var softWare = "/ldm/software/upgrade";
    var updatable = "/ldm/software/upgrade/getUpgradeSoft";
    var softwareUpgradePush ="/ldm/software/upgrade/push";
    var softWareUpgradeRecords = "/ldm/software/upgrade/records";
    var otaPackages = "/ldm/ota/packages";
    var uploadOtaPackage = "/ldm/ota/packages/parse";
    var otaUpgradePush = "/ldm/ota/push";
    var otaUpgradeRecords = "/ldm/ota/records";
    var deviceVersions = "/ldm/device/versions";
    var settingReminder = "/ldm/setting/reminder";
    var commonUploadLdm = '/sys/sysAttachment/ldm/file';
    var uploadHugeOTAPackage = "/sys/hugeFileUpload";
    var service = {
      getSoftwares: getSoftwares,
      getSoftware: getSoftware,
      getUpgradeSoft: getUpgradeSoft,
      postSoftwareUpgrade: postSoftwareUpgrade,
      getSoftwareUpgradeRecords: getSoftwareUpgradeRecords,
      getSoftwareUpgradeRecord: getSoftwareUpgradeRecord,
      getOTAPackages: getOTAPackages,
      getOTAPackage: getOTAPackage,
      postOTAPackage: postOTAPackage,
      postOTAUpgrade: postOTAUpgrade,
      getOTAUpgradeRecords: getOTAUpgradeRecords,
      getOTAUpgradeRecord: getOTAUpgradeRecord,
      getDeviceVersions: getDeviceVersions,
      getSettingReminder: getSettingReminder,
      upgradeSettingReminder: upgradeSettingReminder,
      postFileLdm: postFileLdm,
      postHugePackage: postHugePackage,
      getUploadProgress: getUploadProgress
    };

    return service;

    function getSoftwares(params) {
      return Restangular.all(softWare).getList(params);
    }

    function getSoftware(seqId) {
      return Restangular.one(softWare, seqId).get();
    }

    function getUpgradeSoft(params) {
      return Restangular.all(updatable).getList(params);
    }

    function postSoftwareUpgrade(upgrade) {
      return Restangular.all(softwareUpgradePush).post(upgrade);
    }

    function getSoftwareUpgradeRecords(params) {
      return Restangular.all(softWareUpgradeRecords).getList(params);
    }

    function getSoftwareUpgradeRecord(id) {
      return Restangular.one(softWareUpgradeRecords, id).get();
    }

    function getOTAPackages(params) {
      return Restangular.all(otaPackages).getList(params);
    }

    function getOTAPackage(id) {
      return Restangular.one(otaPackages, id).get();
    }

    // function postOTAPackage(data, params) {
    //   return Restangular.all(uploadOtaPackage)
    //     .withHttpConfig({ transformRequest: angular.identity })
    //     .customPOST(data, undefined, params, { "Content-Type": undefined });
    // }

    function postOTAPackage(params) {
      return Restangular.all(uploadOtaPackage,params).customPOST('','',params,{});
    }

    //上传30MB大小以上大文件时，先用此接口申请文件上传。
    function postHugePackage() {
      return Restangular.all(uploadHugeOTAPackage).post();
    }

    function postOTAUpgrade(upgrade) {
      return Restangular.all(otaUpgradePush).post(upgrade);
    }

    function getOTAUpgradeRecords(params,id) {
      return Restangular.all(otaUpgradeRecords, id).getList(params);
    }

    function getOTAUpgradeRecord(id) {
      return Restangular.one(otaUpgradeRecords, id).get();
    }

    function getDeviceVersions(deviceType) {
      return Restangular.all(deviceVersions).getList(deviceType);
    }

    function getSettingReminder(){
      return Restangular.one(settingReminder).get();
    }

    function upgradeSettingReminder(data){
      return Restangular.one(settingReminder).customPOST(data);
    }

    function postFileLdm(file, params) {
      return Restangular.one(commonUploadLdm)
      .withHttpConfig({ transformRequest: angular.identity })
      .customPOST(file, '', params, { "Content-Type": undefined });
    }

    function getUploadProgress(url){
      return Restangular.one(uploadHugeOTAPackage, url).all('progress').customGET();
    }
  }
})();
