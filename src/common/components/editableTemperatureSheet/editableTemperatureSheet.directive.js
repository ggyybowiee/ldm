(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('editableTempSheet', directive);
  /** @ngInject */
  function directive(sessionService, _, nursingRest, moment) {
    var directive = {
      restrict: 'EA',
      scope: {
        patient: '='
      },
      replace: true,
      templateUrl: 'common/components/editableTemperatureSheet/editableTemperatureSheet.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.nextWeek = nextWeek;
      scope.prevWeek = prevWeek;
      scope.changeWeek = changeWeek;

      var profile = sessionService.getProfile();
      var patient = scope.patient;
      var inDate = null;
      var originalWeek;

      scope.$watch('patient', function (newValue) {
        if (!newValue) {
          return;
        }

        patient = newValue;

        inDate = patient.inDate;

        originalWeek = (new Date().getTime() - new Date(inDate)) / (7 * 24 * 3600 * 1000);

        if (!scope.queryParams) {
          scope.queryParams = {
            inhosCode: patient.inhosCode,
            startDate: getStartDate(scope.weekCount),
            wardCode: profile.wardCode
          };

          scope.weekCount = isInt(originalWeek)
          ? originalWeek
          : Math.ceil(originalWeek);
        }

        scope.queryParams.inhosCode = patient.inhosCode;

        scope.$broadcast('firstLoadTempSheet');
      }, true);

      function isInt(n) {
        return n % 1 === 0;
      }

      function getStartDate(week) {
        return moment(inDate).add({
          days: (week - 1) * 7
        }).format('YYYY-MM-DD');
      }

      scope.validationOption = {};

      nursingRest.getTempConfig().customGET('', {
        wardCode: profile.wardCode
      }).then(function (response) {
        scope.conf = response.config;
      });

      scope.$on('firstLoadTempSheet', function() {
        activate(scope.queryParams);
      });

      function activate(params) {
        nursingRest.getTempSheetData().getList(params).then(function(response) {
          scope.tplData = response.plain();
        });
      }

      function changeWeek() {
        var intWeek = parseInt(scope.weekCount);
        if (isNaN(intWeek) || intWeek <= 0) {
          scope.weekCount = 1;
        }

        scope.queryParams.startDate = getStartDate(scope.weekCount);
        activate(scope.queryParams);
      }

      function nextWeek(isLast) {
        if (isLast) {
          scope.weekCount = Math.ceil(originalWeek);
          scope.queryParams.startDate = getStartDate(scope.weekCount);
          activate(scope.queryParams);
          return;
        }

        scope.weekCount = parseInt(scope.weekCount) + 1;

        scope.queryParams.startDate = getStartDate(scope.weekCount);
        activate(scope.queryParams);
      }

      function prevWeek(isFirst) {
        if (isFirst) {
          scope.weekCount = 1;
          scope.queryParams.startDate = getStartDate(scope.weekCount);
          activate(scope.queryParams);
          return;
        }

        if (scope.weekCount === 1) {
          return;
        }

        scope.weekCount = parseInt(scope.weekCount) - 1;

        scope.queryParams.startDate = getStartDate(scope.weekCount);
        activate(scope.queryParams);
      }
    }
  }
})();
