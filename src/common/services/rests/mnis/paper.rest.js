(function() {
  "use strict";

  angular.module("lachesis-common").factory("paperRest", paperRest);

  /** @ngInject */
  function paperRest(Restangular) {
    var service = {
      getOrderPaper: getOrderPaper,
      getWardTour: getWardTour,
      getTransTour: getTransTour,
      getTransColumns: getTransColumns,
      getTrans: getTrans,
      getTransStat: getTransStat,
      getSkinTest: getSkinTest,
      getSkinTestStat: getSkinTestStat,
      postPrint: postPrint,
      putRemark: putRemark
    };

    return service;
    function getOrderPaper(params) {
      return Restangular.all("/mnis/execSheets").getList(params);
    }

    function getWardTour(params) {
      return Restangular.all("/mnis/NursePatrols").getList(params);
    }

    function getTransTour(params) {
      return Restangular.all("/mnis/infusionsInfo").getList(params);
    }

    function getTransColumns() {
      return Restangular.all('/mnis/dispense/taskNodes').getList();
    }

    function getTrans(params) {
      return Restangular.all('/mnis/dispense/orderStats/detail').getList(params);
    }

    function getTransStat(params) {
      return Restangular.one('/mnis/dispense/orderStats/count/order').get(params);
    }

    function getSkinTest(params) {
      return Restangular.one('/mnis/MnisSkinTests').get(params);
    }

    function getSkinTestStat(params) {
      return Restangular.one('/mnis/CountMnisSkinTests').get(params);
    }

    function postPrint(arr) {
      return Restangular.one('/mnis/execSheets').customPOST(arr);
    }

    function putRemark(data) {
      return Restangular.one('/mnis/execSheets', data.groupUniqueCode).customPUT(data);
    }
  }
})();
