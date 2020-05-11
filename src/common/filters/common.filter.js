(function () {
  "use strict";

  angular.module("lachesis-common")
    .filter("bedCodeShortCut", bedCodeShortCut)
    .filter("valuelessContent", function () {
      return function (text) {
        return text || "—"

      };
    }).filter("passwordHidden", function () {
      return function (text) {
        return "******"
      };
    });

  /** @ngInject */
  function bedCodeShortCut(sessionService, _) {
    return function (valueString) {
      var configDic = sessionService.getConfHelper().conf;
      var regString = _.get(configDic, "BedCodeRegex");
      if (regString == undefined) return valueString;

      var reg = new RegExp(regString.configValue);
      if (reg.test(valueString)) {
        var result = valueString.match(reg);
        return result[0];
      } else {
        return "";
      }
    };
  }
})();
