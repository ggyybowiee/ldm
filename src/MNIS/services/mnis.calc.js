(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .factory('mnisCalc', mnisCalc);

  /** @ngInject */
  function mnisCalc(_, moment) {
    var service = {
      getGender: getGender,
      getAge: getAge,
      getInHosDays: getInHosDays,
      getDangerLevel: getDangerLevel,
      getNurseLevel: getNurseLevel
    };

    return service;

    function getGender(code) {
      var genderMap = {
        'M': '男',
        'F': '女'
      };
      return genderMap[code];
    }

    function getDangerLevel(code) {
      var dangerMap = {
        N: '普通',
        S: '病重',
        D: '病危'
      };
      return dangerMap[code];
    }

    function getNurseLevel(code) {
      // var nurseMap = ['特级', '一级', '二级', '三级'];
      var nurseMap = {
        0: '特级',
        1: '一级',
        2: '二级',
        3: '三级'
      }
      return nurseMap[code];
    }

    function getAge(birthday, day) {
      var today = day ? moment(day): moment();
      return today.diff(moment(birthday), 'years');
    }

    function getInHosDays(inDate, outDate) {
      var today = outDate ? moment(outDate): moment();
      return today.diff(moment(inDate), 'days');
    }

  }
})();