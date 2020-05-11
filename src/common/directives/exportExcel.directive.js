(function() {
  'use strict';

  angular.module('lachesis-common')
  .directive('exportExcel', exportExcel)

  .directive('exportExcelBtn', exportExcelBtn);

  function exportExcel(moment) {
    return {
      scope: {
        exportExcel: '@'
      },
      link: function(scope, element) {
        scope.$on('exportExcel', function () {
          var text = element.html()
          .replace(/ng\-repeat="(\s*\w*\s*\.*)*"/g, '')
          .replace(/class="ng-scope"/g, '')
          .replace(/class="ng\-binding"/g, '')
          .replace(/style=""/g, '')
          .replace(/<tbody>/g, '')
          .replace(/<\/tbody>/g, '')
          .replace(/<!\-\- (\s*\w*\s*\.*\:*)* \-\->/g, '')
          .replace(/\s+([^border])/g, '$1');

          var a = document.createElement('a');
          var data_type = 'data:application/vnd.ms-excel';
          a.href = data_type + ', ' + text;
          a.download = (scope.exportExcel || '未命名文件') + '-' + moment().format('YYYY_MM_DD_HH_mm_ss') + '.xls';

          a.click();
        });

      }
    };
  }

  function exportExcelBtn($rootScope) {
    return {
      link: function(scope, element) {
        element.bind('click', function () {
          $rootScope.$broadcast('exportExcel')
        })
      }
    };
  }
})();
