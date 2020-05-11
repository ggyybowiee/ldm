(function () {
  'use strict';

  angular.module('lachesis-common')
    .directive('temperatureSheet', temperatureSheet)
    .directive('onFinished', function ($timeout) {
      return {
        restrict: 'A',
        terminal: true,
        link: function () {
          $timeout(function () {
            console.log('Render finished');
          });
        }
      }
    })
    .controller('temperatureSheetController', temperatureSheetController);

  /** @ngInject */
  function temperatureSheet($timeout, d3, estimateUtil, temperatureSheetUtil, Restangular, sessionService, _) {
    var directive = {
      scope: {
        config: '=conf',
        data: '=',
        patientInfo: '=',
        id: '@',
        url: '@',
        loadData: '@',
        week: '=',
        inDate: '=',
        outDate: '=',
        eventDatas: '=',
        pageStartDate: '=',
        pageEndDate: '='
      },
      restrict: 'E',
      replace: true,
      transclude: true,
      controller: 'temperatureSheetController',
      controllerAs: 'vm',
      templateUrl: 'MNIS/components/temperatureSheet/temperatureSheet.tpl.html',
      link: function (scope, element, attrs, ctrl, transclude) {

        var dicHelper = sessionService.getDicHelper();
        var sysConfig = sessionService.getConfHelper().conf;
        var dic = dicHelper.dic;
        var watchers = {};
        scope.getPageSize = function () {
          if (!scope.config) {
            return;
          }
          return estimateUtil.getPageSize(scope.config.size);
        }
        element.find('#docHeaderPlaceholder').replaceWith(transclude());
        watchers.config = scope.$watch('config', function (newValue) {
          if (!newValue) {
            return;
          }
          scope.skinTest = _.find(newValue.row24Hour, {
            dicCode: 'skinTestInfo'
          });
          temperatureSheetUtil.init(newValue, scope, element, dic.vitalItem);
          if (scope.data != null)
            temperatureSheetUtil.fillData(scope.data, scope.eventDatas, scope, scope.pageStartDate, sysConfig);
        });
        watchers.data = scope.$watch('data', function (newValue) {
          if (!newValue) {
            return;
          }
          $timeout(function () {
            temperatureSheetUtil.fillData(newValue, scope.eventDatas, scope, scope.pageStartDate, sysConfig);
          });
        }, true);
        watchers.eventData = scope.$watch('eventDatas', function (newValue) {
          if (!newValue) {
            return;
          }

          $timeout(function () {
            temperatureSheetUtil.fillData(scope.data, scope.eventDatas, scope, scope.pageStartDate, sysConfig);
          });
        }, true);

        // 清除$watcher
        scope.$on('$destroy', function () {
          Object.keys(watchers).forEach(function (watcherName) {
            watchers[watcherName]();
          });
        });
      }
    };

    return directive;
  }

  function temperatureSheetController($rootScope, $q, $timeout, $scope, Restangular, temperatureSheetUtil, sessionService, modalService, moment, nursingRest, _, $location) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();
    var dic = dicHelper.dic;
    vm.scope = $scope;
    vm.rootScope = $rootScope;
    var profile = sessionService.getProfile();
    var chartKeys = ['heartRate', 'temperature', 'cooledTemperature', 'pulse'];
    var chartDics = _.filter(dic.vitalItem, function (item) {
      return chartKeys.indexOf(item.dicCode) > -1;
    });

    vm.handleDblClick = handleDblClick;

    function handleDblClick(e, dates) {
      var underGrid = angular.element('.temperature-sheet__under-grid');
      var offset = underGrid[0].getBoundingClientRect();
      var width = underGrid.width();
      var range = [];

      for (var i = 1; i <= 8; i += 1) {
        range.push(offset.left + ((width / 8) * i));
      }

      var correctColumn = _.findIndex(range, function (x) {
        return e.clientX < x;
      });

      if (correctColumn === 0) {
        return;
      }

      if (correctColumn - 1 >= dates.length) {
        $scope.$emit('toast', {
          type: 'warning',
          content: '超过当前日期或患者出院日期，不可编辑'
        })
      } else {
        vm.showEdit(dates[correctColumn - 1]);
      }
    }

    function generateFullDate(date, hour, dateFormat) {
      if (hour >= 24) {
        return moment(date + ' ' + ((hour - 24) || '00') + ':00').add(1, 'day').format(dateFormat);
      }

      return moment(date + ' ' + (hour || '00') + ':00').format(dateFormat);
    }

    function dataToShow(data, date) {
      var times = $scope.config.timesInterval.split(',');

      function getFormerRecordDate(dateTime) {
        return moment(dateTime).subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
      }

      var getFullData = function (former, latter, keys) {
        var twiceData = _.map(keys, function (key) {
          var formerOne = _.find(former, { vitalSigns: key });
          var latterOne = _.find(latter, { vitalSigns: key });

          return _.assign({}, formerOne || latterOne, {
            recordDate: formerOne ? _.get(formerOne, 'recordDate') : getFormerRecordDate(_.get(latterOne, 'recordDate')),
            vitalSignsValues: _.get(formerOne, 'vitalSignsValues') || '',
            twiceVitalSignsValues: {
              0: _.get(formerOne, 'vitalSignsValues'),
              1: _.get(latterOne, 'vitalSignsValues')
            },
            twiceVitalSignsMeasureCode: {
              0: _.get(formerOne, 'measureCode'),
              1: _.get(latterOne, 'measureCode')
            },
            seqIds: {
              0: _.get(formerOne, 'seqId'),
              1: _.get(latterOne, 'seqId')
            }
          });
        });

        return _.chain(former)
          .filter(function (item) {
            return !_.includes(keys, item.vitalSigns);
          })
          .concat(twiceData)
          .value();
      };

      var fullTimes = _.map(times, function (item) {
        return [generateFullDate(date, +item, 'YYYY-MM-DD HH:mm:ss'), generateFullDate(date, (+item + 2), 'YYYY-MM-DD HH:mm:ss')];
      });
      times = _.map(times, function (value) {
        return moment(date + ' ' + (value || '00') + ':00').format('YYYY-MM-DD HH:mm:ss');
      });

      var keysIncludeTwiceValueFromConfig = _.map($scope.config.clickToSetInputTwiceValue, 'dicCode');
      var dataParallel = _.chain(fullTimes)
        .map(function (doubleTimes) {
          var dataFormer = _.get(data[0].vitalsignDatas, doubleTimes[0]) || [];
          var dataLatter = _.get(data[0].vitalsignDatas, doubleTimes[1]) || []

          var keysIncludeTwiceValueFormer = _.chain(dataFormer)
            .map('vitalSigns')
            .intersection(keysIncludeTwiceValueFromConfig)
            .value();

          var keysIncludeTwiceValueLatter = _.chain(dataLatter)
            .map('vitalSigns')
            .intersection(keysIncludeTwiceValueFromConfig)
            .value();

          var allKeys = _.chain(keysIncludeTwiceValueLatter)
            .concat(keysIncludeTwiceValueFormer)
            .uniq()
            .value();

          return getFullData(dataFormer, dataLatter, allKeys);
        })
        .mapKeys(function (item, key) {
          var targetIndex = parseInt(key);
          return moment(date + ' ' + ($scope.config.timesInterval.split(',')[targetIndex] || '00') + ':00').format('YYYY-MM-DD HH:mm:ss');
        })
        .value();

      dataParallel[moment(date + ' 00:00').format('YYYY-MM-DD HH:mm:ss')] = data[0].vitalsignDatas[moment(date + ' 00:00').format('YYYY-MM-DD HH:mm:ss')] || [];

      var dataCopy = _.chain(dataParallel)
        .map(function (value, key) {
          return [key, value];
        })
        .sortBy(function (item) {
          return moment(item[0]);
        })
        .map(function (item) {
          return _.mapKeys(item[1], function (item) {
            // 设置默认的测量方式
            if (!item.measureCode) {
              item.measureCode = '01';
            }
            return item.vitalSigns;
          });
        })
        .value();
      
      var modal = this;

      var row6times = $scope.config.row4Hour.concat($scope.config.row12Hour, chartDics);

      // 将所有体征项的测量方式设为默认，已有的不改变
      // 后续保存时过滤掉没有具体值的体征项
      var keys = _.map(row6times, 'dicCode');
      dataCopy.forEach(function (item) {
        keys.forEach(function (key) {
          if (!item[key]) {
            item[key] = {};
          }
          if (!item[key].measureCode) {
            item[key].measureCode = '01';
          }
        });
      });

      if (dataCopy.length === 7) {
        var index = _.findIndex(dataCopy, function (item) {
          return _.intersection(_.keys(item), _.map($scope.config.row24Hour, 'dicCode')).length > 0;
        });

        if (index > 0) {
          var sign24 = dataCopy.splice(index, 1);
          dataCopy.unshift(sign24[0]);
        }
      }

      // 24小时体征默认值
      if (dataCopy.length < 7) {
        dataCopy.unshift({});
      }

      _.map($scope.config.row24Hour, 'dicCode').forEach(function (key) {
        if (!dataCopy[0][key]) {
          dataCopy[0][key] = {};
        }
        if (!dataCopy[0][key].measureCode && key !== 'skinTestInfo') {
          dataCopy[0][key].measureCode = '01';
        }
      });

      // 提取皮试单独显示
      modal.formData.skinTestInfo = _.get(dataCopy, [0, 'skinTestInfo']);
      _.omit(dataCopy[0], 'skinTestInfo');
      modal.formData.skinTestInfo = modal.formData.skinTestInfo && Object.keys(modal.formData.skinTestInfo).length > 0 ? _.chain(modal.formData.skinTestInfo)
        .get('measureCode')
        .split(',')
        .map(function (measureCode, index) {
          var values = _.get(modal.formData, 'skinTestInfo.vitalSignsValues') || '';

          return _.assign({}, modal.formData.skinTestInfo, {
            measureCode: measureCode,
            measureName: _.chain(modal.formData.skinTestInfo).get('measureName').split(',').get(index).value(),
            vitalSignsValues: _.chain(values).split(',').get(index).value()
          });
        })
        .value() : [];

      // 提取自定义项单独显示
      modal.formData.customRows = _.chain(dataCopy[0])
        .keys()
        .filter(function (value) {
          return !_.find($scope.config.row24Hour, function (item) {
            return item.dicCode === value;
          }) && _.get(dataCopy[0], [value, 'seqId']) && value !== 'skinTestInfo';
        })
        .map(function (key) {
          var gotKey = dataCopy[0][key];
          delete dataCopy[0][key];

          return gotKey;
        })
        .value();

      return dataCopy;
    }

    vm.showEdit = function (date) {
      var url = $scope.url;
      var hasTwiceVitalInput = false;

      var row6times = $scope.config.row4Hour.concat($scope.config.chartLines);
      if ($scope.config.row12HourEditType == '4Hour' || $scope.config.row12HourEditType == undefined)
        row6times = row6times.concat($scope.config.row12Hour);

      _.forEach(row6times, function (item) {
        var findIndex = _.findIndex($scope.config.clickToSetInputTwiceValue, function (twiceValueItem) {
          return twiceValueItem.dicCode === item.dicCode;
        });
        if (findIndex > -1) {
            item.isShowTwiceVitalInput = true;
            hasTwiceVitalInput = true;
        } else {
          item.isShowTwiceVitalInput = false;
        }
      });

      var times = $scope.config.timesInterval.split(',');
      var twiceTimes = [times[0], times[3]];

      var openingModal = {
        templateUrl: 'MNIS/components/temperatureSheet/temperatureForm.modal.html',
        size: 'lg',
        data: {
          metaData: {
            config: $scope.config,
            times: times,
            hasTwiceVitalInput: hasTwiceVitalInput,
            twiceTimes: twiceTimes,
            row6times: row6times,
            row2times: $scope.config.row12Hour,
            skinTest: $scope.config.skinTest,
            row35Deg: $scope.config.row35Deg,
            row35DegChart: $scope.config.row35DegChart,
            row24times: $scope.config.row24Hour,
            skinTestInfo: _.find($scope.config.row24Hour, {
              dicCode: 'skinTestInfo'
            }),
            dic: dic,
            indate: $scope.inDate,
            outdate: $scope.outDate,
            pageStartDate: $scope.pageStartDate,
            pageEndDate: $scope.pageEndDate
          },
          formData: {
            recordDate: date
          }
        },

        methodsObj: {
          setPatientStatus: function (index) {
            var targetIndex = index + 1;
            var that = this;
            row6times.forEach(function (item) {

              if (!that.formData.data[targetIndex]) {
                that.formData.data[targetIndex] = {};
              }

              if (!that.formData.data[targetIndex][item.dicCode]) {
                that.formData.data[targetIndex][item.dicCode] = {};
              }
              that.formData.data[targetIndex][item.dicCode].vitalSignsValues = that.metaData.data[index].patientStatus;

              if (item.isShowTwiceVitalInput) {
                if (!that.formData.data[targetIndex][item.dicCode].twiceVitalSignsValues) {
                  that.formData.data[targetIndex][item.dicCode].twiceVitalSignsValues = {
                    '0': undefined,
                    '1': undefined
                  }
                }
                that.formData.data[targetIndex][item.dicCode].twiceVitalSignsValues['0'] = that.metaData.data[index].patientStatus;
              }
            });
          },

          isCustomValue: function (code) {
            return _.chain($scope.config.skinTest).find({
              dicCode: code
            }).get('isCustomValue').value();
          },

          getCurrentUnit: function (measureCode, code) {
            if (!measureCode && $scope.config.clickToSetValue[code]) {
              return $scope.config.clickToSetValue[code][0].unit;
            }

            var found = _.find($scope.config.clickToSetValue[code], function (item) {
              return item.dicCode === measureCode;
            });

            return found && found.unit || '';
          },
          getClickToSetOptions: function (code) {
            var that = this;
            return that.metaData.config.clickToSetValue[code] || that.metaData.dic[code] || [];
          },

          setCurrentDrug: function (index, value) {
            var that = this;

            that.currentDrug = {
              drug: _.find(that.metaData.skinTest, function (item) {
                return item.dicCode === value;
              }),
              index: index
            };
          },

          addSkinTest: function () {
            if (!this.formData.skinTestInfo) {
              this.formData.skinTestInfo = [];
            }
            this.formData.skinTestInfo.push({});
          },

          removeSkinTest: function (index) {
            var that = this;

            that.formData.skinTestInfo.splice(index, 1);
          },

          setEventName: function (index) {
            var that = this;
            var event = _.find(dic.eventType, function (event) {
              return event.dicCode === that.formData.data[index].event.measureCode;
            });
            // 清除事件
            if (!event.dicCode) {
              delete that.formData.data[index].event;
              return;
            }
            that.formData.data[index].event.vitalSignsValues = event ? event.dicName : null;
            that.formData.data[index].event.measureName = event ? event.dicName : null;
          },
          clickToSetValue: function (code, target, measureCode, index) {

            var that = this;

            if (measureCode != undefined) {
              target.measureCode = measureCode;
            }

            var options = that.getClickToSetOptions(code);
            var option = _.find(options, function (item) {
              return item.dicCode === target.measureCode;
            });
            // 设置data单位
            target.units = option.unit || '';
            if (!option || !option.isSet) {
              return;
            }
            var saveValue = (typeof option.saveValue === 'undefined' || option.saveValue === null) ? option.dicName : option.saveValue;
            target.vitalSignsValues = saveValue;
            angular.element("#temperature-24-hour-input-" + index)[0].focus();
          },
          getEvaluateOptions: function (code) {
            var currentEvaluate = _.find(dic.evaluatePoint, function (item) {
              return item.dicCode === code;
            });
            if (!currentEvaluate) {
              return [];
            }
            return currentEvaluate.dicName.split(',');
          },
          reset: function () {
            this.formData.data = _.cloneDeep(this.metaData.originalData);
            this.formData.customRows = _.cloneDeep(this.metaData.originalCustomRows);
          },
          checkRecordInWeek: function () {

            var that = this;

            var deffered = $q.defer();

            var queryArgs = temperatureSheetUtil.getWeekParam(that.formdata.recordDate);
            // if (queryArgs.startDate != that.metaData.pageStartDate || queryArgs.endDate != that.metaData.pageEndDate) {

            //   queryArgs.inhosCode = $scope.patientInfo.inhosCode;
            //   queryArgs.wardCode = ($location.$$search.openOuter && $location.$$search.wardCode) ? $location.$$search.wardCode : profile.wardCode;

            //   nursingRest.getTempSheetData().getList(queryArgs).then(function (response) {
            //     vm.tplData = response.plain();
            //     var findIndex = 0;
            //     for (; findIndex < vm.tplData.length; findIndex++) {
            //       if (vm.tplData[findIndex].date > vm.outDate)
            //         break;
            //     }
            //     if (findIndex < vm.tplData.length) {
            //       vm.tplData.splice(findIndex, vm.tplData.length - findIndex);
            //     }

            //     // temperatureSheetUtil.

            //     deffered.resolve();
            //   })
            // }
            // else {
            $timeout(function () {
              deffered.resolve();
            })
            // }

            return deffered.promise;
          },
          loadData: function () {

            var that = this;
            if (that.formData.recordDate > that.metaData.outdate)
              that.formData.recordDate = that.metaData.outdate;
            else if (that.formData.recordDate < that.metaData.indate)
              that.formData.recordDate = that.metaData.indate;

            that.metaData.isLoading = true;
            that.metaData.loadingContent = "正在加载数据";

            return getSingleDayData({
              wardCode: ($location.$$search.openOuter && $location.$$search.wardCode) ? $location.$$search.wardCode : profile.wardCode,
              inhosCode: $scope.patientInfo.inhosCode,
              startDate: that.formData.recordDate
            }).then(function (response) {

              var dataToView = dataToShow.bind(that);
              that.formData.data = dataToView(response.plain(), that.formData.recordDate);
              that.metaData.originalData = _.cloneDeep(that.formData.data);
              that.metaData.rowCustomConfig = $scope.rowCustomConfig;

              // 生成自定义行
              var editCustomRows = [];
              that.metaData.rowCustomConfig.forEach(function (key) {

                var vitalsignNode = _.find(that.formData.customRows, {
                  'vitalSigns': key
                });
                if (vitalsignNode) {
                  editCustomRows.push(vitalsignNode);
                } else {
                  editCustomRows.push({
                    vitalSigns: key,
                    vitalSignsValues: ""
                  });
                }
              })
              that.formData.customRows = editCustomRows;
              that.metaData.originalCustomRows = _.cloneDeep(editCustomRows);

              that.metaData.originalSkinTestInfo = _.cloneDeep(that.formData.skinTestInfo);
              that.metaData.originRowCustomConfig = _.cloneDeep(that.metaData.rowCustomConfig);
              that.metaData.isLoading = false;
              that.metaData.loadingContent = "";
            }, function () {
              that.metaData.isLoading = false;
              that.metaData.loadingContent = "";
            });
          },
          addCustomItem: function () {
            var that = this;
            if (!that.formData.newRows) {
              that.formData.customRows = [];
            }

            that.formData.customRows.push({
              vitalSigns: '',
              vitalSignsValues: ''
            });
          },

          removeCustomItem: function (index) {
            this.formData.customRows.splice(index, 1);
          },

          setValue: function (index, value) {
            this.formData.customRows[index].vitalSigns = value;
          },

          hideOptions: function (event) {
            var parent = angular.element(event.target).parent();

            setTimeout(function () {
              parent.removeClass('open');
            }, 200);
          },

          openOptions: function (event) {
            var parent = angular.element(event.target).parent();

            if (!parent.hasClass('open')) {
              parent.addClass('open');
            }
          },

          keyboardDown: function (event, row6timesIndex) {

            var that = this;
            while (that) {

              if (_.get(that, 'metaData')) {
                break;
              } else if (_.get(that, 'vm.metaData')) {
                that = that.vm;
                break;
              } else that = that.$parent;
            }

            if (that.metaData.inputControl == undefined) {
              that.metaData.inputControl = [];
              var focusInputControls = angular.element(".temperature-keyboard-focus");
              for (var i = 0; i < focusInputControls.length; i++) {
                that.metaData.inputControl.push(focusInputControls[i]);
              }
            }

            var row6times = _.sortBy(that.metaData.row6times, 'orderIndex');

            var index = that.metaData.inputControl.indexOf(event.target);
            if (index == -1)
              return;

            var row6timesItemCnt = 0;
            var cntDic = {};

            _.forEach(row6times, function (item) {
              if (item.isShowTwiceVitalInput) {
                row6timesItemCnt += 2*6;
                cntDic[item.dicCode] = 2*6;
              } else {
                row6timesItemCnt += 6;
                cntDic[item.dicCode] = 6;
              }
            });

            var step = cntDic[row6times[row6times.length - 1].dicCode];

            if (row6timesIndex != undefined) {
              step = cntDic[row6times[row6timesIndex].dicCode];
            }

            var nextIndex = index;

            function getSummary(index) {
              var sum = 0;

              for (var j = 0; j < index; j++) {
                sum += cntDic[row6times[j].dicCode];
              }

              return sum;
            }

            // 上：38，下：40
            if (event.keyCode == 38) {

              if (index <= row6timesItemCnt) {

                if (row6timesIndex != undefined && row6timesIndex > 0) {

                  if (cntDic[row6times[row6timesIndex - 1].dicCode] == step) {
                    nextIndex -= step
                  } else if (cntDic[row6times[row6timesIndex - 1].dicCode] > step) {
                    nextIndex = nextIndex - cntDic[row6times[row6timesIndex - 1].dicCode] + (index - getSummary(row6timesIndex));
                  } else {
                    nextIndex = nextIndex - ((cntDic[row6times[row6timesIndex - 1].dicCode] + Math.ceil((nextIndex - getSummary(row6timesIndex)) / 2)));
                  }

                } else {
                  nextIndex -= step;
                }

              } else {
                nextIndex--;
              }
            } else if (event.keyCode == 40 || event.keyCode == 13) {
              if (index < (row6timesItemCnt - cntDic[row6times[row6times.length - 1].dicCode])) {

                if (row6timesIndex != undefined && row6timesIndex < row6times.length) {

                  if (cntDic[row6times[row6timesIndex + 1].dicCode] == step) {
                    nextIndex += step;
                  } else if (cntDic[row6times[row6timesIndex + 1].dicCode] > step) {
                    nextIndex = nextIndex + cntDic[row6times[row6timesIndex + 1].dicCode] - ((getSummary(row6timesIndex + 1) - index));
                  } else {
                    nextIndex = nextIndex + cntDic[row6times[row6timesIndex].dicCode] - Math.ceil(((nextIndex - getSummary(row6timesIndex)) / 2));
                  }

                } else {
                  nextIndex += step;
                }

              } else if (index < row6timesItemCnt) {

                nextIndex = nextIndex + step - Math.ceil((nextIndex - getSummary(row6timesIndex))); 

                // nextIndex += (step - index % step);
              } else nextIndex++;
            } else if (event.keyCode == 37) {
              nextIndex--
            } else if (event.keyCode == 39) {
              nextIndex++
            }

            if (nextIndex >= 0 && nextIndex < that.metaData.inputControl.length) {
              that.metaData.inputControl[nextIndex].focus();
            }
          },

          getWarningWhenSelectDate: function () {
            var that = this;
            return moment(that.formData.recordDate).format('YYYY-MM-DD') != moment(new Date()).format('YYYY-MM-DD');
          },
          preDay: function () {
            var that = this;
            that.checkNeedSave().then(function () {
              that.formData.recordDate = moment(new Date(that.formData.recordDate)).subtract(1, 'days').format('YYYY-MM-DD');
            });
          },
          nextDay: function () {
            var that = this;
            that.checkNeedSave().then(function () {
              that.formData.recordDate = moment(new Date(that.formData.recordDate)).add(1, 'days').format('YYYY-MM-DD');
            });
          },
          checkNeedSave: function (replaceOriginalData) {

            var deffered = $q.defer();
            var that = this;

            $timeout(function () {

              if (angular.element('.temperature-form__input__dirty').length > 0 || that.formData.skinTestInfo.length != that.metaData.originalSkinTestInfo.length) {
                that.metaData.isLoading = true;
                that.metaData.loadingContent = "正在保存数据";
                save(that.formData).then(function () {
                  that.metaData.isLoading = false;
                  that.metaData.loadingContent = "";

                  if (replaceOriginalData)
                    that.metaData.originalData = _.cloneDeep(that.formData.data);

                  deffered.resolve();
                }, function () {
                  that.metaData.isLoading = false;
                  that.metaData.loadingContent = "";
                  deffered.reject();
                });
              } else {
                deffered.resolve();
              }

            }, 50)



            return deffered.promise;
          },
          compareToOriginValue: function (newValue, oldValue) {
            newValue = newValue ? newValue : "";
            oldValue = oldValue ? oldValue : "";
            return newValue != oldValue ? 'temperature-form__input__dirty' : '';
          }
        },
        ok: save
      };

      modalService.open(openingModal);
    }

    function getSingleDayData(prams) {
      return Restangular.all($scope.loadData).getList(prams);
    }

    function getMeasureName(measureCode, key) {
      var measureItem = dic[key] && _.find(dic[key], function (dicItem) {
        return dicItem.dicCode === measureCode;
      });
      var measureName = measureItem && measureItem.dicName;

      return measureName || null;
    }

    function dataToServer(data, date, timeArr) {
      var tempData = [];
      var finalData = _.chain(data)
        .map(function (item, index) {
          var result = _.chain(item)
            .map(function (value, key) {
              if (value.recordDate) {
                delete value.recordDate;
              }
              var targetIndex = index === 0 ? -1 : index - 1;
              var measureItem = dic[key] && _.find(dic[key], function (dicItem) {
                return value && dicItem.dicCode === value.measureCode;
              });
              var measureName = measureItem && measureItem.dicName;
              var merged = {
                measureName: measureName || null
              };

              if (key === 'skinTestInfo' && value) {
                delete merged.measureName;
              }

              // 事件时间格式为YYYY-MM-DD HH:mmss
              if (key === 'event') {
                // if (!value.timePoint) {
                //   $scope.$emit('toast', {
                //     type: 'warning',
                //     content: '事件日期不能为空！'
                //   });
                //   throw Error('事件日期不能为空！');
                // }
                if (value.timePoint) {
                  merged.timePoint = moment(date + ' ' + value.timePoint + ':00').format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
                }
              }

              var dateToSave = moment(date + ' ' + (timeArr[targetIndex] || '00') + ':00').format('YYYY-MM-DDTHH:mm:ss.SSSZZ');

              var findIndex = _.findIndex($scope.config.clickToSetInputTwiceValue, function (twiceValueItem) {
                return twiceValueItem.dicCode === key;
              });

              if (findIndex > -1) {
                tempData.push(_.assign({
                  vitalSigns: key,
                  vitalSignsValues: _.get(value, 'twiceVitalSignsValues[1]'),
                  seqId: _.get(value, 'seqIds[1]') || null,
                  inhosCode: $scope.patientInfo.inhosCode,
                  patCode: $scope.patientInfo.patCode,
                  measureCode: _.get(value, 'twiceVitalSignsMeasureCode[1]') || '01',
                  measureName: getMeasureName(_.get(value, 'twiceVitalSignsMeasureCode[1]') || '01', key) || measureName,
                  recordDate: generateFullDate(date, +timeArr[targetIndex] + 2, 'YYYY-MM-DDTHH:mm:ss.SSSZZ')
                }));

                return _.assign(value, {
                  vitalSigns: key,
                  vitalSignsValues: _.get(value, 'twiceVitalSignsValues[0]'),
                  seqId: _.get(value, 'seqIds[0]') || null,
                  measureCode:  _.get(value, 'twiceVitalSignsMeasureCode[0]') || '01',
                  measureName: getMeasureName( _.get(value, 'twiceVitalSignsMeasureCode[0]') || '01', key) || measureName,
                  inhosCode: $scope.patientInfo.inhosCode,
                  patCode: $scope.patientInfo.patCode,
                  recordDate: dateToSave
                });

              } else {
                return _.assign({
                  vitalSigns: key,
                  vitalSignsValues: value.vitalSignsValues,
                  inhosCode: $scope.patientInfo.inhosCode,
                  patCode: $scope.patientInfo.patCode,
                  recordDate: dateToSave
                }, value, merged);
              }
            })
            // 过滤掉值为空的体征项
            .filter(function (filterItem) {
              
              if (filterItem.vitalSigns === 'skinTestInfo' && filterItem.measureCode) {
                return true;
              }
              return !!filterItem.vitalSignsValues;
            })
            .value();
          
          // 加入自定义项

          // if (index === 0) {
          //   result.push(customData);
          // }

          return result;
        })
        .mapKeys(function (item, key) {
          var targetIndex = parseInt(key);
          if (targetIndex === 0) {
            targetIndex = -1;
          } else {
            targetIndex -= 1;
          }

          // if (timeArr[targetIndex] === '24') {
          //   return moment(date + ' ' + '23:59:59').format('YYYY-MM-DD HH:mm:ss');
          // }
          return moment(date + ' ' + (timeArr[targetIndex] || '00') + ':00').format('YYYY-MM-DD HH:mm:ss');
        })
        .value();

      var group = _.groupBy(tempData, 'recordDate');
      delete group[moment(date + ' 00:00').format('YYYY-MM-DDTHH:mm:ss.SSSZZ')];
      _.forEach(group, function (value, key) {
        var valueIsEmpty = true;

        for(var i = 0; i < value.length; i++) {
          if (value[i].vitalSignsValues) {
            valueIsEmpty = false;
            break;
          }
        }
        
        finalData[moment(key).format('YYYY-MM-DD HH:mm:ss')] = !valueIsEmpty ? value : [];
      });

      return finalData;
    }

    function save(data) {
      var _data = _.cloneDeep(data);

      // 加入自定义数据
      _.forEach(_data.customRows, function (item) {
        _.set(_data.data[0], item.vitalSigns, item);
      });

      var skinTestInfo = {};

      // 处理皮试数据
      skinTestInfo.measureCode = _.chain(_data.skinTestInfo).map('measureCode').join(',').value();
      skinTestInfo.measureName = _.chain(_data.skinTestInfo).map(function (item) {
        var isCustomValue = _.chain($scope.config.skinTest).find({
          dicCode: item.measureCode
        }).get('isCustomValue').value()
        return isCustomValue ? item.measureName : _.chain($scope.config.skinTest).find({
          dicCode: item.measureCode
        }).get('dicName').value();
      }).join(',').value();
      skinTestInfo.vitalSignsValues = _.chain(_data.skinTestInfo).map('vitalSignsValues').join(',').value();
      skinTestInfo = _.assign({}, _.get(_data.skinTestInfo, 0), skinTestInfo);

      _.set(_data.data[0], 'skinTestInfo', skinTestInfo);

      var recordDate = data.recordDate;
      var timeArr = $scope.config.timesInterval.split(',');

      var dataServer = [{
        inhosCode: $scope.patientInfo.inhosCode,
        userCode: profile.userCode,
        vitalsignDatas: dataToServer(_data.data, recordDate, timeArr)
      }];

      return nursingRest.getVitalsigns('').customPOST(dataServer).then(function (response) {
        if (response) {
          $scope.$emit('toast', {
            type: 'success',
            content: '保存成功！'
          });

          vm.rootScope.$broadcast('firstLoadTempSheet');
          $scope.$emit('updatePatientEvaluateStatus');
        }
      });
    }
  }

})();
