(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('authenticationUtil', authenticationUtil);

  /** @ngInject */
  function authenticationUtil() {

    var service = {

      getAppResourceTree: getAppResourceTree
    }


    // 获取应用资源树
    function getAppResourceTree(appResource, allResource) {

      var resourceApp = _.cloneDeep(appResource);
      var expandedNode = [];
      createAppResourceTree(resourceApp, expandedNode, 1, allResource);

      return {
        appResourceTree: [resourceApp],
        appResourceTreeExpandedNode: expandedNode
      }
    }

    // 创建资源树
    function createAppResourceTree(resourceNode, expandedNode, nodeLevel, allResource) {

      var childrenResource = _.filter(allResource, {
        'parentResourceCode': resourceNode.resourceCode
      });
      resourceNode.children = _.cloneDeep(childrenResource);
      resourceNode.nodeLevel = nodeLevel;
      if (childrenResource.length > 0)
        expandedNode.push(resourceNode);

      _.forEach(resourceNode.children, function (item) {
        item.parentNode = resourceNode;
        createAppResourceTree(item, expandedNode, nodeLevel + 1, allResource);
      })
    }


    return service;
  }
})();
