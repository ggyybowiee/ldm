(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('estimateRecordUtil', estimateRecordUtil);

  /** @ngInject */
  function estimateRecordUtil($q, _, nursingRest) {

    var service = {
      getEstimateRecord: getEstimateRecord
    };

    function getEstimateRecord(data) {
      var getTpl = nursingRest.getNursingDoc(data.tplId);
      var getData = nursingRest.getEvaluateData().getList({
        sheetId: data.sheetId
      });

      return $q.all([getTpl, getData]).then(function (responses) {
        var tpl = responses[0];
        var data = responses[1];
        var tplData = [];

        if (angular.isArray(data) && data.length === 0) {
          tplData = [];
        } else {
          var group = _.groupBy(_.map(data, function (row) {
            var tableKey = Object.keys(row.data)[0];
            return {
              dataId: row.dataId,
              sheetId: row.sheetId,
              tableKey: tableKey,
              data: row.data[tableKey]
            }
          }), 'tableKey');
          tplData = group;
        }

        var components = tpl.components;
        // 处理V1.0数据在V1.1上显示
        if (components.render == 'v1_1') {

          _.forEach(tplData, function (table) {
            _.forEach(table, function (rowData) {
              _.forEach(tpl.components.dataTableHeader[rowData.tableKey], function (dataHeader) {
                if (['select', 'select2', 'multiSelect', 'radio'].indexOf(dataHeader.dataType) > -1) {
                  if (rowData.data[dataHeader.dataBind] != undefined) {
                    var value = rowData.data[dataHeader.dataBind];
                    if (!angular.isObject(value)) {
                      var opt = _.find(dataHeader.opts, function (item) {
                        return item.value == value || item.text == value;
                      })

                      if (opt == null) {
                        // console.log(dataHeader.dataBind, rowData.data[dataHeader.dataBind], opt);
                      }
                      rowData.data[dataHeader.dataBind] = opt;
                    }
                  }
                }
              });

            });
          });
        }

        return {
          tpl: tpl,
          data: tplData
        };
      });
    }

    return service;
  }
})();
