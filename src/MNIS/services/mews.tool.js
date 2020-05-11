(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("mewsService", mewsService)
    .filter("mewsScore", function() {
      return function(text) {
        if (text == undefined) return "—";
        return text;
      };
    })
    .filter("mewsScoreColor", function(mewsService) {
      return function(mewsRecord) {
        if (!mewsRecord || mewsRecord.alertLevel == undefined) {
          return "#000000";
        }

        if (
          mewsService.getMewsAlertLevelDic()[mewsRecord.alertLevel] == undefined
        ) {
          return "#000000";
        }

        return mewsService.getMewsAlertLevelDic()[mewsRecord.alertLevel].color;
      };
    })
    .filter("nurseLevel", function() {
      return function(text) {
        if (text == "0") return "特级护理";
        else if (text == "1") return "I护理";
        else if (text == "2") return "II级护理";
        else if (text == "3") return "III级护理";

        return "";
      };
    })
    .filter("gender", function() {
      return function(text) {
        if (text == "F") return "女";
        else if (text == "M") return "男";

        return "";
      };
    })
    .filter("age", function(moment) {
      return function(birthday) {
        if (!birthday) return "";

        var today = moment();
        return today.diff(moment(birthday), "years");
      };
    })
    .filter("dangerLevel", function() {
      return function(text) {
        var dangerMap = {
          N: "普通",
          S: "病重",
          D: "病危"
        };
        return dangerMap[text];
      };
    })
    .filter("mewsAlertHeadImage", function() {
      return function(mewsRecord) {
        // console.log(mewsRecord);

        if (!mewsRecord || !mewsRecord.alertLevel) return "";

        if (mewsRecord.alertLevel == 3) {
          return "warning_card_head_3.jpg";
        } else if (mewsRecord.alertLevel == 2) {
          return "warning_card_head_2.jpg";
        } else if (mewsRecord.alertLevel == 1) {
          return "warning_card_head_1.jpg";
        }

        return "";
      };
    });

  /** @ngInject */
  function mewsService(sessionService, _) {
    var service = {
      getMewsAlertLevelDic: getMewsAlertLevelDic,
      processMewsScoreForViewModel: processMewsScoreForViewModel,
      processMewsConfigForViewModel: processMewsConfigForViewModel,
      prepareMewsConfigForSave: prepareMewsConfigForSave,
      processVitalSignNodeForViewModel: processVitalSignNodeForViewModel
    };

    // MEWS 体征字典
    var mewsVitalSignDic = [
      "temperature",
      "breath",
      "heartRate",
      "sense",
      "bloodPress"
    ];
    var senseDic = {};

    initService();

    function initService() {
      var dicHelper = sessionService.getDicHelper();
      var sense = _.get(dicHelper, ["dic", "sense"]);

      if (!sense) {
        return;
      }

      for (var i = 0; i < sense.length; i++) {
        _.set(senseDic, sense[i].dicCode, sense[i].dicName);
      }
    }

    return service;

    function getMewsAlertLevelDic() {
      return {
        3: {
          text: "高度危险",
          color: "#ff5d6f"
        },
        2: {
          text: "中度危险",
          color: "#fea147"
        },
        1: {
          text: "低度危险",
          color: "#fad01a"
        },
        0: {
          text: "无危险",
          color: "#3f78bf"
        }
      };
    }

    function processMewsScoreForViewModel(score) {
      var record = angular.copy(score);

      for (var j = 0; j < record.vitals.length; j++) {
        var vitalSign = record.vitals[j];
        processVitalSignNodeForViewModel(vitalSign);

        if (mewsVitalSignDic.indexOf(vitalSign.vitalSign) > -1) {
          record[vitalSign.vitalSign] = vitalSign;
        }
      }
      // delete record.vitals;
      return record;
    }

    function processVitalSignNodeForViewModel(vitalSign) {
      if (vitalSign.vitalSign == "bloodPress") {
        var val = vitalSign.value.split("/");
        vitalSign.value = val[0];
      } else if (vitalSign.vitalSign == "sense") {
        vitalSign.value = senseDic[vitalSign.value]
          ? senseDic[vitalSign.value]
          : vitalSign.value;
      }
    }

    function prepareMewsConfigForSave(savingConfig) {
      var config = angular.copy(savingConfig);
      delete config.isCreate;

      for (var i = 0; i < config.mewsScorecard.length; i++) {
        var mewsScorecard = config.mewsScorecard[i];
        if (mewsScorecard.scoreType != "sense") continue;

        for (var j = 0; j < 4; j++) {
          var values = [];
          for (var k = 0; k < mewsScorecard.scoreRange[j].length; k++) {
            values.push(mewsScorecard.scoreRange[j][k].id);
          }
          mewsScorecard.scoreRange[j] = values;
        }
      }

      return config;
    }

    function processMewsConfigForViewModel(config) {
      config.soundOn = config.soundOn ? "true" : "false";
      config.alertWindowOn = config.alertWindowOn ? "true" : "false";

      for (var i = 0; i < config.mewsScorecard.length; i++) {
        var mewsScorecard = config.mewsScorecard[i];
        if (mewsScorecard.scoreType == "sense") {
          if (mewsScorecard.scoreRange == undefined) {
            mewsScorecard.scoreRange = {
              0: [],
              1: [],
              2: [],
              3: []
            };
          } else {
            for (var j = 0; j < 4; j++) {
              var values = [];
              for (var k = 0; k < mewsScorecard.scoreRange[j].length; k++) {
                if (senseDic[mewsScorecard.scoreRange[j][k]]) {
                  values.push({
                    id: mewsScorecard.scoreRange[j][k],
                    value: senseDic[mewsScorecard.scoreRange[j][k]]
                  });
                }
              }
              mewsScorecard.scoreRange[j] = values;
            }
          }
          break;
        }
      }

      for (i = 0; i < config.rule.length; i++) {
        var rule = config.rule[i];
        for (j = 0; j < rule.linkedConditions.length; j++) {
          var condition = rule.linkedConditions[j];
          condition.condition = "" + condition.condition;
        }
      }
    }
  }
})();
