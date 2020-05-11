(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('commonNav', nav);

  /** @ngInject */
  function nav($state, $document, authHelperService, utilService, _) {
    var directive = {
      restrict: 'E',
      templateUrl: 'common/components/nav/side/nav.tpl.html',
      scope: true,
      replace: true,
      link: linkFunc
    };

    return directive;

    /** @ngInject */
    function linkFunc(scope) {
      scope.toggleNavMode = toggleNavMode;
      scope.navFilter = navFilter;
      activate();

      function navFilter(item) {
        return !!(item.subResource && item.subResource.length);
      }

      function toggleNavMode() {
        scope.minMode = !scope.minMode;
        angular.element($document[0].body).toggleClass('min-mode');
      }

      function activate() {
        scope.navs = getNavs();
        calcCurrent();
        var links = getLinks();
        if($state.current.name === 'main' && links.length) {
          $state.go('main.' + links[0].resourceContent, undefined, {
            location: 'replace'
          });
        }
        scope.$on('$stateChangeSuccess', calcCurrent);
      }

      function getNavs() {
        var appsTree = authHelperService.getAppsTree();
        var resource = utilService.getParams('resource');
        return  _.findWhere(appsTree, {
          resourceCode: resource
        }).subResource;
      }

      function getLinks() {
        var navs = angular.copy(scope.navs);
        var links = [];
        _.forEach(navs, function(item) {
          links.push(item);
          links.push(item.subResource);
        });
        return _.chain(links).compact().flatten().filter('resourceContent').value();
      }

      function calcCurrent() {
        //刷新后打开当前页面的父菜单
        var current = $state.current.name.split('.')[1];
        var match = _.find(scope.navs, function(item) {
          return _.findWhere(item.subResource, {
            resourceContent: current
          });
        });
        _.each(scope.navs, function(item) {
          item.isCurrent = false;
        });
        if(match) {
          match.isOpen = true;
          match.isCurrent = true;
        }
      }

    }
  }

})();
