(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('getDoc', getDoc);

  /** @ngInject */
  function getDoc($http,Restangular) {
    var getDoc = "/hospital/hosUserWard/ward";
    var getMac = "/ibis/ibisDoorDocterMapping/doors";
    var getMianDoc = "/ibis/ibisDoorDocterMapping";
    var directDoctor = "ibis/wardDoctorMapping/directors"

    var service = {
      getDoc: getDocFuc,
      getMac: getMacFuc,
      getMianDoc: getMianDocFuc,
      getDirectDoctor:getDirectDoctorFuc
    };
    return service;


    function getDocFuc(data) {
      return Restangular.one(getDoc,data).get();
    }

    function getMacFuc(data){
      var data = {
        wardCode:data
      }
      return Restangular.all(getMac).getList(data);
    }

    function getMianDocFuc(data){
      return Restangular.one(getMianDoc,data).get();
    }

    function getDirectDoctorFuc(data){
      return Restangular.one(directDoctor+'?wardCode='+data).get();
    }

  }
})();