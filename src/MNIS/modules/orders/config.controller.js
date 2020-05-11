(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('OrderSliceConfController', OrderSliceConfController);

  /** @ngInject */
  function OrderSliceConfController(modalService, sessionService, ordersRest, _) {
    var vm = this, dicHelper = sessionService.getDicHelper();

    activate();

    function activate() {
      vm.load = {
        func: loadData,
        init: true
      };
      vm.del = del;
      vm.open = open;
      vm.dicHelper = dicHelper;
      vm.typeMaps = {
        '01': {
          format: 'n#x1#x2#x3',
          prefix: 'Q',
          reg: /^(\d+)(#\d{2})+$/
        },
        '02': {
          format: 'n-d#xx',
          prefix: 'D',
          reg: /^(\d+)-(\d+)(#\d{2})$/
        },
        '03': {
          format: 'd#xx-d#xx-d#xx',
          prefix: 'S',
          sep: '-',
          reg: /^[1-7](#\d{2})$/
        },
        '04': {
          format: 'd#xx-d#xx-d#xx',
          prefix: 'W',
          sep: '-',
          reg: /^[1-7](#\d{2})$/
        },
        '05': {
          format: '',
          prefix: 'N',
          reg: /^/,
          disabled: true,
          empty: true
        }
      }
    }

    function del(data) {
      return ordersRest.delSplitConfig(data.seqId).then(function () {
        vm.load.func();
      })
    }

    function loadData() {
      return ordersRest.getSplitConfig().then(function (data) {
        vm.list = data;
      })
    }

    function getHours(str) {
      return _.map(str.match(/(#\d{2})/g), function (item) {
        return item.slice(1);
      });
    }

    function hasSame(arr) {
      return !_.isEqual(_.uniq(arr), arr);
    }

    function open(raw) {
      var data = angular.copy(raw);
      modalService.open({
        size: 'sm',
        templateUrl: 'MNIS/modules/orders/config.modal.html',
        data: {
          formData: data || {
            splitType: '01',
            splitConf: 'Q'
          }
        },
        initFn: function () {
          var vm = this;
          vm.options = _.reject(vm.frequency, function (item) {
            return _.find(vm.list, function (config) {
              return config.execFreq === item.dicCode && item.dicCode !== _.get(raw, 'execFreq');
            });
          });
        },
        ok: function (data) {
          var _vm = this;
          if (raw) {
            return ordersRest.updateSplitConfig(data.seqId, data).then(function () {
              vm.load.func();
            });
          } else {
            return ordersRest.createSplitConfig(data).then(function () {
              vm.load.func();
            });
          }
        },
        methodsObj: {
          types: dicHelper.dic.orderDecomposeType,
          typeMaps: vm.typeMaps,
          typeChange: function () {
            var vm = this;
            vm.formData.splitConf = vm.typeMaps[vm.formData.splitType].prefix;
          },
          checker: function () {
            var vm = this, data = vm.formData, typeMap = vm.typeMaps[data.splitType], text = data.splitConf.slice(1),
              hours;
            if (typeMap.sep) {
              text = text.split(typeMap.sep);
            }
            if (!checkReg(typeMap.reg, text)) {
              console.log('reg');
              return;
            }
            if (!checkHour(text)) {
              console.log('hour')
              return;
            }
            if (!checkSpecial(text, typeMap.prefix)) {
              console.log('special')
              return;
            }
            return true;
          },
          list: vm.list,
          frequency: dicHelper.dic.frequency
        }
      });

      function checkReg(reg, str) {
        if (angular.isArray(str)) {
          return _.every(str, function (text) {
            return reg.test(text);
          });
        } else {
          return reg.test(str);
        }
      }

      function checkHour(str) {
        if (angular.isArray(str)) {
          return _.every(str, function (text) {
            return innerCheck(text);
          });
        } else {
          return innerCheck(str);
        }

        function innerCheck(text) {
          var hours = getHours(text);
          return _.every(hours, function (hour) {
            return +hour >= 0 && +hour < 24;
          });
        }
      }

      function checkSpecial(text, prefix) {
        if (prefix === 'Q') {
          var hourArr = getHours(text);
          return +_.first(text.match(/\d+/)) === hourArr.length && !hasSame(hourArr);
        } else if (prefix === 'W' && prefix === 'S') {
          var dayArr = _.map(text, function (str) {
            return str[0];
          });
          return !hasSame(dayArr);
        }
        return true;
      }

    }

  }
})();
