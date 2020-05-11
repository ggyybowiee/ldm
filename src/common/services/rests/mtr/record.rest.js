(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('recordRest', recordRest);

  /** @ngInject */
  function recordRest(Restangular, moment) {
    var record = 'inhos';
    var surgery = 'surgeries';
    var service = {
      patInfo: null,
      getRecordsByDept: getRecordsByDept,
      getRecordsByUser: getRecordsByUser,
      getSurgeriesByDept: getSurgeriesByDept,
      getSurgeriesByUser: getSurgeriesByUser,
      getRecordsByPid: getRecordsByPid,
      getRecordsByHid: getRecordsByHid,
      getRecordBrief: getRecordBrief,
      getClinicsByPid: getClinicsByPid,
      getOrdersByHid: getOrdersByHid,
      getLabReportsByPid: getLabReportsByPid,
      getLabReportResult: getLabReportResult,
      getLabReportCompares: getLabReportCompares,
      getExamReportsByPid: getExamReportsByPid,
      getLabExamResult: getLabExamResult,
      getExamDicom: getExamDicom,
      getBloodByHid: getBloodByHid,
      getSurgeriesByHid: getSurgeriesByHid,
      getTopicsByHid: getTopicsByHid,
      createTopic: createTopic,
      getDocumentByHid: getDocumentByHid,
      getDrugByPid: getDrugByPid,
      getTimelineByHid: getTimelineByHid,
      getAdvisesByHid: getAdvisesByHid,
      getStatitics: getStatitics,
      // 修改的接口
      getPatientsByWard: getPatientsByWard,
      getCommonDrugByPid: getCommonDrugByPid,
      getShareStatus: getShareStatus
    };

    return service;

    function getRecordsByDept(deptCode, params) {
      return Restangular.one('/emr/dept', deptCode).all(record).getList(params);
    }

    function getPatientsByWard(wardCode, params) {
      return Restangular.one('/emr/ward', wardCode).all(record).getList(params);
    }

    function getRecordsByUser(userCode, params) {
      return Restangular.one('/emr/hos_user', userCode).all(record).getList(params);
    }

    function getSurgeriesByDept(deptCode, params) {
      return Restangular.one('/emr/dept', deptCode).all(surgery).getList(params);
    }

    function getSurgeriesByUser(userCode, params) {
      return Restangular.one('/emr/user', userCode).all('patIncharge/' + surgery).getList(params);
    }

    function getRecordsByPid(patId) {
      return Restangular.one('emr', patId).all('inhoss').getList();
    }

    function getRecordsByHid(patId, inHosId) {
      return Restangular.one('emr', patId).one('inhos', inHosId).get().then(function (response) {
        service.patInfo = response.plain();
        return response;
      });
    }

    function getPatInfo(patId) {
      return Restangular.one('emr', patId).get();
    }

    function getRecordBrief(patId, inHosId) {
      return Restangular.one('/mtr/emr', patId).one('inhos', inHosId).one('brief').get();
    }

    function getClinicsByPid(patId) {
      return Restangular.one('emr', patId).all('clinics').getList();
    }

    function getOrdersByHid(patId, inHosId) {
      return Restangular.one('/emr', patId).one('inhos', inHosId).all('orders').getList();
    }

    function getLabReportsByPid(patId) {
      return Restangular.one('emr', '{pid}').all('labmaster').getList({
        patientCode: patId
      });
    }

    function getLabReportResult(testCode) {
      return Restangular.one('/emr/labreports', testCode).get();
    }

    function getLabReportCompares(testCode) {
      return Restangular.one('/emr/labreports/' + testCode, 'compares').customPOST();
    }

    function getExamReportsByPid(patId) {
      return Restangular.one('emr', patId).all('examinations').getList();
    }

    function getLabExamResult(examCode) {
      return Restangular.one('/emr/examination/' + examCode, 'report').get();
    }

    function getExamDicom(examCode) {
      return Restangular.one('/emr/examination/{examCode}', 'dicom').get({
        examCode: examCode
      });
    }

    function getBloodByHid(patId, inHosId) {
      return Restangular.one('/emr', patId).one('inhos', inHosId).all('bloodTransfusions').getList();
    }

    function getSurgeriesByHid(patId, inHosId) {
      return Restangular.one('/emr/inhos', inHosId).all('surgeries').getList();
    }

    function getTopicsByHid(patId, inHosId) {
      return Restangular.one('/mtr/emr', patId).one('inhos', inHosId).all('topics').getList();
    }

    function createTopic(patId, inHosId, data) {
      data.inhosCode = inHosId;
      data.patCode = patId;
      data.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.createPerson = 'test';
      data.updatePerson = 'test';
      return Restangular.one('mtr/emr', patId).one('inhos', inHosId).all('topic').customPOST(data);
    }

    function getDocumentByHid(patId, inHosId) {
      return Restangular.one('/emr', patId).one('inhos', inHosId).all('emrdocuments').getList();
    }

    function getDrugByPid(patId) {
      return Restangular.one('emr', '{pid}').all('drugPrescriptions').getList({
        pid: patId
      })
    }

    function getCommonDrugByPid(patId) {
      return Restangular.one('emr', patId).all('commonDrugPrescriptions').getList();
    }

    function getTimelineByHid(patId, inHosId) {
      return Restangular.one('/mtr/emr', patId).one('inhos', inHosId).all('timelines').getList();
    }

    function getStatitics(userCode) {
      return Restangular.one('mtr/statictics', userCode).get();
    }

    function getAdvisesByHid(patId, inHosId) {
      return Restangular.one('/mtr/emr/emr', patId).one('inhos/' + inHosId, 'simliarSearch').customPOST();
    }

    function getShareStatus(id) {
      return Restangular.one('/mtr/shareScreenQrCode', '{shareScreenQrCode}').get({
        shareScreenQrCode: id
      });
    }
  }
})();
