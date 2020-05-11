(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('pagination', pagination);

  /** @ngInject */
  function pagination() {
    var directive = {
      restrict: 'E',
      scope: {
        total: "=",
        currentPage: '=',
        itemsByPage: '=',
        showingPagesSize: '=',
        onPageChange: '='
      },
      templateUrl: 'common/components/pagination/pagination.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, element, attrs, ctrl) {
      redraw();

      scope.selectPage = function (page) {
        scope.currentPage = page;
        scope.onPageChange(page);
        redraw();
      }

      scope.$watchGroup(['total', 'currentPage', 'itemsByPage', 'showingPagesSize'], redraw);

      function redraw () {
        var showingPagesSize = scope.showingPagesSize - 0;
        var currentPage = scope.currentPage - 0;
        var itemsByPage = scope.itemsByPage - 0;
        var total = scope.total - 0;
        var numPages = scope.numPages = Math.ceil(total / itemsByPage);
        var startPage = scope.startPage = _.max([
          _.min([numPages - showingPagesSize + 1, currentPage - Math.floor(showingPagesSize / 2)]),
          1
        ]);
        var endPage = _.min([
          startPage + showingPagesSize,
          numPages
        ])
        var pages = scope.pages = _.range(startPage, endPage + 1);
      }

      // scope.stItemsByPage = scope.stItemsByPage ? +(scope.stItemsByPage) : stConfig.pagination.itemsByPage;
      // scope.stDisplayedPages = scope.stDisplayedPages ? +(scope.stDisplayedPages) : stConfig.pagination.displayedPages;

      // scope.currentPage = 1;
      // scope.pages = [];

      // function redraw () {
      //   var paginationState = scope.paginationConfig;
      //   var start = 1;
      //   var end;
      //   var i;
      //   var prevPage = scope.currentPage;
      //   scope.totalItemCount = paginationState.totalItemCount;
      //   scope.currentPage = Math.floor(paginationState.start / paginationState.number) + 1;

      //   start = Math.max(start, scope.currentPage - Math.abs(Math.floor(scope.stDisplayedPages / 2)));
      //   end = start + scope.stDisplayedPages;

      //   if (end > paginationState.numberOfPages) {
      //     end = paginationState.numberOfPages + 1;
      //     start = Math.max(1, end - scope.stDisplayedPages);
      //   }

      //   scope.pages = [];
      //   scope.numPages = paginationState.numberOfPages;

      //   for (i = start; i < end; i++) {
      //     scope.pages.push(i);
      //   }

      //   if (prevPage !== scope.currentPage) {
      //     scope.stPageChange({newPage: scope.currentPage});
      //   }
      // }

      // //table state --> view
      // scope.$watch(function () {
      //   return ctrl.tableState().pagination;
      // }, redraw, true);

      // //scope --> table state  (--> view)
      // scope.$watch('stItemsByPage', function (newValue, oldValue) {
      //   if (newValue !== oldValue) {
      //     scope.selectPage(1);
      //   }
      // });

      // scope.$watch('stDisplayedPages', redraw);

      // //view -> table state
      // scope.selectPage = function (page) {
      //   if (page > 0 && page <= scope.numPages) {
      //     ctrl.slice((page - 1) * scope.stItemsByPage, scope.stItemsByPage);
      //   }
      // };

      // if (!ctrl.tableState().pagination.number) {
      //   ctrl.slice(0, scope.stItemsByPage);
      // }
    }
  }

})();
