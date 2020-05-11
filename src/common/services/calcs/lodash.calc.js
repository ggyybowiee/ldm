(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('businessCalc', businessCalc);

  /** @ngInject */
  function businessCalc(_, moment) {
    var service = {
      getMatchedField: getMatchedField,
      getImageURL: getImageURL,
      getPercent: getPercent,
      getGender: getGender,
      getNurseLevel: getNurseLevel,
      getAge: getAge,
      getInHosDays: getInHosDays
    };

    return service;

    function getMatchedField(arr, filter, field) {
      return _.get(_.find(arr, filter), field) || '';
    }

    function getImageURL(code) {
      return '/assets/images/icons/' + code + '.png';
    }

    function getPercent(str, fixed) {
      var num = +str;
      if(Number.isNaN(num)) {
        return str;
      }
      return (num * 100).toFixed(fixed);
    }

    function getGender(code) {
      var genderMap = {
        'M': '男',
        'F': '女'
      };
      return genderMap[code];
    }

    function getNurseLevel(code) {
      var nurseMap = {
        '0': '特级',
        '1': '一级',
        '2': '二级',
        '3': '三级'
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
