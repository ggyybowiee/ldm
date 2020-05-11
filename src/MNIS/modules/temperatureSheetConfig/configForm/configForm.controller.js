(function () {
  'use strict';

  angular.module('lachesis-mnis').controller('TemperatureSheetConfigFormController', TemperatureSheetConfigController);

  /** @ngInject */
  function TemperatureSheetConfigController($scope, modalService, Restangular, sessionService, nursingRest, utilService, hospitalRest, estimateUtil, _) {
    var dicHelper = sessionService.getDicHelper();
    var confHelper = sessionService.getConfHelper();
    var dic = dicHelper.dic;

    var profile = sessionService.getProfile();
    var vm = this;
    // vm.default24Hour = ['stool', 'urine', 'totalInput'];
    vm.default24Hour = [];
    vm.defaultChart = ['pulse', 'temperature', 'cooledTemperature', 'heartRate'];
    vm.dic = dic;
    var chartLines = _.filter(vm.dic.vitalItem, function (item) {
      return vm.defaultChart.indexOf(item.dicCode) > -1;
    });
    vm.conf = confHelper.conf;
    vm.save = save;
    vm.getFinalVitalItems = getFinalVitalItems;
    vm.addClickItem = addClickItem;
    vm.addClick4HourItem = addClick4HourItem;
    vm.removeClickToSetItem = removeClickToSetItem;
    vm.removeClickToSet4HourItem = removeClickToSet4HourItem;
    vm.timesIntervals = ['1,5,9,13,17,21', '2,6,10,14,18,22', '3,7,11,15,19,23', '4,8,12,16,20,24'];
    vm.inputTypes = [{
      type: 'text',
      desc: '文本'
    }, {
      type: 'select',
      desc: '下拉单选'
    }, {
      type: 'multiSelect',
      desc: '下拉多选'
    }, {
      type: 'date',
      desc: '日期'
    }, {
      type: 'time',
      desc: '时间'
    }];
    vm.pageSize = [{
      value: '297,420',
      label: 'A3（纵）'
    }, {
      value: '420,297',
      label: 'A3（横）'
    }, {
      value: '210,297',
      label: 'A4（纵）'
    }, {
      value: '297,210',
      label: 'A4（横）'
    }, {
      value: '176,250',
      label: 'B5（纵）'
    }, {
      value: '250,176',
      label: 'B5（横）'
    }, {
      value: '184,260',
      label: '16K（纵）'
    }, {
      value: '260,184',
      label: '16K（横）'
    }];
    vm.drugList = [{
      name: '青霉素',
      code: 'qms'
    }, {
      name: '头孢',
      code: 'tb'
    }, {
      name: '新欧朗',
      code: 'xol'
    }, {
      name: '抗生素',
      code: 'kss'
    }];
    vm.dateTypes = [
      {
        type: 'byDay',
        text: '按日'
      },
      {
        type: 'byMonthAndDay',
        text: '按月-日'
      }
    ];
    vm.formData = {
      size: "210,297",
      statusList: [{
        dicName: '外出',
        dicCode: 'wc'
      }, {
        dicName: '请假',
        dicCode: 'qj'
      }, {
        dicName: '拒测',
        dicCode: 'jc'
      }, {
        dicName: '测不出',
        dicCode: 'cbc'
      }],
      headers: {
        date: '日期',
        inHosDays: '住院日期',
        surgeryOrElse: '手术或产后日数',
        dateType: 'byDay'
      },
      timesInterval: '',
      timesIntervalColors: [
        '#000000',
        '#000000',
        '#000000',
        '#000000',
        '#000000',
        '#000000'
      ],
      dataAreaXLines: [
        '#00f',
        '#00f',
        '#00f',
        '#00f',
        '#f40f06',
        '#00f',
        '#00f'
      ],
      dataAreaYLines: [
        '#f40f06',
        '#f40f06',
        '#f40f06',
        '#f40f06',
        '#f40f06',
        '#f40f06'
      ],
      chartLines: chartLines,
      row4Hour: [],
      row12Hour: [],
      row24Hour: _.filter(vm.dic.vitalItem, function (item) {
        return vm.default24Hour.indexOf(item.dicCode) > -1;
      }),
      clickToSetValue: {},
      clickToSetInputTwiceValue: []
    };

    vm.previewFormData = vm.formData;

    vm.validationOption = {};
    vm.customSkinTest = [];
    vm.bosySignList = [{
      name: '呼吸',
      code: 'breath'
    }, {
      name: '疼痛评分',
      code: 'pain'
    }, {
      name: '跌倒评分',
      code: 'fall'
    }];

    vm.openAddStatus = openAddStatus;
    vm.openDrug = openDrug;
    vm.openClickToSetValue = openClickToSetValue;
    vm.getPageSize = getPageSize;
    vm.removeCell = removeCell;
    vm.appendCell = appendCell;
    vm.removeProp = removeProp;

    vm.isInCollection = isInCollection;
    vm.getFinalDrugs = getFinalDrugs;
    vm.getFinalEventTypes = getFinalEventTypes;

    vm.removeItem = removeItem;

    vm.move = move;

    activate();

    function activate() {
      getWards();
      getTpl();
    }

    function getFinalEventTypes() {
      return vm.dic.eventType;
    }

    function getFinalDrugs() {
      var selectedDrugs = vm.formData.skinTest;
      // vm.selectedVitals = selectedDrugs.map(function (item) {
      //   var copy = item;
      //   var existItem = _.find(vm.selectedVitals, function (sItem) {
      //     return item.dicCode === sItem.dicCode;
      //   });
      //   if (existItem && typeof existItem.orderIndex !== 'undefined') {
      //     copy.orderIndex = existItem.orderIndex;
      //   }

      //   return copy;
      // });

      var finalItems = vm.dic.skinTestInfo.filter(function (item) {
        var isExist = _.find(selectedDrugs, function (vitalItem) {
          return vitalItem.dicCode === item.dicCode;
        });

        return !isExist;
      });

      return finalItems;
    }

    function getFinalVitalItems() {
      var selectedVitals = vm.formData.row4Hour.concat(vm.formData.chartLines, vm.formData.row12Hour, vm.formData.row24Hour);
      var selectedAtSameTime4HourVitals = vm.formData.row4Hour.concat(vm.formData.chartLines);
      vm.selectedVitals = selectedVitals.map(function (item) {
        var copy = item;
        var existItem = _.find(vm.selectedVitals, function (sItem) {
          return item.dicCode === sItem.dicCode;
        });
        if (existItem && typeof existItem.orderIndex !== 'undefined') {
          copy.orderIndex = existItem.orderIndex;
        }

        return copy;
      });

      var finalItems = vm.dic.vitalItem.filter(function (item) {
        var isExist = _.find(selectedVitals, function (vitalItem) {
          return vitalItem.dicCode === item.dicCode;
        });

        return vm.defaultChart.indexOf(item.dicCode) < 0 && !isExist;
      });

      vm.row6times = _.filter(selectedVitals, function (item) {
        var existIndex = _.findIndex(vm.formData.row24Hour, function (sItem) {
          return item.dicCode === sItem.dicCode;
        });

        return existIndex < 0;
      });

      // 设置可选的测量方式等
      var clickToSetSource = _.chain(selectedVitals).map(function (vital) {
          var key = vital.dicCode;
          if (!key) {
            return false;
          }
          return vm.dic[key];
        })
        .compact()
        .mapKeys(function (item) {
          return item[0].dicType;
        })
        .value();

      vm.clickToSetSource = clickToSetSource;
  
      vm.clickToSet4HourSource = selectedAtSameTime4HourVitals;

      return finalItems;
    }

    function addClickItem(key, values) {
      if (!vm.formData.clickToSetValue) {
        vm.formData.clickToSetValue = {};
      }
      vm.formData.clickToSetValue[key] = values;
    }

    function addClick4HourItem(item) {
      if (!vm.formData.clickToSetInputTwiceValue) {
        vm.formData.clickToSetInputTwiceValue = [];
      }
      vm.formData.clickToSetInputTwiceValue.push(item);
    }

    function removeClickToSetItem(key) {
      delete vm.formData.clickToSetValue[key];
    }

    function removeClickToSet4HourItem(event, list, index) {
      event.originalEvent.stopPropagation();
      list.splice(index, 1);
    }

    function getTpl() {
      if (!profile.wardCode) {
        doWatch();
        return;
      }
      return nursingRest.getTempConfig().customGET('', {
        wardCode: profile.wardCode
      }).then(function (response) {

        if (!_.get(response, "config")) {
          toggleSkinTest()
          return;
        }

        var data = response.config;
        // 使配置中的曲线数据字典dicName是最新的
        if (!data.chartLines) {
          data.chartLines = chartLines;
        } else {
          chartLines.forEach(function (item, index) {

            var vitalTypeItem = _.find(data.chartLines, {
              'dicCode': item.dicCode
            });
            if (vitalTypeItem != undefined)
              vitalTypeItem.dicName = item.dicName;
          });
        }

        //   X轴标尺线
        data.dataAreaXLines = data.dataAreaXLines || [
          '#00f',
          '#00f',
          '#00f',
          '#00f',
          '#f40f06',
          '#00f',
          '#00f'
        ];
        //Y轴标尺线 
        data.dataAreaYLines = data.dataAreaYLines || [
          '#f40f06',
          '#f40f06',
          '#f40f06',
          '#f40f06',
          '#f40f06',
          '#f40f06'
        ]

        vm.formData = data;
        
        if (typeof vm.formData.headers.dateType === 'undefined') {
          vm.formData.headers.dateType = 'byDay';
        }

        vm.previewFormData = data;
        // vm.isSkinTest = !_.isEmpty(vm.formData.skinTest);
        toggleSkinTest()
        doWatch();
      });
    }

    var PAPER_RATIO = 2.8238;

    function mmToPt(num) {
      if (!num) {
        return 0;
      }
      return parseInt(num - 20, 10) * PAPER_RATIO;
    }

    function removeProp(prop) {
      delete vm.formData[prop];
    }

    function doWatch() {
      $scope.$watch('vm.formData.components.tables', function (newValue) {
        vm.prevoewColumns = estimateUtil.getTableHeader(newValue, true);
      }, true);
    }

    function openAddStatus(item) {
      modalService.open({
        templateUrl: 'MNIS/modules/temperatureSheetConfig/configForm/status.modal.html',
        size: 'sm',
        data: {
          metaData: {
            item: item
          },
          formData: item || {}
        },
        ok: function () {
          var that = this;
          if (!vm.formData.statusList) {
            vm.formData.statusList = [];
          }
          vm.formData.statusList.push(that.formData);
        }
      });
    }

    function openClickToSetValue(key) {
      modalService.open({
        templateUrl: 'MNIS/modules/temperatureSheetConfig/configForm/clickToSetValue.modal.html',
        size: 'lg',
        data: {
          metaData: {
            items: _.cloneDeep(vm.formData.clickToSetValue[key]),
            key: key
          },
          formData: {}
        },
        ok: function () {
          var that = this;
          vm.formData.clickToSetValue[key] = that.metaData.items;

          return true;
        },
        methodsObj: {
          setFormData: function (option) {
            var that = this;
            that.formData = option;
            if (typeof option.saveValue === 'undefined' || option.saveValue === null) {
              option.saveValue = option.dicName;
            }

            if (typeof option.nameInSheet === 'undefined' || option.nameInSheet === null) {
              option.nameInSheet = option.dicName;
            }
          }
        }
      });
    }

    function move(collection, type, orderIndex) {
      var index = _.findIndex(collection, function (item) {
        return orderIndex === item.orderIndex;
      });

      if (typeof collection[index].orderIndex === 'undefined') {
        collection.forEach(function (item, index) {
          item.orderIndex = index;
        });
      }
      
      if (type === 'up') {
        if (collection[index].orderIndex === 0) {
          return;
        }
        var prevIndex = _.findIndex(collection, function (item) {
          return item.orderIndex === collection[index].orderIndex - 1;
        });
        collection[prevIndex].orderIndex = collection[index].orderIndex;
        collection[index].orderIndex -= 1;
      }

      if (type === 'down') {
        if (collection[index].orderIndex === vm.selectedVitals.length - 1) {
          return;
        }
        var nextIndex = _.findIndex(collection, function (item) {
          return item.orderIndex === collection[index].orderIndex + 1;
        });
        collection[nextIndex].orderIndex = collection[index].orderIndex;
        collection[index].orderIndex += 1;
      }
    }

    function isInCollection(collection, item) {
      if (!collection) {
        return true;
      }
      var found = _.find(collection, function (rowItem) {
        return item.dicCode === rowItem.dicCode;
      });

      return !found;
    }

    function openDrug(list, item) {
      modalService.open({
        templateUrl: 'MNIS/modules/temperatureSheetConfig/configForm/drug.modal.html',
        size: 'sm',
        data: {
          metaData: {
            list: list,
            item: item
          },
          formData: item || {}
        },
        ok: function () {
          var that = this;
          if (that.metaData.list) {
            that.metaData.list.push(that.formData);
          }

          return true;
        }
      })
    }

    function getWards() {
      return hospitalRest.getWards().then(function (response) {
        vm.wards = response;
      });
    }

    function removeItem(event, list, index) {
      event.originalEvent.stopPropagation();
      list.splice(index, 1);
    }

    function toggleSkinTest() {

      if (!angular.isArray(vm.formData.skinTest))
        vm.formData.skinTest = [];
      _.forEach(vm.dic.skinTestInfo, function (item) {
        if (!_.find(vm.formData.skinTest, {
            'dicCode': item.dicCode
          })) {
          vm.formData.skinTest.push(item);
        }
      })
      return;
    }

    function appendCell(column) {
      column.push({
        id: utilService.guid(),
        title: '标题' + Number(column.length + 1),
        colspan: '1',
        rowspan: '1',
        textAlign: 'center',
        dataType: 'text',
        dataBind: 'hearRate',
        children: [],
        validator: function () {}
      });
    }

    function removeCell(collection, index, parentCollection) {
      collection.splice(index, 1);
      parentCollection.colspan = parentCollection.children.length === 0 ?
        1 :
        parentCollection.children.length;
    }

    function getPageSize() {
      var size = vm.formData.size ?
        vm.formData.size.split(',') : [297, 210];
      return {
        width: mmToPt(size[0]) + 'pt',
        height: mmToPt(size[1]) + 'pt'
      };
    }


    function save() {
      var data = angular.merge({}, vm.formData);
      console.log("Save Data", data);
      // 使配置中的曲线数据字典dicName是最新的
      if (!data.chartLines) {
        data.chartLines = chartLines;
      } else {
        chartLines.forEach(function (item, index) {
          var vitalTypeItem = _.find(data.chartLines, {
            'dicCode': item.dicCode
          });
          if (vitalTypeItem != undefined)
            vitalTypeItem.dicName = item.dicName;
        });
      }

      vm.previewFormData = data;
      nursingRest.getTempConfig().customPOST({
        config: data,
        wardCode: profile.wardCode
      }).then(function () {
        $scope.$emit('toast', '保存成功');
      });
    }
  }
})();
