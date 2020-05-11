(function() {
  'use strict';

  angular.module('lachesis-mnis').factory('estimateUtil', estimateUtil);

  /** @ngInject */
  function estimateUtil(_) {
    var PAPER_RATIO = 2.8238;
    var service = {
      getTableHeader: getTableHeader,
      mmToPt: mmToPt,
      getPageSize: getPageSize
    };

    function getTableHeader(tables, isGetRow) {
      if (!tables) {
        return;
      }
      return tables.map(function(item) {
        if (isGetRow) {
          item.row = getRowData(item.tableHeader);
        }

        return {
          row: item.row,
          rowCount: item.rowCount,
          tableHeader: parseColumn(item.tableHeader)
        };
      });
    }

    function parseColumn(tableHeader) {
      var firstTier = tableHeader;
      var secondTier = _.flatten(_.map(tableHeader, function (item) {
        return item && item.children || [];
      }));
      var thirdTier = _.flatten(_.map(secondTier, function (item) {
        return item && item.children || [];
      }));

      return [firstTier, secondTier, thirdTier];
    }

    function getRowData(tableHeader) {
      var row = [];

      function getInsideDataBind(collection) {
        if (!collection || collection.length === 0) {
          return;
        }

        function deepChildren(count, collec, max) {
          if (count < max) {
            count += 1;
            return deepChildren(count, collec.children, max);
          }
          return collec;
        }

        collection.forEach(function (item) {
          var dataBindTier = item.dataBindTier || 0;
          var path = [];

          for(var i = 0; i < dataBindTier; i ++) {
            path.push('children');
          }
          var count = 1;
          var got = deepChildren(count, item, path.length);
          if (got && !angular.isArray(got)) {
            got.colspan = got.children ? got.children.length : 0;
          }
          row.push(got);
        });
      }

      getInsideDataBind(tableHeader);

      return _.flatten(row);
    }

    function mmToPt(num) {
      if (!num) {
        return 0;
      }
      return parseInt(num, 10) * PAPER_RATIO;
    }

    function getPageSize(size) {
      var _size = size ? size.split(',') : [297,210];
      return {
        width: mmToPt(_size[0]) + 'pt',
        height: 'auto'
      };
    }

    return service;
  }
})();
