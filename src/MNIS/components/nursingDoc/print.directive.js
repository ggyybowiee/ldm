(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('printNursingDoc', printNursingDoc);

  /** @ngInject */
  function printNursingDoc($timeout, $rootScope, $q, _) {
    var directive = {
      restrict: 'E',
      scope: {
        tpl: '=',
        data: '=',//绘制数据
        customColumns: '=',
        sheet: '=',
        pageCount: '=',
        sheetCount: '=',
        preview: '='
      },
      replace: true,
      templateUrl: 'MNIS/components/nursingDoc/print.tpl.html',
      link: linkFunc,
      controller: ctrlFunc,
      controllerAs: 'doc',
      bindToController: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var height = 72, top = 24, borderWidth = 0.2, padding = 10, size, unit, defer = $q.defer(), altPage, vm = scope.doc;
      var watchers = {};
      vm.pageNumberArr = vm.preview ? [] : new Array(vm.pageCount + vm.sheetCount);
      watchers.tplWacher = scope.$watch('doc.tpl', function(tpl) {
        if(tpl) {
          var pageSize = tpl.size.split(',');
          size = parseInt(pageSize[0]);
          unit = 'mm';
          // unit = tpl.size.match(/[a-zA-Z].*/)[0];
          vm.unit = unit;
          vm.rowsPerPage = _.range(tpl.rowNum);
          var docs = headlerCompnents();
          vm.headerDivs = docs.headers;
          vm.contentDivs = docs.contents;

          vm.docWidth = _.chain(docs.contents)
            .map('calcWidth')
            .reduce(function (meo, p) {
              return +meo + (+p);
            }, 0)
            .value();

          // if (vm.preview) {}
          vm.docWidthStyle = vm.preview ? 'auto' : 'calc(' + vm.docWidth + 'mm + ' + vm.contentDivs.length + 'px)';
          defer.resolve();
        }
      }, true);

      watchers.dataWacher = scope.$watch('doc.data', function(value) {
        var rows = 0;
        if(value) {
          defer.promise.then(function() {
            _.each(value, function(data) {
              data.$count = data.rowSize;
              rows += data.$count;
            });
            vm.pagesPerSheet = _.range(Math.ceil(rows / vm.tpl.rowNum));
            $timeout(function() {
              $rootScope.$broadcast('render');
            });
          });
        }
      }, true);

      watchers.previewWacher = scope.$watch('doc.preview', function (value) {
        if (value) {
          vm.pagesPerSheet = [1];
        }
      });

      // 清除$watcher
      scope.$on('destroyCanvasLinkWatchers', function () {
        Object.keys(watchers).forEach(function (watcherName) {
          watchers[watcherName]();
        });
      });

      function headlerCompnents() {
        var components = angular.copy(vm.tpl.components), headers, contents = [], totalUnit, cellWidth;
        //让header形成树形结构
        _.each(components, function(item) {
          var sup;
          if(item.sup) {
            sup = _.find(components, {
              id: item.sup
            });
            sup.subs || (sup.subs = []);
            sup.subs.push(item);
          }
        });
        headers = _.chain(components).filter(isText).sortBy('index').value();
        _.chain(headers).filter(isTop).each(function(item) {
          item.subs = _.sortBy(item.subs, 'index');
        }).value();
        _.each(headers, function(item) {
          if(isCommon(item)) {
            contents.push(item);
          }else {
            _.each(item.subs, function(sub) {
              contents.push(sub);
            });
          }
        })
        totalUnit = _.chain(contents).reduce(function(memo, item) {
          return memo + item.width;
        }, 0).value();
        cellWidth = ((size - padding * 2 - (contents.length + 1) * borderWidth) - contents.length / 10) / totalUnit;
        _.each(contents, function(item) {
          if(isBottom(item)) {
            item.calcWidth = +(item.width * cellWidth).toFixed(2);
          }
        })
        _.each(headers, function(item) {
          if(isCommon(item)) {
            item.calcWidth = +(item.width * cellWidth).toFixed(2);
          }else {
          }
          item.calcHeight = height;
        });
        return {
          headers: headers,
          contents: contents
        };
      }

      function calcDataRows(data) {
        if(data.rowSize === 0) {
          return 0;
        }else if(data.inOutStatistics) {
          return 1;
        }
        data = data.data;
        var result = 1;
        _.each(data, function(value, key) {
          var valLength = calcTextLength(value);
          var match = _.find(vm.contentDivs, {
            key: key
          });
          var count;
          if(match) {
            count = Math.ceil((valLength * +match.font) / match.calcWidth);
            result = Math.max(result, count);
          }
        });
        return result;
      }

      function calcTextLength(text) {
        var length = 0, exp = /[\u00ff-\uffff]/;
        _.each(text, function(unit) {
          if(exp.test(unit)) {
            length += 1;
          }else {
            length += 0.5;
          }
        });
        return length;
      }

      function isValue(item) {
        return item.double !== '1';
      }

      function isText(item) {
        return item.sup === undefined;
      }

      function isCommon(item) {
        return item.double === '0';
      }

      function isTop(item) {
        return item.double === '1';
      }

      function isBottom(item) {
        return item.sup !== undefined;
      }

    }

    function ctrlFunc(sessionService) {
      var configHelper = sessionService.getConfHelper();
      var conf = configHelper.conf;
      var vm = this;

      vm.conf = conf;

      vm.lineHeight = vm.tpl && vm.tpl.lineHeight || 26;

      vm.signType = _.get(conf, ['signShowImageOrName', 'configValue']);

      vm.getCustomTitle = function (key, pageNo) {
        var found = _.chain(vm.customColumns)
        .find(function (item) {
          return item.sheetId === vm.sheet.sheetId && pageNo === item.pageNo;
        }).value();
        return _.get(found, ['content', key]);
      }

      vm.getCustomValue = function (prefixKey, rowData) {
        var data;
        var key;
        var keys = _.keys(rowData);

        keys.forEach(function (itemKey) {
          if (itemKey.indexOf(prefixKey) > -1) {
            key = itemKey;
          }
        });

        if (angular.isDefined(key)) {
          data = rowData[key];
        }

        return data || '';
      }
    }
  }

})();
