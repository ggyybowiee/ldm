(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('patientNursingPath', patientNursingPath);

  function patientNursingPath() {

    var directive = {
      restrict: "EA",
      scope: {
        patient: "=",
        sdkOperate: '=',
        saveDoc: '=',
        currentShift: '=',
        vitalSignRecordTime: '=',
        pathParamSelectedIndex: '='
      },
      replace: true,
      transclude: true,
      controller: function ($scope, $state, $q, moment, nursingRest, modalService, sessionService, _) {

        var vm = this;
        var nodesHasChild = [];

        initViewModel();

        // 初始化视图
        function initViewModel() {

          vm.shiftList = [];
          vm.pathTreeOption = {
            allowDeselect: false,
            nodeChildren: "childNodes",
            dirSelectable: false
          };

          vm.getPatientPath = getPatientPath;
          vm.refresh = refresh;
          vm.confirmToRemoveNode = confirmToRemoveNode;

          var patientWatcher = $scope.$watch('patient', function (value) {
            if (value) {
              getPatientPath().then(function () {
                vm.expandedPathNodes = vm.pathTreeCollection.slice();
                // console.log(vm.expandedPathNodes);
                if (vm.pathTreeCollection.length > 0) {
                  var selectedNode = vm.pathTreeCollection[vm.pathTreeCollection.length - 1];
                  if (selectedNode.childNodes.length > 0) {
                    vm.pathSelect(selectedNode.childNodes[0]);
                  }
                }
              });
            }
          })
          $scope.$on('$destroy', patientWatcher);

          var sheetWatcher = $scope.$watch('currentShift', function (value) {
            if (value && vm.selectedPathNode) {
              // vm.loadPathNode.func(value);
              vm.loadPathNode.func(value);
            }
          });
          $scope.$on('$destory', sheetWatcher);

          var pathIndexWatcher = $scope.$watch('pathParamSelectedIndex', function (value) {
            // 切换至路径执行表，默认显示第一个节点的第一个子节点
            if (value === 0) {
              getPatientPath().then(function () {
                vm.expandedPathNodes = vm.pathTreeCollection.slice();
                // console.log(vm.expandedPathNodes);
                if (vm.pathTreeCollection.length > 0) {
                  var selectedNode = vm.pathTreeCollection[0];
                  if (selectedNode.childNodes.length > 0) {
                    vm.pathSelect(selectedNode.childNodes[0]);
                  }
                }
              });
            }
          });
          $scope.$on('$destory', pathIndexWatcher);

          vm.loadPathNode = {
            func: refresh
          }

          vm.loadPathSummaryData = {
            func: pathSummary
          }
        }

        function confirmToRemoveNode(node, e) {
          var defer = $q.defer();
          e.preventDefault();
          e.stopPropagation();
          nursingRest.checkDeletePathNode(node.nodeId, $scope.patient.inhosCode).then(function (res) {
            if (res) {
              modalService.open({
                templateUrl: "common/directives/confirm/confirm.tpl.html",
                size: "sm",
                ok: function () {
                  return nursingRest.deletePathNode(node.nodeId, {
                    inhosCode: $scope.patient.inhosCode
                  }).then(function () {
                    getPatientPath();
                    $scope.$emit('toast', {
                      type: 'success',
                      content: '删除成功'
                    });
                    pathSummary();
                    defer.resolve();
                  },
                  function () {
                    defer.reject();
                  });
                },
                cancel: function () {
                  defer.reject();
                },
                data: {
                  metaData: {
                    title: "确定删除该节点？",
                    type: "confirm"
                  }
                }
              });
            }
          });

          return defer.promise;
        }

        function addIndexToNode(nodes, tier) {
          var tierIndex = _.isUndefined(tier) ? 0 : tier + 1;
          _.forEach(nodes, function (node) {
            node.tier = tierIndex;

            if (node.childNodeExecs) {
              addIndexToNode(node.childNodeExecs, tierIndex);
            }
          });
        }

        function getNodesHasChildren(nodes) {
          _.forEach(nodes, function (item) {
            if (item.childNodeExecs) {
              nodesHasChild.push(item);
              getNodesHasChildren(item.childNodeExecs);
            }
          });
        }

        function refresh(currentShift, node) {

          if (!node && !vm.selectedPathNode)
            return;

          var param = {
            inhosCode: $scope.patient.inhosCode,
            nodeId: (node && node.nodeId) || vm.selectedPathNode.nodeId,
            startTime: moment(currentShift.startTime).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(currentShift.endTime).format("YYYY-MM-DD HH:mm:ss")
          }

          nodesHasChild = [];
          vm.currentSelectedNodes = [];
          vm.expandedRightNodes = [];
          return nursingRest.getPatientPathNodeDetail(param).then(function (data) {
            var result = data && data.plain() || [];
            addIndexToNode(result);
            vm.currentSelectedNodes = result;
            getNodesHasChildren(result);
            vm.expandedRightNodes = nodesHasChild.slice();
          })
        }

        vm.activeIndex = 1;

        // 路径选择
        vm.pathSelect = function (node) {
          vm.isIdoc = false;
          vm.selectedPathNode = node;
          vm.showPathSummarize = false;
          if (!$scope.currentShift || (node.childNodes !== null && node.childNodes.length > 0)) {
            return;
          }
          vm.loadPathNode.func($scope.currentShift, node);
        };

        // 获取患者路径
        function getPatientPath() {
          vm.pathTreeCollection = [];
          return new Promise(function (resolve) {
            if ($scope.patient.pathStatus !== null) {
              nursingRest.getPatientPath({
                inhosCode: $scope.patient.inhosCode
              }).then(function (res) {
                vm.currentPath = res.plain();
                var tempArr = [];
                if (vm.currentPath.pathNodes && vm.currentPath.pathNodes.length > 0) {
                  _.forEach(vm.currentPath.pathNodes, function (item) {
                    var temp = {};
                    temp.attribute = item.pathNodeTpl.attribute;
                    temp.childNodes = item.pathNodeTpl.childNodes;
                    temp.nodeDate = item.pathNodeTpl.nodeDate;
                    temp.nodeId = item.pathNodeTpl.nodeId;
                    temp.nodeName = item.pathNodeTpl.nodeName;
                    temp.nodeTplId = item.pathNodeTpl.nodeTplId;
                    tempArr.push(temp);
                  })
                }
                vm.pathTreeCollection = tempArr;
                resolve();
              });
            }
          });
        }

        // 路径执行汇总表
        function pathSummary () {
          vm.selectedPathNode = null;
          return nursingRest.getPatientPathSummary({
            inhosCode: $scope.patient.inhosCode
          }).then(function (res) {
            var data = res.plain();
            vm.pathSummaryKeys = _.chain(data)
              .map(function (item) {
                return _.map(item.executeSummary, 'itemNodeName');
              })
              .flatten()
              .compact()
              .uniq()
              .value();
            _.forEach(data, function (item) {
              item.executeSummary = _.mapKeys(item.executeSummary, 'itemNodeName');
            });
            vm.pathSummaryData = data;
          });
        }

        // 删除node
        vm.removeNode = function (node) {
          return nursingRest.deletePathNode(node.nodeId, {
            inhosCode: $scope.patient.inhosCode
          }).then(function () {
            getPatientPath();
            $scope.$emit('toast', {
              type: 'success',
              content: '删除成功'
            });
            pathSummary();
          });
        }

        function handleNextData(data) {
          var tempArr = [];
          vm.pathTreeCollection = [];
          if (data.pathNodes && data.pathNodes.length > 0) {
            _.forEach(data.pathNodes, function (item) {
              var temp = {};
              temp.attribute = item.pathNodeTpl.attribute;
              temp.childNodes = item.pathNodeTpl.childNodes;
              temp.nodeDate = item.pathNodeTpl.nodeDate;
              temp.nodeId = item.pathNodeTpl.nodeId;
              temp.nodeName = item.pathNodeTpl.nodeName;
              temp.nodeTplId = item.pathNodeTpl.nodeTplId;
              tempArr.push(temp);
            })
          }
          vm.pathTreeCollection = tempArr;
          vm.expandedPathNodes = vm.pathTreeCollection.slice();
          vm.selectedPathNode = vm.pathTreeCollection[vm.pathTreeCollection.length - 1].childNodes[0];
          vm.pathSelect(vm.selectedPathNode);
        }

        function openGotoNextModal(title, type) {
          var lastNodeDate = vm.pathTreeCollection[vm.pathTreeCollection.length - 1].nodeDate;
          modalService.open({
            size: 'md',
            templateUrl: 'MNIS/directives/nursingPath/gotoNextDayOrNode.modal.html',
            data: {
              metaData: {
                title: title
              },
              formData: {
                nodeDate: moment(lastNodeDate).add(1, 'days').format('YYYY-MM-DD')
              }
            },
            ok: function (data) {
              if (!data.nodeDate) {
                $scope.$emit('toast', {
                  type: 'warning',
                  content: '请选择有效的日期'
                });
                return;
              }
              if (type === 'gotoNextDay') {
                return nursingRest.patientPathNextDay($scope.patient.inhosCode, data.nodeDate + ' 00:00:00').then(function (res) {
                  handleNextData(res.plain());
                });
              } else if (type === 'gotoNextNode') {
                return nursingRest.patientPathNextNode($scope.patient.inhosCode, data.nodeDate + ' 00:00:00').then(function (res) {
                  handleNextData(res.plain());
                });
              }
            }
          });
        }

        // 进入下一个节点
        vm.gotoNextNode = function () {
          openGotoNextModal('进入下一个节点', 'gotoNextNode');
        }

        // 进入下一天
        vm.gotoNextDay = function () {
          openGotoNextModal('进入下一天', 'gotoNextDay');
        }

        // 显示或影藏路径执行表
        vm.showOrHidePathSummarize = function () {
          vm.showPathSummarize = !vm.showPathSummarize;
          if (vm.showPathSummarize)
            vm.pathSummary();
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/directives/nursingPath/patientNursingPath.tpl.html"
    }

    return directive;
  }
})();
