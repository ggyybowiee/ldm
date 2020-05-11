(function () {
  "use strict";
  angular
    .module("lachesis-mnis")
    .directive("onFinishRender", function ($timeout) {
      return {
        restrict: "A",
        link: function (scope) {
          if (scope.$last === true) {
            $timeout(function () {
              scope.$emit("isReadyToPrint");
            }, 500);
          }
        }
      };
    })
    .directive("estimateDoc", estimateDoc);

  /** @ngInject */
  function estimateDoc(
    $rootScope,
    $q,
    estimateUtil,
    sessionService,
    _,
    $location,
    Restangular,
    $timeout,
    moment,
    nursingRest,
    sysRest
  ) {
    var directive = {
      restrict: "EA",
      scope: {
        hlpgd: "=",
        tpl: "=",
        tplData: "=",
        save: "=",
        insert: "=",
        sheet: "=",
        remove: "=",
        patInfo: "=",
        reloadSheets: "&"
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, recordRest) {
        var vm = this;

        vm.getDicValue = $rootScope.getDicValue;
        vm.getHtml = $rootScope.getHtml;
        if (!$location.$$search.openOuter) {
          vm.contextMenuConfig = [
            [
              "在该行下方插入",
              function ($rowScope, $event) {
                var tableCount = $scope.hlpgd.tpl.components.tables.length;
                for (var i = 0; i < tableCount; i += 1) {
                  $scope.insert({
                    event: $event,
                    tableData: $scope.hlpgd.data[i],
                    tpl: $scope.hlpgd.tpl,
                    rowIndex: $rowScope.$index,
                    tableIndex: i,
                    tableCount: tableCount,
                    sheetId: $scope.sheet.sheetId
                  });
                }
              },
              function () {
                if (angular.element(".context").hasClass("editing-row")) {
                  return false;
                }

                return true;
              }
            ],
            [
              "删除该行",
              function ($rowScope, $event) {
                var tableCount = $scope.hlpgd.tpl.components.tables.length;
                for (var i = 0; i < tableCount; i += 1) {
                  $scope.remove($event, $scope.hlpgd.data[i], $rowScope.$index);
                }
              },
              function () {
                if (angular.element(".context").hasClass("editing-row")) {
                  return false;
                }

                return true;
              }
            ]
          ];
        } else {
          vm.contextMenuConfig = [];
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateDoc.tpl.html",
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, elem, attrs, ctrl, transclude) {

      var confHelper = sessionService.getConfHelper();
      var conf = confHelper.conf;
      var resource = Restangular.all("/mnis/patEventRecord");
      var listeners = {};

      sysRest.getHosInfo().then(function (response) {
        scope.hospitalName = response.hosDisplayName;
        scope.hospitalLogo = response.hosLogoPath;
      });

      // Commit by hsw
      // 在hlpgd监测事件中已经处理此部分内容，不需要重复执行
      // var pageSize = scope.hlpgd.tpl.size.split(',');
      // scope.pageWidth = pageSize[0] + 'mm';
      // scope.pageHeight = pageSize[1] + 'mm';
      // var marginStr = _.chain(scope.hlpgd.tpl.margin).map(function (val, key) {
      //   return 'margin-' + key + ': ' + val + 'mm;';
      // }).join('').value();
      // // 设置打印方向
      // scope.printDirection = '<style>@media print{@page {' + 'size: ' + pageSize[0] + 'mm ' + pageSize[1] + 'mm' + '}}</style>';

      getDiagnosis(scope.patInfo.inhosCode).then(function (response) {
        scope.diagnosis = response;
      });

      // scope.$on('getPrintRetouches', function () {
      //   getDiagnosis(scope.inhosCode).then(function (response) {
      //     scope.diagnosis = response;
      //   });
      // });

      function getDiagnosis(inhosCode) {
        return resource.customGET("", {
          inhosCode: inhosCode,
          event: 'diagnosis'
        });
      }

      // 打印数据处理

      scope.pages = [];
      scope.print = function () {};

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

      function splitPage() {
        var tableChunk = [];

        if (
          _.every(scope.hlpgd.data, function (item) {
            return item.length === 0;
          })
        ) {
          return;
        }

        _.forEach(scope.hlpgd.data, function (tableItem, tableIndex) {
          var chunk = scope.tableColumns[tableIndex].rowCount;
          tableChunk.push(_.chunk(tableItem, chunk));
        });

        scope.pages = _.zip.apply(null, tableChunk);

        $timeout(function () {
          console.log("ready");
        });

        if (angular.isFunction(arguments[1])) {
          scope.printFn = arguments[1];
          scope.printType = arguments[2];

          if (scope.pageLengthPrev === scope.pages.length) {
            setTimeout(function () {
              getDiagnosis(scope.patInfo.inhosCode).then(function (response) {
                scope.diagnosis = response;
                appendHtmlToPrint();
                scope.printFn(
                  angular.element(".print-wrap")[0].innerHTML +
                  scope.printDirection
                );
              });
            }, 1000);
          }

          scope.pageLengthPrev = scope.pages.length;
          scope.preSheetId = scope.sheet.sheetId;
        }
      }

      listeners.printReady = scope.$on("isReadyToPrint", function () {
        getDiagnosis(scope.patInfo.inhosCode).then(function (response) {
          scope.diagnosis = response;
          appendHtmlToPrint();
          if (scope.printFn) {
            scope.printFn(
              angular.element(".print-wrap")[0].innerHTML + scope.printDirection
            );
          }
        });
      });

      function appendHtmlToPrint() {
        var printHtml = angular
          .element(".source-wrap")
          .clone()
          .show()
          .removeClass("source-wrap");
        angular
          .element(".print-wrap")
          .html("")
          .append(printHtml);
        var trs = _.map(elem.find(".estimate-doc__table-original"), function (
          table
        ) {
          return angular
            .element(table)
            .find("tbody tr")
            .clone();
        });

        _.forEach(trs, function (trsInTable, index) {
          var chunk = scope.tableColumns[index].rowCount;
          trs[index] = _.chunk(trsInTable, chunk);
        });
        var zipedTrs = _.zip.apply(null, trs);

        // 最后一页不满一页时加空白表格
        _.forEach(zipedTrs, function (trs) {
          _.forEach(trs, function (tableTrs, index) {
            if (tableTrs) {
              var rowCount = _.get(scope, ["tableColumns", index, "rowCount"]);
              var diff = rowCount - tableTrs.length;

              if (diff > 0) {
                for (var i = 0; i < diff; i++) {
                  var emptyTr = angular.element(tableTrs[0]).clone();
                  emptyTr.find("td").html("");
                  tableTrs.push(emptyTr[0]);
                }
              }
            }
          });
        });

        _.forEach(zipedTrs, function (trs, index) {
          var tableWrap = angular.element(".print-wrap .estimateTable" + index);

          _.forEach(trs, function (tr, trIndex) {
            if (tableWrap.length > 0) {
              var firstData = _.get(scope.pages, [index, trIndex, 0]);
              var correctDiagnosis = getLatestItem(
                scope.diagnosis,
                _.get(firstData, "data.date") +
                " " +
                _.get(firstData, "data.time")
              );

              var strArr = _.chain(scope.hlpgd.tpl.retouch)
                .filter(function (item) {
                  return item.dicCode.toLowerCase().indexOf("time") < 0;
                })
                .map(function (item) {
                  return (
                    '<div class="pull-left retouch-item">' +
                    '<div class="doc-table__header-label">' +
                    item.dicName +
                    '：</div><div class="doc-table__header-value">' +
                    (correctDiagnosis[item.dicCode] || "") +
                    "</div>" +
                    "</div>"
                  );
                })
                .value();
              var headerWrap = tableWrap.prev().find(".doc-table__header");
              var retouchWrapped =
                '<div class="clearfix retouch-wrap">' +
                strArr.join("") +
                "</div>";
              headerWrap.find(".retouch-wrap").remove();
              headerWrap.find(".doc-header-form-wrap").remove();
              var headerFormWrap = angular.element(".doc-header-form-wrap")[0]
                .outerHTML;
              headerWrap.append(headerFormWrap);
              headerWrap.append(retouchWrapped);

              tableWrap
                .find("tbody")
                .eq(trIndex)
                .html("")
                .append(tr);
            }
          });

          if (scope.printType === "split") {
            // 多表分离打印
            tableWrap.find("table").each(function (tableIndex) {
              var copy = tableWrap.parent().clone();
              copy
                .find("table")
                .eq(tableIndex)
                .siblings()
                .remove();

              tableWrap
                .parent()
                .parent()
                .append(copy);

              // 删除空表
              if (copy.find("tbody td").length === 0) {
                copy.remove();
              }
            });
            tableWrap.parent().remove();
          }
        });
      }

      var tplWathcer = scope.$watch(
        "hlpgd",
        function (value) {
          if (!value) {
            return;
          }

          scope.tableColumns = estimateUtil.getTableHeader(
            value.tpl.components.tables,
            false
          );
          var pageSize = scope.hlpgd.tpl.size.split(",");
          scope.pageWidth = pageSize[0];
          scope.pageHeight = pageSize[1];

          var marginStr = _.chain(scope.hlpgd.tpl.margin)
            .map(function (val, key) {
              return "margin-" + key + ": " + val + "mm;";
            })
            .join("")
            .value();

          scope.padding = _.chain(scope.hlpgd.tpl.margin)
          .map(function (val, key) {
            return "padding-" + key + ": " + val + "mm;";
          })
          .join("")
          .value();

          // 设置打印方向
          scope.printDirection =
            "<style>@media print{@page {" +
            marginStr +
            "size: " +
            pageSize[0] +
            "mm " +
            pageSize[1] +
            "mm" +
            "}}</style>";
          // splitPage();
        },
        true
      );

      // 清除$watcher
      scope.$on("$destroy", function () {
        tplWathcer();
        Object.keys(listeners).forEach(function (name) {
          listeners[name]();
        });
      });

      scope.splitPage = splitPage;

      listeners.startPrint = scope.$on("startEstimatePrint", splitPage);

      scope.saveDoc = function (currentIndex, prevIndex, tableIndex) {
        if (typeof prevIndex === "undefined") {
          return;
        }

        scope
          .save(
            scope.hlpgd.data[tableIndex][prevIndex],
            tableIndex,
            scope.sheet.sheetId,
            scope.hlpgd
          )
          .then(function () {
            if (!scope.sheet.sheetId) {
              return;
            }
            nursingRest
              .getEvaluateData()
              .getList({
                sheetId: scope.sheet.sheetId
              })
              .then(function (response) {
                var tplData;
                if (angular.isArray(response) && response.length === 0) {
                  tplData = [];
                } else {
                  var group = _.groupBy(
                    _.map(response, function (row) {
                      var tableKey = Object.keys(row.data)[0];
                      return {
                        dataId: row.dataId,
                        sheetId: row.sheetId,
                        tableKey: tableKey,
                        data: row.data[tableKey]
                      };
                    }),
                    "tableKey"
                  );
                  tplData = group;
                }
                scope.hlpgd.data = tplData;

                // _.forEach(tplData.data, function(tableData) {
                //   _.forEach(tableData, function(rowData) {
                //     console.log("RowData", rowData);
                //   });
                // });
              });
          });

        getDiagnosis(scope.patInfo.inhosCode).then(function (response) {
          scope.diagnosis = response;
        });
      };

      scope.getHtml = function (str) {
        return str.replace(/\n/g, "<br />");
      };

      scope.getPageSize = function () {
        if (!scope.hlpgd || !scope.hlpgd.tpl) {
          return;
        }
        var pageSize = scope.hlpgd.tpl.size.split(",");
        scope.pageWidth = pageSize[0];
        scope.pageHeight = pageSize[1];
        var width = estimateUtil.mmToPt(pageSize[0]);
        var height = estimateUtil.mmToPt(pageSize[1]);

        var marginStr = _.chain(scope.hlpgd.tpl.margin)
          .map(function (val, key) {
            return "margin-" + key + ": " + val + "mm;";
          })
          .join("")
          .value();

        // 设置打印方向
        scope.printDirection =
          "<style>@media print{@page {" +
          marginStr +
          "size: " +
          pageSize[0] +
          "mm " +
          pageSize[1] +
          "mm" +
          "}}</style>";

        return {
          width: width + "pt",
          "min-height": height + "pt"
        };
      };

      //[start]外部打开页面 禁止点击事件
      scope.openOuter = $location.$$search.openOuter ?
        $location.$$search.openOuter :
        false;
      if ($location.$$search.openOuter) {
        angular.element(".estimate-preview").css("cursor", "not-allowed");

        var wrapper = document.querySelector(".estimate-preview");

        wrapper.addEventListener(
          "dblclick",
          function (event) {
            event.preventDefault();
            event.stopPropagation();
          },
          true
        );

        wrapper.addEventListener(
          "click",
          function (event) {
            event.preventDefault();
            event.stopPropagation();
          },
          true
        );

        wrapper.addEventListener(
          "mousedown",
          function (event) {
            // debugger
            if (event.button == 2 || event.button == 3) {
              event.preventDefault();
              event.stopPropagation();
            }
          },
          true
        );
      }
      //[end]外部打开页面 禁止点击事件

      // scope.getLatestRetouch = function () {

      // }
    }
  }
})();
