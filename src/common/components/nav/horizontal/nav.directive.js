(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('horizontalNav', nav);

  /** @ngInject */
  function nav($state, authHelperService, utilService, _, $timeout) {
    var directive = {
      restrict: 'E',
      scope: {
        theme: '@'
      },
      templateUrl: 'common/components/nav/horizontal/nav.tpl.html',
      replace: true,
      link: linkFunc,
      transclude: true
    };

    return directive;

    /** @ngInject */
    function linkFunc(scope, element, attrs, ctr, transclude) {
      activate();
      scope.transcludeElem = transclude();
      element.find('#breadcrumbPlaceholder').replaceWith(scope.transcludeElem);

      function activate() {
        scope.navs = getNavs();
        var links = getLinks();
        if ($state.current.name === 'main' && links.length) {
          $state.go('main.' + links[0].resourceContent, undefined, {
            location: 'replace'
          });
        }
      }

      function getNavs() {
        var appsTree = authHelperService.getAppsTree();
        var resource = utilService.getParams('resource');
        return _.findWhere(appsTree, {
          resourceCode: resource
        }).subResource;
      }

      function getLinks() {
        var navs = angular.copy(scope.navs);
        var links = [];
        _.forEach(navs, function (item) {
          item.isOpen = true;
          links.push(item);
          links.push(item.subResource);
        });
        return _.chain(links).compact().flatten().filter('resourceContent').value();
      }

      // 鼠标状态
      scope.mouseLeave = function (item) {
        // item.isOpen = false;
      }

      scope.mouseEnter = function (item) {
        // item.isOpen = true;
      }
    }
  }

})();
