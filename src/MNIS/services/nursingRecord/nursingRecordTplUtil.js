(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('nursingRecordTplUtil', nursingRecordTplUtil);

  /** @ngInject */
  function nursingRecordTplUtil(_) {

    var service = {
      getNursingRecordInputType: getNursingRecordInputType,
      getNursingRecordInputDic: getNursingRecordInputDic,
      isDateTimeSeperate: isDateTimeSeperate
    };

    function getNursingRecordInputType() {
      return [getInputType("日期", "date"), getInputType("时间", "time"), getInputType("日期时间", "datetime"), getInputType("数字", "number"), getInputType("分割单元格", "divideCell"),
        getInputType("文字", "text"), getInputType("下拉", "select", "选项"), getInputType("布尔", "boolean", "选项"), getInputType("弹出框", "modal"), getInputType("签名", "outer", "签名"),
        getInputType("出入量", "inoutInput"),getInputType("审核签名", "verifySignature")
      ]
    }

    function getNursingRecordInputDic() {
      var inputDic = {};
      _.forEach(getNursingRecordInputType(), function (item) {
        inputDic[item.value] = item;
      })
      return inputDic;
    }

    function getInputType(text, value, waringText) {
      return {
        text: text,
        value: value,
        waringText: waringText
      }
    }

    function isDateTimeSeperate(tpl) {

      console.log(tpl.componments);

      if (tpl.componments) {

      }

      return true;
    }

    return service;
  }
})();
