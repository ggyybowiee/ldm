(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('hospitalRest', hospitalRest);

  /** @ngInject */
  function hospitalRest(Restangular) {
    var doctor = '/hospital/users';
    var nurse = '/hospital/nurses';
    var hosUsers = '/hospital/hosUser';
    var ward = '/hospital/wards';
    var building = '/hospital/buildings';
    var current = '/hospital/hosInfo/current';
    var hosSignData = '/hospital/hosUserDataSign';
    var uploadSign = '/hospital/hosUserDataSign/upload';

    var service = {
      getDoctors: getDoctors,
      getNurses: getNurses,
      getHosUsers: getHosUsers,
      updateHosUser: updateHosUser,
      getHosSign: getHosSign,
      uploadSignPicture: uploadSignPicture,
      updateHosUserByHisCode: updateHosUserByHisCode,
      getWards: getWards,
      getUsersByWard: getUsersByWard,
      getBuildings: getBuildings,
      getTiers: getTiers,
      setTiers: setTiers,
      getBeds: getBeds,
      getRooms: getRooms,
      getCurrent: getCurrent
    };

    return service;

    function getDoctors(params) {
      return Restangular.all(doctor).getList(params);
    }

    function getHosUsers(params) {
      return Restangular.all(hosUsers).customGET('', params);
    }

    function getHosSign() {
      return Restangular.all(hosSignData);
    }

    function uploadSignPicture() {
      return Restangular.all(uploadSign);
    }

    function updateHosUser(data) {
      return Restangular.one(hosUsers).customPUT(data);
    }

    function updateHosUserByHisCode(hisCode, data) {
      return Restangular.one(hosUsers, hisCode).customPUT(data);
    }

    function getWards(params) {
      return Restangular.all(ward).getList(params);
    }

    function getNurses(params) {
      return Restangular.all(nurse).getList(params);
    }

    function getUsersByWard(wardCode, params) {
      return Restangular.one('/hospital/ward', wardCode).all('users').getList(params);
    }

    function getBeds(wardCode, params) {
      return Restangular.one('/hospital/ward', wardCode).all('inhosbeds').getList(params);
    }

    function getRooms(wardCode, params) {
      return Restangular.one('/hospital/ward', wardCode).all('roomCodes').getList(params);
    }

    function getBuildings() {
      return Restangular.all(building);
    }

    function getTiers(buildingCode) {
      return Restangular.one(building, buildingCode).all('tiers');
    }

    function setTiers(query, image) {
      return Restangular.one('/hospital/tiers?buildingCode=' + query.buildingCode + '&tierCode=' + query.tierCode).customPOST(image, undefined, undefined, {
        'Content-Type': undefined
      });
    }

    function getCurrent() {
      return Restangular.one(current).get();
    }
  }
})();
