(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('roleService', roleService);

  /** @ngInject */
  function roleService(Restangular, moment) {
    var role = '/authentication/roles';
    var resource = '/authentication/resources';
    var roleResource = '/authentication/roleResourceMappings';
    var resourceDic = {
      'Module': '0',
      //REACT: 2
      'Router': '1',
      //REACT: 0
      'App': '2'
      //REACT: 1
    };
    var service = {
      getRoles: getRoles,
      createRole: createRole,
      getResources: getResources,
      createResourceInstance: createResourceInstance,
      createResource: createResource,
      saveResource: saveResource,
      saveResources: saveResources,
      deleteResource: deleteResource,
      getRoleResources: getRoleResources,
      getRoleResourcesVM: getRoleResourcesVM,
      createRoleResource: createRoleResource,
      saveRoleResource: saveRoleResource,
      resourceDic: resourceDic,

      // 资源内元素
      getResourceElement: getResourceElement,
      addResourceElement: addResourceElement,
      updateResourceElement: updateResourceElement,
      removeResourceElement: removeResourceElement,

      // 资源内元素
      getResourceRoleElementMapping: getResourceRoleElementMapping,
      addResourceRoleElementMapping: addResourceRoleElementMapping,
      updateResourceRoleElementMapping: updateResourceRoleElementMapping,
      removeResourceRoleElementMapping: removeResourceRoleElementMapping,


      dic: {
        resourceType: [{
            value: resourceDic['Module'],
            text: '模块资源'
          },
          {
            value: resourceDic['Router'],
            text: '路由资源(React)'
          },
          {
            value: resourceDic['App'],
            text: '应用资源'
          }
        ],
        appType: [{
            value: 0,
            text: '业务类应用'
          },
          {
            value: 1,
            text: '设备管理'
          },
          {
            value: 2,
            text: '系统配置应用'
          }
        ],
        positionType: [{
            value: 0,
            text: '内部系统'
          },
          {
            value: 1,
            text: '外部系统'
          },
          {
            value: 2,
            text: '其他'
          }
        ]
      }
    };

    return service;

    function getRoles() {
      return Restangular.all(role).getList();
    }

    function createRole() {
      var result = Restangular.one(role, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return result;
    }

    function getResources() {
      return Restangular.all(resource).getList();
    }

    function saveResource(resourceInstance) {
      return Restangular.one(resource).customPUT(resourceInstance, resourceInstance.resourceCode);
    }

    function saveResources(resourcesArray) {
      return Restangular.all(resource).customPUT(resourcesArray);
    }

    function deleteResource(resourceInstance) {
      return Restangular.one(resource).customDELETE(resourceInstance.resourceCode);
    }

    function createResource(resourceInstance) {
      return Restangular.all(resource).customPOST(resourceInstance);
    }

    function createResourceInstance() {
      var result = Restangular.one(resource, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.resourceType = '0';
      return result;
    }

    function getRoleResources(roleCode) {
      return Restangular.one(role, roleCode).all('roleResourceMappings').getList();
    }

    function getRoleResourcesVM(roleCode) {
      return Restangular.all('authentication/sysRole').customGET("", {
        roleCode: roleCode
      });
    }

    function createRoleResource(roleResourceMapping) {
      return Restangular.one(roleResource).customPOST(roleResourceMapping);
    }

    function saveRoleResource(roleResourceMapping) {
      return Restangular.one(roleResource).customPUT(roleResourceMapping, roleResourceMapping.seqId);
    }


    function getResourceElement(resourceCode) {
      return Restangular.all("/authentication/SysElement").customGET("", {
        'resourceCode': resourceCode
      })
    }

    function addResourceElement(element) {
      return Restangular.one("/authentication/SysElement").customPOST(element);
    }

    function updateResourceElement(element) {
      return Restangular.one("/authentication/SysElement").customPUT(element);
    }

    function removeResourceElement(element) {
      return Restangular.one("/authentication/SysElement").customDELETE(element.seqId);
    }

    function getResourceRoleElementMapping(roleCode, resourceCode) {
      return Restangular.one("/authentication/SysRoleElementMapping").customGET("", {
        'resourceCode': resourceCode,
        'roleCode': roleCode
      })
    }

    function addResourceRoleElementMapping(roleElementMapping) {
      return Restangular.one("/authentication/SysRoleElementMapping").customPOST(roleElementMapping);

    }

    function updateResourceRoleElementMapping(roleElementMapping) {
      return Restangular.one("/authentication/SysRoleElementMapping").customPUT(roleElementMapping);

    }

    function removeResourceRoleElementMapping(roleElementMapping) {
      return Restangular.one("/authentication/SysRoleElementMapping").customDELETE(roleElementMapping.seqId);

    }
  }
})();
