(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('nursingPathRest', nursingPathRest);

  /** @ngInject */
  function nursingPathRest(Restangular) {
    var nursingPathConfig = '/mnis/path/tpls';
    var nursingPathPatientUrl = '/mnis/path/stat/patient/current';
    var nursingHistoryPathPatientUrl = '/mnis/path/stat/patient/history';
    var nursingPathFullSenateStatisticsUrl = '/mnis/path/stat/all';
    var nursingPathSingleUrl = '/mnis/path/stat/single';
    var nursingPathWardUrl = '/mnis/path/stat/ward';
    var hosWardUrl = '/hospital/hosWard';

    var service = {
      getNursingPathConfigByWardCode: getNursingPathConfigByWardCode,
      updateNursingPathConfigByWardCode: updateNursingPathConfigByWardCode,
      getNursingPathConfigById: getNursingPathConfigById,
      deleteNursingPatientConfigById: deleteNursingPatientConfigById,
      addNursingPatientConfig: addNursingPatientConfig,
      updateNursingPatientConfig: updateNursingPatientConfig,
      getNursingPathPatientList: getNursingPathPatientList,
      getNursingHistoryPathPatientList: getNursingHistoryPathPatientList,
      getNursingPathFullSenateStatistics: getNursingPathFullSenateStatistics,
      getNursingPathSingle: getNursingPathSingle,
      getNursingPathWardList: getNursingPathWardList,
      getHosWardList: getHosWardList,

      addNursingPathNode: addNursingPathNode,
      updateNursingPathNode: updateNursingPathNode,
      deleteNursingPathNode: deleteNursingPathNode,
      getNodeChildsByCurrentNode: getNodeChildsByCurrentNode
    };

    function getNursingPathConfigByWardCode(params) {
      return Restangular.all(nursingPathConfig + "/digest").customGET('', params);
    }

    function updateNursingPathConfigByWardCode(params) {
      return Restangular.all(nursingPathConfig + "/digest").customPUT(params);
    }

    function getNursingPathConfigById(tplId) {
      return Restangular.all(nursingPathConfig + "/" + tplId).customGET();
    }

    function deleteNursingPatientConfigById(tplId) {
      return Restangular.all(nursingPathConfig + "/" + tplId).customDELETE();
    }

    function addNursingPatientConfig(tplConfig) {
      return Restangular.all(nursingPathConfig).customPOST(tplConfig);  
    }

    function updateNursingPatientConfig(tplConfig) {
      return Restangular.all(nursingPathConfig).customPUT(tplConfig);
    }

    function getNursingPathPatientList(params) {
      return Restangular.all(nursingPathPatientUrl).customGET('', params);
    }

    function getNursingHistoryPathPatientList(params) {
      return Restangular.all(nursingHistoryPathPatientUrl).customGET('', params);
    }

    function getNursingPathFullSenateStatistics(params) {
      return Restangular.all(nursingPathFullSenateStatisticsUrl).customGET('', params);
    }

    function getNursingPathSingle(params) {
      return Restangular.all(nursingPathSingleUrl).customGET('', params);
    }

    function getNursingPathWardList(params) {
      return Restangular.all(nursingPathWardUrl).customGET('', params);
    }

    function getHosWardList(params) {
      return Restangular.all(hosWardUrl).customGET('', params);
    }

    function addNursingPathNode(tplConfig) {
      return Restangular.all(nursingPathConfig + '/node').customPOST(tplConfig);
    }

    function updateNursingPathNode(tplConfig) {
      return Restangular.all(nursingPathConfig + '/node').customPUT(tplConfig);
    }

    function deleteNursingPathNode(tplId, nodeTplId, args) {
      return Restangular.all(nursingPathConfig + '/' + tplId + '/node/' + nodeTplId).customDELETE("", args);
    }

    function getNodeChildsByCurrentNode(params) {
      return Restangular.all(nursingPathConfig + '/node').customGET('', params);
    }

    return service;

  }
})();
