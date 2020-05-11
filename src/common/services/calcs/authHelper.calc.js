(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('authHelperService', authHelperService);

  /** @ngInject */
  function authHelperService($rootScope, $filter, sessionService, _) {
    var service = {
      getApps: getApps,
      getOutApps: getOutApps,
      getInApps: getInApps,
      getAppsTree: getAppsTree,
      getResourcesTree: getResourcesTree,
      goApp: goApp
    };

    return service;

    //应用列表
    function getApps(resource, authFlag) {
      var ress = resource || angular.copy(sessionService.getResources());
      var auths = sessionService.getAuths();
      return _.filter(ress, function (item) {
        if (authFlag) {
          return item.resourceType === '2' && _.findWhere(auths, {
            resourceCode: item.resourceCode,
            relation: '1'
          });
        } else {
          return item.resourceType === '2';
        }
      });
    }

    //外部应用列表
    function getOutApps(resource, authFlag) {
      var apps = getApps(resource, authFlag);
      return _.filter(apps, function (item) {
        return item.isOut == '1';
      });
    }

    //内部应用列表
    function getInApps(resource, authFlag) {
      var apps = getApps(resource, authFlag);
      return _.filter(apps, function (item) {
        return !+item.isOut;
      });
    }

    //用于导航栏，过滤掉实体资源并进行权限过滤
    function getAppsTree(resource) {

      var ress = resource || angular.copy(sessionService.getResources());
      var auths = sessionService.getAuths();
      var appResources = _.filter(ress, function (item) {
        return (item.resourceType === '0' || item.resourceType === '2') && _.findWhere(auths, {
          resourceCode: item.resourceCode,
          relation: '1'
        });
      });
      appResources = $filter('orderBy')(appResources, ['parentResourceCode', 'sortNo']);

      _.forEach(appResources, function (item) {
        if (!item.parentResourceCode) return;
        var match = _.findWhere(appResources, {
          resourceCode: item.parentResourceCode
        });
        if (match) {
          match.subResource || (match.subResource = []);
          match.subResource.push(item);
        }
      });
      return _.filter(appResources, function (item) {
        return item.resourceType === '2';
      });
    }

    //用于权限分配的树结构
    function getResourcesTree(resource) {
      var ress = resource || angular.copy(sessionService.getResources());
      _.forEach(ress, function (item) {
        if (!item.parentResourceCode) return;
        var match = _.findWhere(ress, {
          resourceCode: item.parentResourceCode
        });
        if (match) {
          match.subResource || (match.subResource = []);
          match.subResource.push(item);
        }
      });
      return _.filter(ress, function (item) {
        return !item.parentResourceCode;
      });
    }

    function goApp(app) {
      var key = _.find(sessionService.getKeys(), {
        resourceCode: app.resourceCode
      });
      if (app.isOut == 2) {
        //其他
        window.open(app.resourceContent, '_blank');
      } else if (app.isOut == 1) {
        //外部系统
        if (key) {
          window.open(app.resourceContent + '?account=' + key.useCodeOut + '&password=' + key.usePwdOut, '_blank');
        } else {
          $rootScope.$emit('toast', {
            type: 'error',
            content: '外部系统没有绑定账号'
          });
        }
      } else {
        location.href = app.resourceContent + '?resource=' + app.resourceCode;
      }
    }
  }
})();
