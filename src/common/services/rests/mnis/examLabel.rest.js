(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('examLabelRest', examLabel);

  /** @ngInject */
  function examLabel(Restangular) {
    var testRoot = '/emr/labreports/';
    var examUrl = '/emr/examinations/filter';
    var testUrl = '/emr/labreports/filter';
    var crisisUrl = '/emr/crisisvalue';

    var service = {
      getExamLabel: getExamLabel,
      getTestLabel: getTestLabel,
      testCompares: testCompares,
      getCrisisValue: getCrisisValue
    };

    return service;

    function getExamLabel (params) {
      return Restangular.one(examUrl).get(params);
    }

    function getTestLabel (params) {
      return Restangular.one(testUrl).get(params);
    }

    function testCompares (params) {
      var url = testRoot + params + '/compares';
      return Restangular.all(url).customPOST();
    }

    function getCrisisValue (params) {
      return Restangular.one(crisisUrl).get(params);
    }
  }
})();
