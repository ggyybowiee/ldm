(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('userService', userService);

  /** @ngInject */
  function userService(Restangular, moment) {
    var user = '/authentication/users';
    var updateUserUrl = '/hospital/hosUser';
    var sysUserUrl = '/authentication/sysUser';
    var sysUserExtUrl = '/authentication/sysUserExt';
    var userRole = '/authentication/userRoleMappings';
    var userKey = '/authentication/userResourceMappings';
    var userPwd = '/authentication/passwordCorrect';
    var service = {
      getUser: getUser,
      getUsers: getUsers,
      getSysUsers: getSysUsers,
      createUser: createUser,
      getUserRole: getUserRole,
      createUserRole: createUserRole,
      saveUserRole: saveUserRole,
      removeUserRole: removeUserRole,
      getUserAppKey: getUserAppKey,
      createUserAppKey: createUserAppKey,
      saveUserAppKey: saveUserAppKey,
      removeUserAppKey: removeUserAppKey,
      checkPwd: checkPwd,
      updateUser: updateUser,
      updateUserPassword: updateUserPassword,
      getSysUserRole: getSysUserRole,
      patchUser: patchUser,

      getHosUserDataSign: getHosUserDataSign,
      addHosUserDataSign: addHosUserDataSign,
      removeHosUserDataSign: removeHosUserDataSign
    };

    return service;

    function getUser(userCode) {
      return Restangular.one(user, userCode).get();
    }

    function getUsers() {
      return Restangular.all(user).getList();
    }

    function getSysUsers(params) {
      return Restangular.all(sysUserExtUrl).customGET('', params);
    }

    function createUser() {
      var result = Restangular.one(user, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return result;
    }

    function updateUser(data) {
      return Restangular.one(updateUserUrl, data.hisCode).customPUT(data);
    }

    function patchUser(data) {
      return Restangular.one(updateUserUrl).customPATCH(data);
    }

    function updateUserPassword(data) {
      return Restangular.one(user, data.userCode).customPUT(data);
    }

    function getUserRole(userCode) {
      return Restangular.one(user, userCode).all('userRoleMappings').getList();
    }

    function createUserRole(user, role) {
      var result = Restangular.one(userRole, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      result.userCode = user;
      result.roleCode = role;
      return result;
    }

    function saveUserRole(data) {
      var id = Restangular.configuration.getIdFromElem(data);
      if (id) {
        return Restangular.allUrl(userRole + '/' + id).customPUT(data.plain());
      } else {
        return data.save();
      }
    }

    function removeUserRole(id) {
      return Restangular.allUrl(userRole + '/' + id).customDELETE();
    }

    function getUserAppKey(userCode) {
      return Restangular.one(user, userCode).all('userResourceMappings').getList();
    }

    function createUserAppKey(userCode, resourceCode) {
      var result = Restangular.one(userKey, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      result.userCodeLocal = userCode;
      result.resourceCode = resourceCode;
      return result;
    }

    function saveUserAppKey(data) {
      var id = Restangular.configuration.getIdFromElem(data);
      if (id) {
        return Restangular.allUrl(userKey + '/' + id).customPUT(data.plain());
      } else {
        return data.save();
      }
    }

    function removeUserAppKey(id) {
      return Restangular.allUrl(userKey + '/' + id).customDELETE();
    }

    function checkPwd(params) {
      return Restangular.one(userPwd).get(params);
    }

    function getSysUserRole(roleCode, params) {
      return Restangular.all(sysUserUrl).customGET(roleCode, params);
    }


    function getHosUserDataSign(params) {
      return Restangular.all('hospital/hosUserDataSign').customGET("", params);
    }

    function addHosUserDataSign(signData, hosUserCode) {
      return Restangular.all('hospital/hosUserDataSign/upload').customPOST({
        nurseId: hosUserCode,
        baseSignData: signData
      })
    }

    function removeHosUserDataSign(userDataSign) {
      return Restangular.allUrl('hospital/hosUserDataSign' + '/' + userDataSign.seqId).customDELETE();
    }

  }
})();
