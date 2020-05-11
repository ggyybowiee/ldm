(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('nursingRecordUtil', nursingRecordUtil)
    .filter('signData', function (_) {
      return function (data) {
        if (angular.isArray(data)) {
          var text = "";
          _.forEach(data, function (item) {
            text += item;
          })
          return text;
        }

        return data;
      }
    });

  /** @ngInject */
  function nursingRecordUtil(_, nursingRecordTplUtil) {

    var service = {
      insertText: insertText,
      getRecordDate: getRecordDate
    };

    // 插入文字
    function insertText(nursingRecordData, focusRow, appendText, scope, insertCallback) {

      if (insertCallback != undefined) {
        insertCallback(nursingRecordData, appendText);
        return;
      }

      if (_.get(focusRow, 'row.key') == undefined) {
        scope.$emit('toast', {
          type: 'warning',
          content: '请先在右侧编辑区选中要编辑的项目再引用！'
        });
        return;
      }

      if (_.get(focusRow, 'row.type') != 'text' && _.get(focusRow, 'row.type') != 'modal' && _.get(focusRow, 'row.type') != 'select') {
        var typeItem = nursingRecordTplUtil.getNursingRecordInputDic()[focusRow.row.type];
        scope.$emit('toast', {
          type: 'warning',
          content: '无法给【' + (typeItem ? (typeItem.warningText || typeItem.text) : "") + '】类型的项目引用文本'
        });
        return;
      }

      if (focusRow.disable)
        return;

      if (nursingRecordData.data[focusRow.row.key] == undefined)
        nursingRecordData.data[focusRow.row.key] = "";
      var valueStr = nursingRecordData.data[focusRow.row.key];
      nursingRecordData.data[focusRow.row.key] = valueStr.substring(0, focusRow.insertIndex) + appendText + valueStr.substring(focusRow.insertIndex, valueStr.length);
      focusRow.insertIndex += appendText.length;
    }

    // 获取护理记录日期
    function getRecordDate(nursingRecordData) {
      var dateTime = nursingRecordData.data.datetime;
      if (dateTime == undefined)
        dateTime = nursingRecordData.data.date + " " + nursingRecordData.data.time;

      return new Date(dateTime);
    }

    return service;
  }
})();
