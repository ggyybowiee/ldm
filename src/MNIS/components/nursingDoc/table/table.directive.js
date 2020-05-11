(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('nursingDocTable', nursingDocTable);

  /** @ngInject */
  function nursingDocTable(modalService, docUtil, _, sessionService, hospitalRest, nursingRecordTplUtil) {
    var directive = {
      restrict: 'E',
      scope: {
        header: '=',
        save: '&',
        tpl: '='
      },
      replace: true,
      templateUrl: 'MNIS/components/nursingDoc/table/table.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var watchers = {};

      watchers.header = scope.$watch('header', function (value) {
        if (value) {
          handlerHeader();
        }
      }, true);

      var dicHelper = sessionService.getDicHelper();
      var confHelper = sessionService.getConfHelper();

      scope.filter = {
        showType: 0
      }

      scope.dic = dicHelper.dic;
      scope.open = open;
      scope.del = del;
      scope.exchange = exchange;
      scope.imageOptions = {
        moduleName: 'mnisFile',
        sizeRules: {
          max: '1M'
        },
        suffixRules: ['jpg', 'png', 'jpeg']
      };
      scope.methods = {
        del: del,
        open: open,
        exchange: exchange
      };
      
      scope.tableHeadOption = docUtil.getCrosslineDic();
      scope.removeFormItem = removeFormItem;
      scope.addHeaderItem = addHeaderItem;
      scope.addOption = addOption;
      scope.isInCollection = function (collection, item) {
        if (!collection) {
          return true;
        }
        var found = _.find(collection, function (rowItem) {
          return item.dicCode === rowItem.dicCode;
        });

        return !found;
      };

      getWards();

      function getWards() {
        return hospitalRest.getWards().then(function (response) {
          scope.wardList = response;
          _.map(scope.wardList, function (item) {
            item.selected = false;
          });
          watchers.tpl = scope.$watch('tpl', function (newValue, oldValue) {
            _.map(scope.wardList, function (item) {
              if (newValue.wardCodes.indexOf(item.wardCode) > -1) {
                item.selected = true;
              }
            });
          }, true);
        });
      }

      // 清除$watcher
      scope.$on('$destroy', function () {
        Object.keys(watchers).forEach(function (watcherName) {
          watchers[watcherName]();
        });
      });


      function handlerHeader() {
        var header = angular.copy(scope.header);
        //让header形成树形结构
        _.each(header, function (item) {
          var sup;
          if (item.sup) {
            sup = _.find(header, {
              id: item.sup
            });
            sup.subs || (sup.subs = []);
            sup.subs.push(item);
          }
        });
        //处理二层title，计算width
        _.chain(header).filter({
          double: '1'
        }).map(function (item) {
          item.width = _.reduce(item.subs, function (memo, sub) {
            return memo + sub.width;
          }, 0) || 1;
          return item;
        }).value();
        scope.sups = _.chain(header).filter(function (item) {
          return !item.sup;
        }).sortBy('index').map(function (item) {
          item.subs = _.sortBy(item.subs, 'index');
          return item;
        }).value();
      }

      function del(data) {
        _.remove(scope.header, function (item) {
          return item.id === data.id;
        });
        if (+data.double) {
          _.remove(scope.header, function (item) {
            return item.sup === data.id;
          });
        }

        return true;
      }

      function open(arg) {
        var isEdit = _.isObject(arg),
          isSub = arg !== undefined,
          raw;
        if (isEdit) {
          raw = angular.copy(_.find(scope.header, {
            id: arg.id
          }));
        } else {
          raw = {
            id: _.chain(scope.header).pluck('id').concat(-1).max().value() + 1,
            font: '3.18'
          }
          if (isSub) {
            raw.sup = arg;
            raw.index = _.chain(_.chain(scope.sups).find({
              id: arg
            }).value().subs).pluck('index').concat(-1).max().value() + 1;
          } else {
            raw.double = '0',
              raw.index = _.chain(scope.sups).pluck('index').concat(-1).max().value() + 1;
          }
        }

        modalService.open({
          size: 'sm',
          templateUrl: 'MNIS/components/nursingDoc/table/table.modal.html',
          data: {
            formData: raw,
            metaData: {
              isEdit: isEdit,
              inputTypes: nursingRecordTplUtil.getNursingRecordInputType(),
              tableHeadOption: docUtil.getCrosslineDic()
            }
          },
          ok: function () {
            var reg = /^((?!_).)*$/;

            if (!reg.test(raw.key)) {
              scope.$emit('toast', {
                type: 'warning',
                content: '键值输入内容不能包括_'
              });
              return;
            }

            if (isEdit) {
              _.chain(scope.header).find({
                id: raw.id
              }).assign(raw, {
                font: raw.font
              }).value();
            } else {
              scope.header.push(raw);
            }

            return true;
          },
          methodsObj: {
            fonts: [{
              value: 3.18,
              text: '12px'
            }, {
              value: 3.44,
              text: '13px'
            }, {
              value: 3.704,
              text: '14px'
            }, {
              value: 3.97,
              text: '15px'
            }, {
              value: 4.24,
              text: '16px'
            }, {
              value: 4.50,
              text: '17px'
            }, {
              value: 4.77,
              text: '18px'
            }],
            doubleChange: function () {
              var vm = this;
              if (+vm.formData.double) {
                delete vm.formData.font;
                delete vm.formData.type;
                delete vm.formData.key;
                delete vm.formData.width;
              } else {
                vm.formData.font = '12';
              }
            },
            typeChange: function () {
              var vm = this;
              delete vm.formData.rule;
            },
            addOptions: function (prop) {
              var vm = this;
              // if (!vm[prop + 'Text']) return;
              if (!vm.formData.rule) vm.formData.rule = {};
              if (!vm.formData.rule[prop]) vm.formData.rule[prop] = [];
              if (vm.formData.rule[prop].indexOf(vm[prop + 'Text']) > -1) {
                vm[prop + 'Text'] = '';
                return;
              }
              vm.formData.rule[prop].push(vm[prop + 'Text']);
              vm[prop + 'Text'] = '';
            },
            delOptions: function (opt, prop) {
              var vm = this;
              vm.formData.rule[prop].splice(vm.formData.rule[prop].indexOf(opt), 1);

              return true;
            },
            addTpls: function () {
              var vm = this;
              if (!vm.tplText) return;
              if (!vm.formData.rule) vm.formData.rule = {};
              if (!vm.formData.rule.tpls) vm.formData.rule.tpls = [];
              if (vm.formData.rule.tpls.indexOf(vm.tplText) > -1) {
                vm.tplText = '';
                return;
              }
              vm.formData.rule.tpls.push(vm.tplText);
              vm.tplText = '';
            },
            delTpls: function (tpl) {
              var vm = this;
              vm.formData.rule.tpls.splice(vm.formData.rule.tpls.indexOf(tpl), 1);

              return true;
            }
          }
        })
      }

      function exchange(data, arr) {
        var pre = _.find(scope.header, {
            id: data.id
          }),
          next = _.find(scope.header, {
            id: arr[arr.indexOf(data) + 1].id
          });
        pre.index = pre.index ^ next.index;
        next.index = pre.index ^ next.index;
        pre.index = pre.index ^ next.index;
      }

      function addHeaderItem() {
        if (!Array.isArray(scope.tpl.headerFormItems)) {
          scope.tpl.headerFormItems = [];
        }

        scope.tpl.headerFormItems.push({});
      }

      function removeFormItem(index) {
        scope.tpl.headerFormItems.splice(index, 1);
      }

      function addOption(item) {
        modalService.open({
          templateUrl: 'MNIS/modules/estimateConfig/configForm/options.modal.html',
          size: 'md',
          data: {
            metaData: {
              options: item.opts || [],
              item: item
            },
            formData: {}
          },
          ok: function () {
            var that = this;
            that.metaData.item.opts = this.metaData.options;

            return true;
          },
          methodsObj: {
            setActive: function (option, index) {
              if (index === this.activeIndex) {
                this.formData = {};
                delete this.activeIndex;
                return;
              }

              this.formData = _.assign({}, option);
              this.activeIndex = index;
            },
            removeOption: function (index) {
              this.metaData.options.splice(index, 1);
            },
            addOption: function () {
              var modal = this;

              if (!modal.formData.id) {
                delete modal.formData.id;
              }

              if (angular.isUndefined(modal.activeIndex)) {
                modal.metaData.options.push(_.assign({
                  dicName: '',
                  dicCode: ''
                }, modal.formData));
              } else {
                modal.metaData.options[modal.activeIndex] = modal.formData;
              }

              delete modal.activeIndex;

              modal.formData = {};
              modal.metaData.item.opts = modal.metaData.options;
            },
            addDescrition: addDescrition
          }
        })
      }

      function addDescrition(option) {
        modalService.open({
          templateUrl: 'MNIS/modules/estimateConfig/configForm/description.modal.html',
          size: 'md',
          data: {
            formData: option.description || []
          },
          ok: function () {
            option.description = this.formData;
            return true;
          },
          methodsObj: {
            remove: function (index) {
              this.formData.splice(index, 1);
            },
            add: function () {
              this.formData.push('');
            }
          }
        })
      }
    }
  }

})();
