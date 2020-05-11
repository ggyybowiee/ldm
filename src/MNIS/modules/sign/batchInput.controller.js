(function () {
  'use strict';

  angular.module('lachesis-mnis').controller('BatchInputController', BatchInputController);

  /** @ngInject */
  function BatchInputController($scope, recordRest, sessionService, nursingRest, moment, _, taskRemindRest, sysService, $timeout) {
    var vm = this;
    var profile = sessionService.getProfile();
    var dicHelper = sessionService.getDicHelper();

    vm.dicInfo = dicHelper.dic;
    vm.filter = {
      remindType: '-1',
      nursingLevelType: '-1'
    }
    vm.queryParams = {
      recordDate: new Date(),
      recordTime: '07:00:00'
    };
    vm.save = save;
    vm.selectedPatients = [];
    vm.timeList = {};
    vm.contextMenuConfig = [
      [
        '删除该行数据',
        function ($rowScope, $event) {
          deleteRow($rowScope.$index, $event);
        },
        function () {
          return true;
        }
      ]
    ];
    vm.tableHeader = [];
    vm.handlePatientsChange = handlePatientsChange;
    vm.deleteRow = deleteRow;
    vm.serCurrentRow = serCurrentRow;
    vm.getOptions = function (configs, code) {
      var found = _.find(configs, function (item) {
        return item.dicCode === code;
      });
      return found.opts;
    };
    vm.load = {
      func: handlePatientsChange,
      init: false
    };

    activate();

    function activate() {
      getPatients();
      getVitalsignsConfig();
      vm.load.func();
    }

    var watcher = $scope.$watch("vm.queryParams.recordTimeIndex", function (value) {
      if (vm.timeList && value != undefined) {
        vm.queryParams.recordTime = vm.timeList[value].value;
        getWardRemindEvent().then(function () {
          filterPatient(vm.filter.nursingLevelType != '-1' || vm.filter.remindType != '-1');
        })
      }
    });
    $scope.$on("$destroy", watcher);

    var remindTypeWatcher = $scope.$watch("vm.filter.remindType", function () {
      filterPatient();
    });
    $scope.$on("$destroy", remindTypeWatcher);

    var nursingLevelTypeWatcher = $scope.$watch("vm.filter.nursingLevelType", function () {
      filterPatient();
    });
    $scope.$on("$destroy", nursingLevelTypeWatcher);


    function getCurrentTimePoint() {
      var date = moment().format('YYYY-MM-DD');
      return sysService.getServerTime().then(function (response) {
        vm.queryParams.recordTimeIndex = 0;
        for (var i = 0; i < vm.timeList.length; i++) {
          if (Math.abs(moment(response).diff(moment(date + ' ' + vm.timeList[i].value))) < 2.0 * 3600 * 1000) {
            vm.queryParams.recordTimeIndex = i;
            break;
          }
        }
      });
    }

    function getPatients() {
      return recordRest.getPatientsByWard(profile.wardCode).then(function (data) {
        vm.originalPatients = data;
        vm.patients = _.map(data, function (item) {
          return {
            text: [item.bedCode, '床 ', item.patName].join(''),
            value: item.inhosCode,
            bedCode: item.bedCode,
            nurseLevel: item.nurseLevel
          };
        });
      });
    }

    // 获取病区体征提醒事件
    function getWardRemindEvent() {

      vm.filterRemind = {};
      var currentDate = moment(vm.queryParams.recordDate).format('YYYY-MM-DD');
      var queryDatetime = currentDate + ' ' + vm.queryParams.recordTime;

      return taskRemindRest.getTaskRemindInhos({
        wardCode: profile.wardCode,
        ruleType: 'vitalSign',
        recordDate: queryDatetime
      }).then(function (response) {
        vm.filterRemind = {};
        _.forEach(response, function (item) {
          vm.filterRemind[item.inhosCode] = item;
          var bindItemsDic = {};
          _.forEach(item.bindItems, function (bindItem) {
            bindItemsDic[bindItem.bindItem] = bindItem.content;
          })
          item.bindItems = bindItemsDic;
        });
      })
    }

    // 自定义过滤器
    function filterPatient() {

      var filteredPatients = [];
      var inhosCodes = [];
      _.forEach(vm.patients, function (patient) {

        if (vm.filter.remindType == "0" && vm.filterRemind[patient.value] == undefined)
          return;

        if (vm.filter.nursingLevelType != -1 && patient.nurseLevel != vm.filter.nursingLevelType)
          return;

        filteredPatients.push(patient);
        inhosCodes.push(patient.value);
      })

      vm.filteredPatients = filteredPatients;
      vm.vitalsigns = [];
      var filterSelectPatients = [];
      _.forEach(filteredPatients, function (item) {
        _.forEach(vm.selectedPatients, function (subItem) {
          if (subItem === item.value) {
            filterSelectPatients.push(subItem);
          }
        })
      })
      // vm.selectedPatients = inhosCodes;
      $timeout(function () {
        vm.load.func(filterSelectPatients);
      });
    }

    function handlePatientsChange(newValue) {
      var tempArr = [];
      if (newValue && newValue.length > 0 && vm.filteredPatients && vm.filteredPatients.length > 0) {
        _.forEach(vm.filteredPatients, function (item) {
          _.forEach(newValue, function (subItem) {
            if (subItem === item.value) {
              tempArr.push(subItem);
            }
          })
        })
      }
      
      var _newValue = (tempArr.length > 0 ? tempArr : null) || newValue || vm.selectedPatients;
      var sorted = [];
      _.each(_.sortBy(vm.patients, 'bedCode'), function (pat) {
        if (_newValue.indexOf(pat.value) > -1) {
          sorted.push(pat.value);
        }
      });

      var currentDate = moment(vm.queryParams.recordDate).format('YYYY-MM-DD');
      return getVitalsigns([
        currentDate + ' ' + vm.queryParams.recordTime,
        currentDate + ' ' + '00:00:00'
      ], sorted);
    }

    function deleteRow(index, e) {
      if (e) {
        e.stopPropagation();
      }
      var currentRow = vm.vitalsigns[index];

      _.forEach(currentRow, function (value, key) {
        if (key.indexOf('Type') === -1 && value.vitalSignsValues) {
          value.vitalSignsValues = undefined;
        }
      });

      var skinTestInfo = {};

      // 处理皮试数据
      skinTestInfo.measureCode = _.chain(currentRow.skinTestInfo).map('measureCode').join(',').value();
      skinTestInfo.measureName = _.chain(currentRow.skinTestInfo).map(function (item) {
        var isCustomValue = _.chain(vm.config.skinTest).find({
          dicCode: item.measureCode
        }).get('isCustomValue').value()
        return isCustomValue ? item.measureName : _.chain(vm.config.skinTest).find({
          dicCode: item.measureCode
        }).get('dicName').value();
      }).join(',').value();
      skinTestInfo.vitalSignsValues = _.chain(currentRow.skinTestInfo).map('vitalSignsValues').join(',').value();
      skinTestInfo = _.assign({}, _.get(currentRow.skinTestInfo, 0), skinTestInfo);

      _.set(currentRow, 'skinTestInfo', skinTestInfo);

      var data = dataToSave(currentRow);
      nursingRest.getVitalsigns('').customPOST(data).then(function (response) {
        if (response) {
          var finalResult = dataToShow(response.plain());
          vm.vitalsigns[index] = finalResult[0];
          vm.originalVitalSigns[index] = _.cloneDeep(finalResult[0]);
          $scope.$emit('toast', {
            type: 'success',
            content: '已删除！'
          });
          getWardRemindEvent();
        }
      });

      // var currentDate = moment(vm.queryParams.recordDate).format('YYYY-MM-DD');
      // var _recordDates = _.map([
      //   currentDate + ' ' + vm.queryParams.recordTime,
      //   currentDate + ' ' + '00:00:00'
      // ], function (item) {
      //   return item;
      // });
      
      // nursingRest.getVitalsigns().customDELETE('', {
      //   inhosCode: vm.vitalsigns[index].inhosCode,
      //   recordDates: _recordDates
      // }).then(function () {
      //   $scope.$emit('toast', {
      //     type: 'success',
      //     content: '已删除！'
      //   });
      //   vm.vitalsigns.splice(index, 1);
      //   vm.selectedPatients.splice(index, 1);
      //   vm.load.func();
      // });
    }

    function serCurrentRow(row) {
      vm.currentRow = row;
    }

    function getVitalsignsConfig() {
      return nursingRest.getTempConfig().customGET('', {
        wardCode: profile.wardCode
      }).then(function (response) {
        var data = response.plain();
        var config = data.config;
        vm.vitalsignsConfig = _.chain(config.chartLines.concat(config.row4Hour, config.row12Hour, config.row24Hour))
          .filter(function (item) {
            return item.dicCode !== 'skinTestInfo';
          })
          .map(function (item) {
            var copy = item;

            copy.opts = config.clickToSetValue[item.dicCode] || [];

            return copy;
          })
          .value();

        vm.config = config;
        vm.skinTestInfo = _.find(config.row24Hour, {
          dicCode: 'skinTestInfo'
        });

        function string2Options(str) {

          if (!str) {
            return [];
          }

          return _.chain(str)
            .split(',')
            .map(function (value) {
              return {
                dicCode: value,
                dicName: value
              };
            })
            .value();
        }

        var row35DegOptions = _.find(vm.dicInfo.evaluatePoint, function (item) {
          return config.row35Deg && config.row35Deg.dicCode === item.dicCode;
        });

        vm.row35DegOptions = row35DegOptions && string2Options(row35DegOptions.dicName);

        var row35DegChartOptions = _.find(vm.dicInfo.evaluatePoint, function (item) {
          return config.row35DegChart && config.row35DegChart.dicCode === item.dicCode;
        });

        vm.row35DegChartOptions = row35DegChartOptions && string2Options(row35DegChartOptions.dicName);

        vm.drugs = config.skinTest;
        vm.timeList = _.chain(config.timesInterval.split(','))
          .map(function (item) {
            var hour = item.length === 1 ? '0' + item : item;
            return {
              showName: hour + ':00',
              value: hour + ':00:00'
            };
          })
          .value();
        getCurrentTimePoint();
        vm.configItems = _.chain(config.chartLines.concat(config.row4Hour, config.row12Hour, config.row24Hour))
          .sortBy('orderIndex')
          .map(function (item) {
            var options = config.clickToSetValue[item.dicCode] || vm.dicInfo[item.dicCode] || [];
            return [{
              inputType: 'select',
              width: '90',
              dicCode: _.get(options, [0, 'dicType']) + 'Type',
              dicName: _.get(options, [0, 'dicTypeName']),
              isMeasure: true,
              isVisible: item.isShowMeasureInBatch && item.isShowItemInBatch,
              opts: options
            }, item];
          })
          .flatten()
          .filter(function (item) {
            return item.dicCode !== 'skinTestInfo';
          })
          .value();
      });
    }

    function getVitalsigns(recordDates, inhosCodes) {
      if (inhosCodes.length === 0) {
        vm.vitalsigns = [];
        return new Promise(function (resolve) {
          resolve(true);
        });
      }
      return nursingRest.getVitalsigns().getList({
        inhosCodes: inhosCodes,
        recordDates: recordDates
      }).then(function (response) {
        vm.resource = response;
        vm.vitalsigns = dataToShow(response.plain());
        vm.originalVitalSigns = _.cloneDeep(vm.vitalsigns);
      });
    }

    function dataToShow(data) {
      var finalData = _.chain(data)
        .map(function (item) {
          var patient = _.find(vm.originalPatients, function (patientItem) {
            return patientItem.inhosCode === item.inhosCode;
          });

          var vitalsigns = _.chain(item.vitalsignDatas)
            .map(function (vitalsignItem) {
              return vitalsignItem;
            })
            .flatten()
            .mapKeys(function (value) {
              return value.vitalSigns;
            })
            .value();

          // 加入措施/方式
          Object.keys(vm.config.clickToSetValue).forEach(function (key) {
            if (vitalsigns[key]) {
              vitalsigns[key + 'Type'] = {
                vitalSignsValues: vitalsigns[key].measureCode
              };
            }
          });

          if (vitalsigns.skinTestInfo) {
            vitalsigns.skinTestInfo = (Object.keys(vitalsigns.skinTestInfo).length > 0 && _.get(vitalsigns.skinTestInfo, 'measureCode')) ? _.chain(vitalsigns.skinTestInfo)
              .get('measureCode')
              .split(',')
              .map(function (measureCode, index) {
                var values = _.get(vitalsigns.skinTestInfo, 'vitalSignsValues');
                return _.assign({}, vitalsigns.skinTestInfo, {
                  measureCode: measureCode,
                  measureName: _.chain(vitalsigns.skinTestInfo).get('measureName').split(',').get(index).value(),
                  vitalSignsValues: values ? _.chain(values).split(',').get(index).value() : ''
                });
              })
              .value() : [];
          }

          return _.assign({
            inhosCode: patient.inhosCode,
            patName: patient && patient.patName,
            bedCode: patient && patient.bedCode
          }, vitalsigns);
        })
        .value();

      var plusData = _.filter(finalData, function (item) {
        return item.bedCode.indexOf('+') > -1;
      });
      var noPlusData = _.filter(finalData, function (item) {
        return item.bedCode.indexOf('+') == -1;
      });
      return plusData.concat(noPlusData);
    }

    function getCurrentDic(collection, dicCode) {
      return _.find(collection, {
        dicCode: dicCode
      });
    }

    function dataToSave(rowData) {
      var dataCopy = _.assign({}, rowData);
      var inhosCode = rowData.inhosCode;

      var patient = _.find(vm.originalPatients, function (patientItem) {
        return patientItem.inhosCode === inhosCode;
      });

      delete dataCopy.$$hashKey;
      delete dataCopy.patName;
      delete dataCopy.bedCode;
      delete dataCopy.inhosCode;

      // 将key带Type的值赋值到对应measure字段中
      Object.keys(dataCopy).forEach(function (key) {
        var measureKey = key;
        if (key.indexOf('Type') > -1) {
          measureKey = key.replace('Type', '');
          if (dataCopy[measureKey] && measureKey !== 'skinTestInfo') {
            dataCopy[measureKey].measureCode = dataCopy[key].vitalSignsValues;
            var foundMeasure = _.find(vm.config.clickToSetValue[measureKey], function (item) {
              return item.dicCode === dataCopy[key].vitalSignsValues;
            });
            dataCopy[measureKey].measureName = foundMeasure ? foundMeasure.dicName : null;
          }

          delete dataCopy[key];
        }
      });

      // 处理皮试
      if (dataCopy.skinTestInfo) {
        // var isCustomValue = _.chain(vm.drugs).find({ dicCode: dataCopy.skinTestInfo.measureCode }).get('isCustomValue').value();
        // dataCopy.skinTestInfo.measureName = isCustomValue ? dataCopy.skinTestInfo.measureName : _.find(vm.drugs, {dicCode: dataCopy.skinTestInfo.measureCode}).dicName;
      }

      var finalData = _.chain(dataCopy)
        .map(function (item, key) {
          var currentConfig = _.find(vm.vitalsignsConfig, function (sItem) {
            return sItem.dicCode === key;
          });
          var measures = currentConfig && vm.config.clickToSetValue[currentConfig.dicCode] || [];
          // 一天一次体征单独设置时间
          var is24Hour = null;
          // var is35Deg = vm.config.row35Deg && vm.config.row35Deg.dicCode === key;
          try {
            is24Hour = _.find(vm.config.row24Hour, {
              dicCode: currentConfig.dicCode
            });
          } catch (e) {
            if (key === 'skinTestInfo') {
              is24Hour = true;
            }
          }

          var obj = {
            inhosCode: inhosCode,
            measureCode: item.meatureCode || (currentConfig && (measures[0] && measures[0].dicCode) || 'moren'),
            measureName: currentConfig ? (measures[0] && measures[0].dicName) : '默认',
            patCode: patient.patCode,
            recordDate: is24Hour ? moment(moment(vm.queryParams.recordDate).format('YYYY-MM-DD') + ' ' + '00:00:00').format('YYYY-MM-DDTHH:mm:ss.SSSZZ') : moment(moment(vm.queryParams.recordDate).format('YYYY-MM-DD') + ' ' + vm.queryParams.recordTime).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
            seqId: item.seqId,
            units: currentConfig && currentConfig.unit || item.unit,
            vitalSigns: currentConfig && currentConfig.dicCode || item.vitalSigns || key
          };
          return _.assign({}, obj, item);
        })
        .compact()
        .groupBy(function (item) {
          return moment(item.recordDate).format('YYYY-MM-DD HH:mm:ss');
        }).value();

      _.chain(finalData)
        .keys(finalData)
        .forEach(function (dateTime) {
          finalData[dateTime] = finalData[dateTime].filter(function (filterItem) {
            if (filterItem.vitalSigns === 'skinTestInfo') {
              return !!filterItem.measureName;
            }

            return !!filterItem.vitalSignsValues;
          });
        })
        .value();

      return [{
        inhosCode: inhosCode,
        userCode: profile.userCode,
        vitalsignDatas: finalData
      }];
    }

    function checkRowIsChanged(row, originalRow) {
      var keys = Object.keys(row);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] === '$$hashKey') {
          continue;
        }

        if (keys[i] === 'skinTestInfo') {
          return true;
        }

        if (!originalRow[keys[i]] || originalRow[keys[i]].vitalSignsValues !== row[keys[i]].vitalSignsValues || originalRow[keys[i]].measureCode !== row[keys[i]].measureCode) {
          return true;
        }
      }

      return false;
    }

    function searchSubStr(str, subStr) {
      var positions = new Array();
      var pos = str.indexOf(subStr);
      while (pos > -1) {
        positions.push(pos);
        pos = str.indexOf(subStr, pos + 1);
      }
      return positions.length;
    }

    function save(currentRowIndex, prevIndex) {
      if (typeof prevIndex === 'undefined') {
        return;
      }
      // 无变化不保存
      if (!checkRowIsChanged(vm.vitalsigns[prevIndex], vm.originalVitalSigns[prevIndex])) {
        return;
      }
      var currentRow = vm.vitalsigns[prevIndex];

      if (currentRow.bloodPress && currentRow.bloodPress.vitalSignsValues) {
        var len = searchSubStr(currentRow.bloodPress.vitalSignsValues, '/');

        if (len !== 1) {
          $scope.$emit('toast', {
            type: 'warning',
            content: 'bloodPress不允许有非法参数'
          });

          return;
        }
      }

      var skinTestInfo = {};

      // 处理皮试数据
      skinTestInfo.measureCode = _.chain(currentRow.skinTestInfo).map('measureCode').join(',').value();
      skinTestInfo.measureName = _.chain(currentRow.skinTestInfo).map(function (item) {
        var isCustomValue = _.chain(vm.config.skinTest).find({
          dicCode: item.measureCode
        }).get('isCustomValue').value()
        return isCustomValue ? item.measureName : _.chain(vm.config.skinTest).find({
          dicCode: item.measureCode
        }).get('dicName').value();
      }).join(',').value();
      skinTestInfo.vitalSignsValues = _.chain(currentRow.skinTestInfo).map('vitalSignsValues').join(',').value();
      skinTestInfo = _.assign({}, _.get(currentRow.skinTestInfo, 0), skinTestInfo);

      _.set(currentRow, 'skinTestInfo', skinTestInfo);

      var saveData = function () {
        var data = dataToSave(currentRow);

        return nursingRest.getVitalsigns('').customPOST(data).then(function (response) {
          if (response) {
            var finalResult = dataToShow(response.plain());
            vm.vitalsigns[prevIndex] = finalResult[0];
            vm.originalVitalSigns[prevIndex] = _.cloneDeep(finalResult[0]);
            $scope.$emit('toast', {
              type: 'success',
              content: '保存成功！'
            });
            getWardRemindEvent();
          }
        });
      }

      return saveData();
    }

  }
})();
