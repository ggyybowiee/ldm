(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('mockTabset', mockTabset);
  /** @ngInject */
  function mockTabset() {
    var directive = {
      link: linkFunc,
      scope: false
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.tabset = {
        index: 0
      };
      refresh();
      el.on('click', '.mock-tab-head', function() {
        scope.tabset.index = $(this).index();
        refresh();
      });

      function refresh() {
        el.find('.mock-tab').hide().eq(scope.tabset.index).show();
        el.find('.mock-tab-head').removeClass('active').eq(scope.tabset.index).addClass('active');
      }
    }
  }
})();