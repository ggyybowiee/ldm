(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('nursingRest', nursingRest);

  /** @ngInject */
  function nursingRest(Restangular, $q, moment, _) {
    var nursingDoc = '/attend/attendTpls';
    var nursingSheet = '/attend/attendSheets';
    var nursingData = '/attend/attendDatas';
    var evaluateData = '/attend/evaluateDatas';
    var rTVitalsigns = '/Mnis/realTimeVitalsigns';
    var syncInhosRecordsPath = '/emr/syncInhosRecords';
    var tempConfig = '/Mnis/vitalConfig';
    var whiteBoardConfig = 'sys/whiteboard';
    var tempSheetDatas = '/Mnis/tempSheetDatas';
    var singleDayData = '/Mnis/singleDayDatas';
    var customColumns = '/attend/attendHeader';
    var transferInfo = '/emr/patInhosTransfers';
    var attentBlackPage = '/attend/blankPage';
    // /Mnis/vitalsigns
    var vitalsigns = '/Mnis/vitalsigns';
    var vitalSignHeaderUrl = '/Mnis/vitalSignHeader';
    var vitalSignHeadersUrl = '/Mnis/vitalSignHeaders';
    var vitalsignsConfig = '/Mnis/vitalsignConfigs';
    var inOutStatData = '/attend/inOutStatData';
    var diagnosis = '/emr/Diagnosis';
    var docConfig = '/doc/docConfig';
    var diagnosisData = null;
    var transferInfoData = null;

    // Mnis/surgery 

    // beds.modal
    var patientPathEnterUrl = '/mnis/patient/path/enter';
    var patientPathExitUrl = '/mnis/patient/path/exit';
    var getPatientPathUrl = '/mnis/patient/path';
    var hosUserShiftExtUrl = '/hospital/hosUserShiftExt';
    var getDeviceListUrl = '/mnis/MnisIpBedMapping';
    var getPatInhosUnbindUrl = '/mnis/patInhosRecord';
    var patientEventUrl = '/mnis/patEventRecord';
    var getPatientUrl = '/emr/historyInhosRecords';
    var getWardoverUrl = '/emr/wardShiftManagement';

    var service = {
      getDocConfig: getDocConfig,
      getNursingDocs: getNursingDocs,
      getNursingDocBlankPage: getNursingDocBlankPage,
      deleteNursingDocBlackPage:deleteNursingDocBlackPage,
      updateNursingDocs: updateNursingDocs,
      getNursingDoc: getNursingDoc,
      getNursingSheets: getNursingSheets,
      getNursingSheetsById: getNursingSheetsById,
      updateNursingSheet: updateNursingSheet,
      deleteNursingSheet: deleteNursingSheet,
      getNursingData: getNursingData,
      updateNursingData: updateNursingData,
      delNursingData: delNursingData,
      getInhosRecords: getInhosRecords,
      getInhosRecordsByOrder: getInhosRecordsByOrder,
      getInhosRecordsFromEmr: getInhosRecordsFromEmr,
      getInhosRecordsById: getInhosRecordsById,
      getInhosRecordsByTeamCode: getInhosRecordsByTeamCode,
      getHisRecordsInSlot: getHisRecordsInSlot,
      getBedsList: getBedsList,
      createFocusBed: createFocusBed,
      removeFocusBed: removeFocusBed,
      getFocusBeds: getFocusBeds,
      getWardsHis: getWardsHis,
      getMarkRows: getMarkRows,
      updateMarkRows: updateMarkRows,
      getHisRecordsByKey: getHisRecordsByKey,
      getHisRecords: getHisRecords,
      getSurgeryRecords: getSurgeryRecords,
      getDiagnosis: getDiagnosis,
      createDiagnosis: createDiagnosis,
      deleteDiagnosis: deleteDiagnosis,
      updateDiagnosis: updateDiagnosis,
      getTransferInfo: getTransferInfo,
      getTransferByWard: getTransferByWard,
      getInOutStatData: getInOutStatData,
      getHandoverItemCount: getHandoverItemCount,
      getHandoverList: getHandoverList,
      updateHandover: updateHandover,
      sizeDic: [{
        value: '297,420',
        label: 'A3（纵）'
      }, {
        value: '420,297',
        label: 'A3（横）'
      }, {
        value: '210,297',
        label: 'A4（纵）'
      }, {
        value: '297,210',
        label: 'A4（横）'
      }, {
        value: '176,250',
        label: 'B5（纵）'
      }, {
        value: '250,176',
        label: 'B5（横）'
      }, {
        value: '184,260',
        label: '16K（纵）'
      }, {
        value: '260,184',
        label: '16K（横）'
      }],

      getVitalsigns: getVitalsigns,
      getVitalSignHeader: getVitalSignHeader,
      getVitalSignHeaderWithPageNo: getVitalSignHeaderWithPageNo,
      getVitalsignsForImport: getVitalsignsForImport,
      getVitalsignsForPrint: getVitalsignsForPrint,
      setAttendForPrint: setAttendForPrint,
      getAttendDates: getAttendDates,
      getIdocForPrint: getIdocForPrint,
      getVitalsignsConfig: getVitalsignsConfig,
      getRealTimeVitalsigns: getRealTimeVitalsigns,
      getRealTimeEvaluates: getRealTimeEvaluates,
      getEvaluateData: getEvaluateData,
      getTempConfig: getTempConfig,
      getTempSheetData: getTempSheetData,
      getSingleDayData: getSingleDayData,

      getCustomColumns: getCustomColumns,
      getWhiteBoardConfig: getWhiteBoardConfig,

      syncInhosRecords: syncInhosRecords,

      updateAttendHeaders: updateAttendHeaders,
      updateAttendDataList: updateAttendDataList,
      updateEvaluateDataList: updateEvaluateDataList,
      patientPathEnter: patientPathEnter,
      patientPathExit: patientPathExit,
      getPatientPath: getPatientPath,
      updatePatientPath: updatePatientPath,
      getPatientPathSummary: getPatientPathSummary,
      patientPathNextNode: patientPathNextNode,
      patientPathNextDay: patientPathNextDay,
      getPatientPathNodeDetail: getPatientPathNodeDetail,
      getPatientPathNodeSingleDetail: getPatientPathNodeSingleDetail,
      getHosUserShiftExt: getHosUserShiftExt,
      executeNode: executeNode,
      executeNodeBatch: executeNodeBatch,
      executeCancleNode: executeCancleNode,
      checkExecuteCancleNode: checkExecuteCancleNode,
      checkDeletePathNode: checkDeletePathNode,
      deletePathNode: deletePathNode,
      recoverNode: recoverNode,

      getPatientSurgery: getPatientSurgery,
      getDeviceListByWardCode: getDeviceListByWardCode,
      getPatientListByWardCode: getPatientListByWardCode,
      unbindDevice: unbindDevice,
      bindDevice: bindDevice,
      getDocumentExt: getDocumentExt,
      getPatientByInhosCode: getPatientByInhosCode
    };

    return service;

    function getDocConfig(configName) {
      return Restangular.all(docConfig).customGET('', {
        configName: configName
      });
    }

    function getNursingDocBlankPage() {
      return Restangular.all(attentBlackPage);
    }

    function deleteNursingDocBlackPage(dataId) {
      return Restangular.all(attentBlackPage + '/' + dataId).customDELETE();
    }

    function getAttendDates(sheetId) {
      return Restangular.all('/attend/attendDates').customGET('', {
        sheetId: sheetId
      })
    }

    function getNursingDocs(params) {
      return Restangular.all(nursingDoc).getList(params);
    }

    function updateEvaluateDataList(data) {
      return Restangular.all('/attend/evaluateDataList').customPOST(data);
    }

    function updateNursingDocs(data) {
      return Restangular.all(nursingDoc).customPOST(data);
    }

    function getNursingDoc(id) {
      return Restangular.one(nursingDoc, id).get();
    }

    function getEvaluateData() {
      return Restangular.all(evaluateData);
    }

    function getTempConfig() {
      return Restangular.all(tempConfig);
    }

    function getWhiteBoardConfig() {
      return Restangular.all(whiteBoardConfig);
    }

    function getTempSheetData() {
      return Restangular.all(tempSheetDatas);
    }

    function getSingleDayData() {
      return Restangular.all(singleDayData);
    }

    function getNursingSheets(params) {
      return Restangular.all(nursingSheet).getList(params);
    }

    function getNursingSheetsById(sheetId) {
      return Restangular.all(nursingSheet + "/" + sheetId).customGET();
    }

    function updateNursingSheet(data) {
      return Restangular.all(nursingSheet).customPOST(data);
    }

    function deleteNursingSheet(sheetId) {
      return Restangular.all(nursingSheet).customDELETE(sheetId);
    }

    function getNursingData(params) {
      return Restangular.all(nursingData).getList(params);
    }

    function updateNursingData(data) {
      return Restangular.all(nursingData).customPOST(data);
    }

    function delNursingData(id) {
      return Restangular.one(nursingData, id).remove();
    }

    function getVitalsigns(paramsString) {
      return Restangular.all(vitalsigns + (paramsString || ''));
    }

    function getVitalSignHeader(params) {
      return Restangular.all(vitalSignHeadersUrl).customGET('', params);
    }

    function getVitalSignHeaderWithPageNo(params) {
      return Restangular.all(vitalSignHeaderUrl + '/page').customGET('', params);
    }

    function getVitalsignsForImport(params) {
      return Restangular.all(vitalsigns + "/import").customGET('', params);
    }

    function getVitalsignsForPrint(dataList) {
      return Restangular.all(vitalsigns + "/print").customPOST(dataList);
    }

    function setAttendForPrint(dataList) {
      return Restangular.all("/attend/print").customPOST(dataList);
    }

    function getIdocForPrint(data) {
      return Restangular.all("/doc/data/print").customPOST(data);
    }

    function getVitalsignsConfig() {
      return Restangular.all(vitalsignsConfig);
    }

    function getRealTimeVitalsigns(params) {
      return Restangular.one(rTVitalsigns).get(params);
    }

    function getInhosRecords(dept, params) {
      return Restangular.all('/Mnis/inhosRecords/' + dept).getList(params);
    }

    function getInhosRecordsByOrder(dept, params) {
      return Restangular.all('/Mnis/inhosRecords/page/' + dept).customGET('', params);
    }

    function getInhosRecordsFromEmr(dept, params) {
      return Restangular.all('/emr/ward/' + dept + '/inhos').getList(params);
    }

    function getInhosRecordsByTeamCode(wardCode) {
      return Restangular.all('/Mnis/inhosRecords/teamOnly').getList({
        wardCode: wardCode
      });
    }

    function getInhosRecordsById(pid, hid, params) {
      return Restangular.all('/Mnis/' + pid + '/inhos/' + hid).getList(params);
    }

    function getHisRecordsInSlot(dept, params) {
      return Restangular.all('/Mnis/inhosRecordsBetween/' + dept).getList(params);
    }

    function getHisRecords(params) {
      return Restangular.all('/emr/historyRecords').customGET('', params);
    }

    function getSurgeryRecords(wardCode, params) {
      return Restangular.all('/emr/surgeryPatRecords/' + wardCode).customGET('', params);
    }

    function getBedsList(dept, params) {
      return Restangular.one('/hospital/ward/', dept).all('inhosbeds').getList(params);
    }

    function createFocusBed(data) {
      var result = Restangular.one('/mnis/mnisBedStar/focusBed', undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      return _.assign(result, data).save();
    }

    function removeFocusBed(id) {
      return Restangular.one('/mnis/mnisBedStar/unfocusBed', id).remove();
    }

    function getFocusBeds(dept, user) {
      return Restangular.all('/mnis/mnisBedStar/' + dept + '/' + user).getList();
    }

    function getWardsHis(hid) {
      return Restangular.all('/emr/patHistoryWards/' + hid).getList();
    }

    function getMarkRows(hid, tplId) {
      return Restangular.one('/attend/', 'markRows').get({
        inhosCode: hid,
        tplId: tplId
      });
    }

    function getHisRecordsByKey(key) {
      return Restangular.all('/emr/historyInhosRecords').getList({
        searchKey: key
      });
    }

    function updateMarkRows(data) {
      return Restangular.all('/attend/markRows').customPOST(data);
    }

    function getRealTimeEvaluates(params) {
      return Restangular.all('/attend/realTimeEvaluateDatas').getList(params);
    }

    function getTransferInfo(inhosCode) {
      var defer = $q.defer();

      if (_.get(transferInfoData, [0, 'inhosCode']) === inhosCode) {
        defer.resolve(transferInfoData);
        return defer.promise;
      }

      return Restangular.one(transferInfo, inhosCode).getList().then(function (response) {
        transferInfoData = response;

        return transferInfoData;
      });
    }

    function getTransferByWard(params) {
      return Restangular.all('/emr/patTransferHistory').customGET('', params);
    }

    function getInOutStatData(queryParams) {
      return Restangular.all(inOutStatData).customGET('', queryParams);
    }

    function getDiagnosis(inhosCode) {
      // var defer = $q.defer();
      // if (_.get(diagnosisData, [0, 'inhosCode']) === inhosCode) {
      //   defer.resolve(diagnosisData);
      //   return defer.promise;
      // }

      return Restangular.all(patientEventUrl).customGET('', {
        inhosCode: inhosCode,
        event: 'diagnosis'
      }).then(function (response) {
        diagnosisData = response.queryResult;
        _.forEach(diagnosisData, function (item) {
          item.diagnosis = item.content;
        });

        return diagnosisData;
      });
    }

    function createDiagnosis(data) {
      return Restangular.all(diagnosis).customPOST(data);
    }

    function updateDiagnosis(diagnosisCode, data) {
      return Restangular.allUrl(diagnosis + '/' + diagnosisCode).customPUT(data).then(function (response) {
        var existIndex = _.findIndex(diagnosisData, {
          diagnosisCode: response.diagnosisCode
        });

        if (existIndex > -1) {
          diagnosisData[existIndex] = response.plain();
        }
      });
    }

    function deleteDiagnosis(diagnosisCode) {
      return Restangular.all(diagnosis).customDELETE('/' + diagnosisCode);
    }

    function getCustomColumns() {
      return Restangular.all(customColumns);
    }

    function syncInhosRecords(wardCode) {
      return Restangular.all(syncInhosRecordsPath).customPOST({
        wardCode: wardCode
      });
    }

    function updateAttendHeaders(headerList) {
      return Restangular.all('/attend/attendHeaders').customPOST(headerList);
    }

    function updateAttendDataList(dataList) {
      return Restangular.all('/attend/attendDataList').customPOST(dataList);
    }

    function patientPathEnter(data) {
      return Restangular.all(patientPathEnterUrl).customPOST(data);
    }

    function patientPathExit(data) {
      return Restangular.all(patientPathExitUrl).customPOST(data);
    }

    function getPatientPath(params) {
      return Restangular.all(getPatientPathUrl).customGET('', params);
    }

    function updatePatientPath(path) {
      return Restangular.all(getPatientPathUrl).customPUT(path);
    }

    function getPatientPathSummary(params) {
      return Restangular.all(getPatientPathUrl + '/summary').customGET('', params);
    }

    function patientPathNextNode(inhosCode, nodeDate) {
      return Restangular.all(getPatientPathUrl + '/nextNode?inhosCode=' + inhosCode + '&nodeDate=' + nodeDate).customPOST();
    }

    function patientPathNextDay(inhosCode, nodeDate) {
      return Restangular.all(getPatientPathUrl + '/nextDay?inhosCode=' + inhosCode + '&nodeDate=' + nodeDate).customPOST();
    }

    function getPatientPathNodeSingleDetail(params) {
      return Restangular.all(getPatientPathUrl + '/single/detail').customGET('', params);
    }

    function getPatientPathNodeDetail(params) {
      return Restangular.all(getPatientPathUrl + '/detail').customGET('', params);
    }

    function getHosUserShiftExt(params) {
      return Restangular.all(hosUserShiftExtUrl).customGET('', params);
    }

    function getPatientByInhosCode(params) {
      return Restangular.all(getPatientUrl).customGET('', params);
    }

    function executeNode(data) {
      return Restangular.all(getPatientPathUrl + '/node').customPOST(data);
    }

    function executeNodeBatch(data) {
      return Restangular.all(getPatientPathUrl + '/node/batch').customPOST(data);
    }

    function executeCancleNode(data) {
      return Restangular.all(getPatientPathUrl + '/node/cancel').customPOST(data);
    }

    function checkExecuteCancleNode(data) {
      return Restangular.all(getPatientPathUrl + '/node/cancel/check').customPOST(data);
    }

    function checkDeletePathNode(nodeId, inhosCode) {
      return Restangular.all(getPatientPathUrl + '/node/check/' + nodeId + '?inhosCode=' + inhosCode).customPOST();
    }

    function deletePathNode(nodeId, args) {
      return Restangular.all(getPatientPathUrl + '/node/' + nodeId).customDELETE("", args);
    }

    function recoverNode(data) {
      return Restangular.all(getPatientPathUrl + '/recover').customPOST(data);
    }

    function getPatientSurgery(inhosCode) {
      return Restangular.all('/emr/inhos/' + inhosCode + '/surgeries').customGET();
    }

    function getDeviceListByWardCode(wardCode) {
      return Restangular.all(getDeviceListUrl + "/" + wardCode).getList();
    }

    function getPatientListByWardCode(wardCode) {
      return Restangular.all(getPatInhosUnbindUrl + "/" + wardCode).getList();
    }

    function unbindDevice(seqId) {
      return Restangular.all(getDeviceListUrl + "/" + seqId).customPUT();
    }

    function bindDevice(data) {
      return Restangular.all(getDeviceListUrl + "/binding").customPUT(data);
    }

    function getDocumentExt(patCode, inhosCode) {
      return Restangular.all('/emr/' + patCode + '/inhos/' + inhosCode + '/emrdocuments').getList();
    }

    function getHandoverItemCount(params) {
      return Restangular.all(getWardoverUrl + '/count').customGET('', params);
    }

    function getHandoverList(params) {
      return Restangular.all(getWardoverUrl).customGET('', params);
    }

    function updateHandover(data) {
      return Restangular.all(getWardoverUrl).customPOST(data);
    }
  }
})();
