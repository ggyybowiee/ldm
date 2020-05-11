(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('sysRest', sysRest);

  /** @ngInject */
  function sysRest(Restangular, _, $q) {
    var sys = '/sys/sysWebAppInfo',
      hosInfo = '/hospital/hosInfo',
      upload = '/sys/sysAttachment',
      sysConfigs = '/sys/SysConfigs',
      apkFileParser = '/sys/ApkFileParser',
      commonUpload = '/sys/sysAttachment/ldm/file',
      downloadFile = '/sys/sysAttachment',
      //服务器当前时间
      serverTime = '/sys/server/time',
      observationItemConfig = '/sys/observationItemConfig';

    var hosData = null;

    var service = {
      getServer: getServer,
      getServerTime: getServerTime,
      getHosInfo: getHosInfo,
      postHosInfo: postHosInfo,
      putHosInfo: putHosInfo,
      upload: sysUpload,
      getConfigs: getConfigs,
      getConfig: getConfig,
      apkParse: apkParse,
      apkParseNew: apkParseNew,
      postFile: postFile,
      getFile: getFile,
      getFileUrl: getFileUrl,
      getObservationItemConfig: getObservationItemConfig,
      addObservationItemConfig: addObservationItemConfig,
      updateObservationItemConfig: updateObservationItemConfig,
      deleteObservationItemConfig: deleteObservationItemConfig
    };

    return service;

    function getServer() {
      return Restangular.one(sys).get();
    }

    function getServerTime() {
      return Restangular.one(serverTime).get();
    }

    function getHosInfo(params) {
      var defer = $q.defer();

      if (hosData) {
        defer.resolve(hosData);
        return defer.promise;
      }
      return Restangular.one(hosInfo + '/current').get(params).then(function (response) {
        return hosData = response;
      });
    }

    function postHosInfo(data) {
      return Restangular.one(hosInfo).customPOST(data);
    }

    function putHosInfo(data) {
      return Restangular.one(hosInfo).customPUT(data);
    }

    function sysUpload(params, data) {
      return Restangular.all(upload + '/' + params.moduleName + '/file')
        .withHttpConfig({
          transformRequest: angular.identity
        })
        .customPOST(data, undefined, params, {
          'Content-Type': undefined
        });
    }

    function getConfigs() {
      return Restangular.all(sysConfigs);
    }

    function getConfig(configCode) {
      return Restangular.one(sysConfigs, configCode).get();
    }

    function apkParse(url) {
      return Restangular.all(apkFileParser).customGET('', {
        url: url
      });
    }

    function apkParseNew(seqId) {
      return Restangular.all(apkFileParser).customGET('', {
        seqId: seqId
      });
    }

    function postFile(params, data) {
      return Restangular.all(commonUpload)
        .withHttpConfig({
          transformRequest: angular.identity
        })
        .customPOST(data, undefined, params, {
          'Content-Type': undefined
        });
    }

    function getFile(param) {
      var url = downloadFile + '/' + param + '/file';
      return Restangular.one(url).get();
    }

    function getFileUrl(param) {
      return 'windranger' + downloadFile + '/' + param + '/file';
    }

    function getObservationItemConfig(param) {
      return Restangular.all(observationItemConfig).getList(param);
    }

    function addObservationItemConfig(item) {
      return Restangular.one(observationItemConfig).customPOST(item);
    }

    function updateObservationItemConfig(item) {
      return Restangular.one(observationItemConfig).customPUT(item);
    }

    function deleteObservationItemConfig(itemSeqId) {
      return Restangular.one(observationItemConfig + '/' + itemSeqId).customDELETE();
    }
  }
})();
