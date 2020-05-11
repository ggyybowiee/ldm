(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('userShiftRest', userShiftRest);

  /** @ngInject */
  function userShiftRest(Restangular) {

    var service = {
      getUserDuty: getUserDuty,
      addUserDuty: addUserDuty,
      updateUserDuty: updateUserDuty,
      deleteUserDuty: deleteUserDuty,


      getUserGroup: getUserGroup,
      addUserGroup: addUserGroup,
      updateUserGroup: updateUserGroup,
      deleteUserGroup: deleteUserGroup
    };

    function getUserDuty(args) {
      return Restangular.all('/hospital/hosUserShiftExt').getList(args);
    }

    function addUserDuty(obj) {
      return Restangular.all('/hospital/hosUserShiftExt').customPOST(obj);
    }

    function updateUserDuty(obj) {
      return Restangular.all('/hospital/hosUserShiftExt').customPUT(obj);
    }

    function deleteUserDuty(seqID, args) {
      return Restangular.all('/hospital/hosUserShiftExt/' + seqID).customDELETE("", args);
    }



    function getUserGroup(args) {
      return Restangular.all('/hospital/hosUserShift').customGET('', args);
    }

    function addUserGroup(obj) {
      return Restangular.all('/hospital/hosUserShift').customPOST(obj);
    }

    function updateUserGroup(obj) {
      return Restangular.all('/hospital/hosUserShift').customPUT(obj);
    }

    function deleteUserGroup(seqID, args) {
      return Restangular.all('/hospital/hosUserShift/' + seqID).customDELETE("", args);
    }

    return service;
  }
})();
