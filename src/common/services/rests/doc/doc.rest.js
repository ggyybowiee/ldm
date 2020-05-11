(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('docRest', docRest);

  /** @ngInject */
  function docRest(Restangular) {
    var doc = 'doc/tpl', docData = 'doc/data';
    var caInfo = 'doc/userCAInfo';
    var service = {
      getDocs: getDocs,
      delDoc: delDoc,
      editDoc: editDoc,
      addData: addData,
      getData: getData,
      delData: delData,
      getDocResource: getDocResource,
      getAllIdocData: getAllIdocData,
      bindCa: bindCa,
      getCa: getCa,
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
        }]
    };

    return service;

    function getDocResource() {
      return Restangular.all(doc);
    }

    function getDocs(params) {
      return Restangular.all(doc).getList(params);
    }

    function delDoc(id) {
      return Restangular.one(doc, id).remove();
    }

    function editDoc(data) {
      return Restangular.all(doc).customPUT(data);
    }

    function addData(data) {
      return Restangular.all(docData).customPOST(data);
    }

    function delData(dataId) {
      return Restangular.all(docData).customDELETE(dataId);
    }

    function getData(params) {
      return Restangular.all(docData + '/forMnis').getList(params);
    }

    function getAllIdocData(params) {
      return Restangular.all(docData).getList(params);
    }

    function bindCa(data) {
      return Restangular.all(caInfo).customPOST(data);
    }

    function getCa(userCode) {
      return Restangular.all(caInfo).customGET('', { userCode: userCode });
    }
  }
})();
