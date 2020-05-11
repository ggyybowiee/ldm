(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('dropDownNav', nav);

  /** @ngInject */
  function nav($state, authHelperService, utilService, _) {
    var directive = {
      restrict: 'E',
      templateUrl: 'common/components/nav/dropdown/nav.tpl.html',
      scope: true,
      replace: true,
      link: linkFunc,
      transclude: true
    };

    return directive;

    /** @ngInject */
    function linkFunc(scope, element, attrs, ctr, transclude) {
      activate();
      element.find('#breadcrumbPlaceholder').replaceWith(transclude());
      function activate() {
        scope.navs = getNavs();
        var links = getLinks();
        if($state.current.name === 'main' && links.length) {
          if (links[0].resourceContent[0] === '/') {
            location.href = links[0].resourceContent;
          } else {
            $state.go('main.' + links[0].resourceContent, undefined, {
              location: 'replace'
            });
          }
        }
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
    }
  }

})();
