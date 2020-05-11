(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .factory('evaluateService', evaluateService)
    .filter('evaluateRiskColor', function (evaluateService) {
      return function (evaluates, nature) {

        if (evaluates && evaluates.length > 0 && nature) {

          for (var i = 0; i < evaluates.length; i++) {
            var evaluate = evaluates[i];
            if (evaluate.nature == nature) {
              return evaluateService.getEvaluateAlertLevelColorDic()[evaluate.riskLevel];
            }
          }

          return "#000000";
        }
        return "#000000";
      }
    })
    .filter("evaluateRiskColorLevel", function () {
      return function (level) {
        var colorMap = {
          '01': "#3f78bf",
          '02': "#fea147",
          '03': "#ff5d6f",
          '04': "#3f78bf",
          '05': '#ff5d6f'
        };
        return colorMap[level];
      };
    })
    .filter('evaluateHighRiskShortWord', function (evaluateService) {
      return function (nature) {
        return evaluateService.getEvaluateByNature(nature);
      };
    })
    .filter('evaluateRiskScore', function () {
      return function (evaluates, nature) {
        if (evaluates && evaluates.length > 0 && nature) {
          for (var i = 0; i < evaluates.length; i++) {
            var evaluate = evaluates[i];
            if (evaluate.nature == nature)
              return evaluate.total;
          }
          return "—";
        }
        return "—";
      }
    }).filter('evaluateHighRisk', function (evaluateService) {
      return function (evaluates) {
        if (evaluates) {
          var evaluateHighRisk = "";
          for (var i = 0; i < evaluates.length; i++) {
            var evaluate = evaluates[i];
            if (evaluate.riskLevel != '04') {
              evaluateHighRisk = evaluateHighRisk + (i != 0 ? "," : "") +
                evaluateService.getEvaluateByNature(evaluate.nature) +
                "(" + evaluateService.getEvaluateRiskByNature(evaluate.riskLevel) + ")";
            }
          }

          return evaluateHighRisk == "" ? "无" : evaluateHighRisk;
        }
        return "无"
      }
    });

  /** @ngInject */
  function evaluateService(sessionService, _) {
    var service = {
      getEvaluateAlertLevelColorDic: getEvaluateAlertLevelColorDic,
      getEvaluateByNature: getEvaluateByNature,
      getEvaluateRiskByNature: getEvaluateRiskByNature
    };

    // MEWS 体征字典    
    var evaluateDic = {};
    var evaluateAlertDic = {};

    initService();

    function initService() {
      var dicHelper = sessionService.getDicHelper();
      for (var i = 0; i < dicHelper.dic["evaluateNature"].length; i++) {
        evaluateDic[dicHelper.dic["evaluateNature"][i].dicCode] = dicHelper.dic["evaluateNature"][i].abbreviation || dicHelper.dic["evaluateNature"][i].dicName;
      }

      for (i = 0; i < dicHelper.dic["riskLevel"].length; i++) {
        evaluateAlertDic[dicHelper.dic["riskLevel"][i].dicCode] = dicHelper.dic["riskLevel"][i].dicName;
      }
    }

    function getEvaluateByNature(nature) {
      return evaluateDic[nature];
    }

    function getEvaluateRiskByNature(riskCode) {
      return evaluateAlertDic[riskCode];
    }

    function getEvaluateAlertLevelColorDic() {
      return {
        '01': "#3f78bf",
        '02': "#fea147",
        '03': "#ff5d6f",
        '04': "#3f78bf",
        '05': '#ff5d6f'
      };
    }

    return service;
  }
})();
