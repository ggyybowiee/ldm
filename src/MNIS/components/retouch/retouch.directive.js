(function() {
  'use strict';

  angular.module('lachesis-mnis')
    .directive('retouch', retouch);

  /** @ngInject */
  function retouch($timeout, $rootScope, d3, estimateUtil, temperatureSheetUtil, Restangular, _, moment, modalService, nursingRest, patientEventRest, sessionService) {
    var directive = {
      scope: {
        items: '=',
        patient: '=',
        sheetId: '=',
        diagnosis: '=',
        dateTime: '=',
        demonstration: '='
      },
      restrict: 'E',
      replace: true,
      templateUrl: 'MNIS/components/retouch/retouch.tpl.html',
      link: function(scope, element, attrs, ctrl, transclude) {

        scope.openRetouches = openRetouches;
        scope.isDateTime = isDateTime;
        var watchers = {};
        var profile = sessionService.getProfile();

        watchers.sheetId = scope.$watch('sheetId', function (newValue, oldValue) {
          if (newValue) {
            setDiagnosis();
          }
        });

        watchers.diagnosis = scope.$watch('diagnosis', function (newValue) {
          if (newValue) {
            scope.retouches = scope.diagnosis;
            scope.retouch = getLatestItem(scope.diagnosis, scope.dateTime);
          }
        }, true);

        // 清除$watcher
        scope.$on('$destroy', function () {
          Object.keys(watchers).forEach(function (watcherName) {
            watchers[watcherName]();
          });

          listener();
        });

        function setDiagnosis() {
          getDiagnosis(scope.patient.inhosCode).then(function (response) {
            scope.retouches = response;
            scope.retouch = getLatestItem(response, scope.dateTime);
          });
        }

        var listener = scope.$on('refreshDiagnosis', setDiagnosis);

        function getDiagnosis(inhosCode) {
          return nursingRest.getDiagnosis(inhosCode);
        }

        // 获取传入时间以前的最近买一条记录 by gary @2018-04-04 18:21:53
      function getLatestItem(data, time) {
        var latestTime = moment(time);

        if (!Array.isArray(data)) {
          return {};
        }

        var sorted = data.sort(function (prev, next) {
          var diffNext = latestTime.diff(next.recordTime);
          var diffPrev = latestTime.diff(prev.recordTime);

          if (diffPrev < 0) {
            return 1;
          }

          if (diffNext < 0 && diffPrev > 0) {
            return -1;
          }

          if (diffPrev - diffNext > 0) {
            return 1;
          }

          return 0;
        });

        return sorted[0] || {};
      }

        function openRetouches() {
          modalService.open({
            templateUrl: 'MNIS/components/retouch/retouch.modal.html',
            size: 'xlg',
            data: {
              formData: _.map(scope.retouches, function (item) {
                return _.extend({}, item, {
                  time: item.recordTime
                });
              })
            },
            initFn: function () {
              var modal = this;

              modal.loading = {};
              modal.plainItem = {};
              _.forEach(scope.items, function (item) {
                modal.plainItem[item.dicCode] = '';
              });
              modal.items = scope.items;
              modal.isDateTime = isDateTime;
              modal.addRow = function () {
                modal.formData.push({
                  isNew: true
                });
              };

              modal.save = function (index) {
                modal.loading[index] = true;
                var dateTime = moment(moment(modal.formData[index].recordTime).format('YYYY-MM-DD') + ' ' + modal.formData[index].time).format('YYYY-MM-DD HH:mm:ss');

                if (dateTime === 'Invalid date') {
                  dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
                }

                if (_.filter(scope.retouches, function (item, innerIndex) {
                  return innerIndex !== index && item.recordTime === dateTime;
                }).length > 0) {
                  scope.$emit('toast', {
                    type: 'warning',
                    content: '该时间已有数据，请修改记录时间'
                  });

                  modal.loading[index] = false;

                  return;
                }

                var data = _.extend({}, modal.formData[index], {
                  inhosCode: scope.patient.inhosCode,
                  patCode: scope.patient.patCode,
                  recordTime: dateTime
                });

                delete data.time;

                if (!data.isNew) {
                  delete data.isNew;
                  delete modal.formData[index].isNew;
                  modal.put(index, data);

                  return;
                }

                var savingData = {
                  event: 'diagnosis',
                  content: data.diagnosis,
                  hideTime: '1',
                  inhosCode: data.inhosCode,
                  recordTime: moment(data.recordTime).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                  wardCode: profile.wardCode,
                  wardName: profile.wardName
                }

                patientEventRest.addPatientEvent(savingData).then(function () {

                  $rootScope.$broadcast('refreshDiagnosis');
                  $rootScope.$broadcast('getPrintRetouches');

                  delete modal.formData[index].isNew;
                  modal.loading[index] = false;

                  scope.$emit('toast', {
                    type: 'success',
                    content: '保存成功！'
                  });

                });
              };

              modal.put = function (index, data) {
                var savingData = _.assign(data, {
                  event: 'diagnosis',
                  content: data.diagnosis,
                  hideTime: '1',
                  inhosCode: data.inhosCode,
                  recordTime: moment(data.recordTime).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                  wardCode: profile.wardCode,
                  wardName: profile.wardName
                });

                delete savingData.diagnosis;

                return patientEventRest.updatePatientEvent(savingData).then(function () {
                  $rootScope.$broadcast('refreshDiagnosis');
                  $rootScope.$broadcast('getPrintRetouches');
                  modal.loading[index] = false;
                  scope.$emit('toast', {
                    type: 'success',
                    content: '保存成功！'
                  });
                });
              };

              modal.removeRow = function (index) {
                if (!scope.retouches[index]) {
                  modal.formData.splice(index, 1);

                  return;
                }

                return patientEventRest.deletePatientEvent(scope.retouches[index].seqId).then(function () {
                  $rootScope.$broadcast('refreshDiagnosis');
                  $rootScope.$broadcast('getPrintRetouches');
                  modal.formData.splice(index, 1);
                  scope.$emit('toast', {
                    type: 'success',
                    content: '已删除！'
                  });
                });

              };
            }
          });
        }

        function isDateTime(code) {
          if (!code) {
            return false;
          }

          var str = code.toString().toLowerCase();

          return str.indexOf('date') > -1 || str.indexOf('time') > -1;
        }
      }
    };

    return directive;
  }

})();
