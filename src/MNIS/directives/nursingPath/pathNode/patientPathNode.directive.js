(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("patientPathNode", patientPathNode);

  /** @ngInject */
  function patientPathNode(nursingPathUtil) {
    var directive = {
      restrict: "E",
      scope: {
        currentSelectedNodes: "=",
        expandedRightNodes: "=",
        vitalSignRecordTime: "=",
        selectedPathNode: "=",
        refresh: "=",
        patient: "=",
        sdkOperate: "=",
        selectMethod: "=",
        getPatientPath: "=",
        saveDoc: "=",
        currentShift: "="
      },
      templateUrl: "MNIS/directives/nursingPath/pathNode/patientPathNode.tpl.html",
      controllerAs: "vm",
      bindToController: true,

      controller: function (
        $scope,
        $q,
        modalService,
        moment,
        sessionService,
        sysService,
        mnisSessionCache,
        $timeout,
        nursingRest,
        _,
        docRest
      ) {
        var vm = this,
          profile = sessionService.getProfile();
        var sdk = window.sdk;

        initModelView();
        // 初始化视图
        function initModelView() {
          vm.shiftList = [];
          vm.pathRightTreeOption = {
            allowDeselect: false,
            nodeChildren: "childNodeExecs",
            dirSelectable: true
          };

          vm.queryParams = {
            recordTimeIndex: 0
          };

          // 执行频率字典
          vm.frequencyDic = [{
              dicCode: "DAY",
              dicName: "每天"
            },
            {
              dicCode: "SHIFT",
              dicName: "每班"
            },
            {
              dicCode: "ONCE",
              dicName: "一次"
            }
          ];

          var watcher = $scope.$watch("vm.currentSelectedNodes", function (
            value
          ) {
            if (value) {
              loadSelectedNodesForTable();
              delete vm.editingDoc;
            }
          });
          $scope.$on("$destroy", watcher);

          // 批量结点提交
          vm.executeNodeBatchProc = {
            func: function (type, args) {
              if (type == "executeNodeBatch") {
                return executeNodeBatch();
              } else {
                return vm.executeNode(args[0], args[1]);
              }
            }
          };

          // 监听执行批量事件
          $scope.$on("pathExecuteNodeBatch", function () {
            vm.executeNodeBatchProc.func("executeNodeBatch");
          });
        }

        function loadSelectedNodesForTable() {

          vm.currentSelectedNodesForTable = [];
          nursingPathUtil.dfsNodeForTables({
              childNodeExecs: vm.currentSelectedNodes
            },
            true,
            vm.currentSelectedNodesForTable,
            0,
            "childNodeExecs"
          );

          nursingPathUtil.initNodeExpand({
            childNodeExecs: vm.currentSelectedNodes
          }, true, 2, 'childNodeExecs');

          _.forEach(vm.currentSelectedNodes, function (node) {
            nursingPathUtil.dfsUpdateNodeHidden(node, true, "childNodeExecs");
          })

          vm.editingCurrentSelectedNodesForTable = _.cloneDeep(
            vm.currentSelectedNodesForTable
          );

        }

        // 获取执行频率
        vm.getFrequency = function (frequency) {
          if (!frequency) {
            return null;
          }
          var obj = _.find(vm.frequencyDic, function (item) {
            return item.dicCode == frequency;
          });
          return obj.dicName;
        };

        // 执行node, 建议不用加载圈loading
        vm.executeNode = function (node) {
          var defer = $q.defer();

          var index = vm.editingCurrentSelectedNodesForTable.indexOf(node);
          var nodeDateString = moment(vm.currentSelectedNodes.nodeDate).format(
            "YYYY-MM-DD"
          );
          var vitalSignRecordDate = moment(
            new Date(nodeDateString + " " + vm.vitalSignRecordTime.value)
          ).format("YYYY-MM-DDTHH:mm:ss.SSSZZ");

          var param = {
            inhosCode: vm.patient.inhosCode,
            nodeId: node.nodeId,
            value: node.pathExecuteInfo === null ? "" : node.pathExecuteInfo.value,
            nodeTime: moment(vm.currentShift.startTime).format(
              "YYYY-MM-DDTHH:mm:ss.SSSZZ"
            ),
            recordDate: vitalSignRecordDate
          };

          if (node.executeStatus) {
            // 取消执行
            nursingRest.executeNode(param).then(
              function (data) {
                $scope.$emit("toast", {
                  type: "success",
                  content: "执行成功!"
                });
                _.merge(vm.currentSelectedNodesForTable[index], data.plain());
                vm.currentSelectedNodesForTable[index].treeNode = vm.editingCurrentSelectedNodesForTable[index].treeNode;
                vm.editingCurrentSelectedNodesForTable[index] = _.cloneDeep(
                  vm.currentSelectedNodesForTable[index]
                );
                defer.resolve();
                // Commit By Hsw: 不再需要更新父、子结点状态
                // setChildChecked(node);
                // setParentNode(node, vm.currentSelectedNodes);
              },
              function () {
                defer.reject();
              }
            );
          } else {
            // 执行
            node.executeStatus = 1;
            if (
              profile.userCode !== _.get(node, "pathExecuteInfo.executePerson")
            ) {
              $scope.$emit("toast", {
                type: "warning",
                content: "无法删除他人执行的节点!"
              });

              defer.reject();
              return defer.promise;
            }

            nursingRest.checkExecuteCancleNode(param).then(function (res) {
              if (res) {
                modalService.open({
                  templateUrl: "common/directives/confirm/confirm.tpl.html",
                  size: "sm",
                  ok: function () {
                    var that = this;

                    delete param.value;
                    return nursingRest.executeCancleNode(param).then(
                      function () {
                        $scope.$emit("toast", {
                          type: "success",
                          content: "取消执行成功!"
                        });
                        updateEditingNode(
                          that.metaData.editingNodeIndex,
                          "executeStatus",
                          0
                        );

                        updateEditingNode(
                          that.metaData.editingNodeIndex,
                          "pathExecuteInfo", {}
                        );
                        // Commit By Hsw: 不再需要更新父、子结点状态
                        // setChildChecked(node);
                        // setParentNode(node, vm.currentSelectedNodes);
                        defer.resolve();
                      },
                      function () {
                        defer.reject();
                      }
                    );
                  },
                  cancel: function () {
                    defer.reject();
                  },
                  data: {
                    metaData: {
                      title: "确定取消执行该项目吗？",
                      type: "confirm",
                      editingNodeIndex: index
                    }
                  }
                });
              }
            });
          }

          return defer.promise;
        };

        // 批量执行
        function executeNodeBatch() {
          var defer = $q.defer();

          var changedNodes = [];
          var now = new Date();

          var nodeDateString = moment(vm.currentSelectedNodes.nodeDate).format(
            "YYYY-MM-DD"
          );

          var vitalSignRecordDate = moment(
            new Date(nodeDateString + " " + vm.vitalSignRecordTime.value)
          ).format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
          var nursingDocRecordTime = moment(
            new Date(nodeDateString + " " + moment(now).format("HH:mm:ss"))
          ).format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
          var nodeTime = moment(vm.currentShift.startTime).format(
            "YYYY-MM-DDTHH:mm:ss.SSSZZ"
          );

          for (var i = 0; i < vm.currentSelectedNodesForTable.length; i++) {
            var originalValue =
              _.get(
                vm.currentSelectedNodesForTable[i],
                "pathExecuteInfo.value"
              ) || "";
            var editingValue =
              _.get(
                vm.editingCurrentSelectedNodesForTable[i],
                "pathExecuteInfo.value"
              ) || "";

            if (originalValue != editingValue) {
              changedNodes.push({
                inhosCode: vm.patient.inhosCode,
                nodeId: vm.editingCurrentSelectedNodesForTable[i].nodeId,
                value: editingValue === null ? "" : editingValue,
                nodeTime: nodeTime
              });
            }
          }

          if (changedNodes.length > 0) {
            nursingRest
              .executeNodeBatch({
                inhosCode: vm.patient.inhosCode,
                nodeId: vm.selectedPathNode.nodeId,
                recordDate: vitalSignRecordDate,
                recordTime: nursingDocRecordTime,
                pathExecList: changedNodes
              })
              .then(
                function (response) {
                  _.forEach(response.plain(), function (newItem) {
                    var changedItemIndex = _.findIndex(
                      vm.currentSelectedNodesForTable, {
                        nodeId: newItem.nodeId
                      }
                    );
                    updateEditingNode(
                      changedItemIndex,
                      "pathExecuteInfo",
                      newItem.pathExecuteInfo
                    );

                    updateEditingNode(
                      changedItemIndex,
                      "executeStatus",
                      newItem.executeStatus
                    );
                  });

                  $scope.$emit("toast", {
                    type: "success",
                    content: "路径执行成功!"
                  });
                  defer.resolve();
                },
                function () {
                  defer.reject();
                }
              );
          } else {
            $scope.$emit("toast", {
              type: "warning",
              content: "没有新的执行结点可以保存!"
            });

            defer.reject();
          }

          return defer.promise;
        }

        // 更新编辑记录内容
        function updateEditingNode(index, path, value) {
          if (index >= 0 && index < vm.currentSelectedNodesForTable.length) {
            _.set(vm.currentSelectedNodesForTable[index], path, value);
            _.set(
              vm.editingCurrentSelectedNodesForTable[index],


              path,
              _.cloneDeep(value)
            );
          }
        }

        vm.text = function (customTip) {
          if (!customTip) {
            return "";
          }
          var tempTextArr = customTip.split("\n");
          var str = tempTextArr.join("<br>");
          return str;
        };

        // 打开IDOC文书
        function openIdoc(iDocNode, idoc) {
          var correctTpl = _.chain(vm.idocTpls)
            .find(function (tpl) {
              return tpl.tplId === idoc.tplId;
            })
            .value();

          idoc.showType = correctTpl ? correctTpl.showType || "null" : "null";
          idoc.itemText = correctTpl ? correctTpl.tplName : "未命名文书";

          vm.editingDoc = {
            iDocSheet: idoc,
            curNode: iDocNode
          };

          $timeout(function () {
            sdk
              .init({
                url: "DOC/viewer/index.html#/view-doc" + new Date().getTime(),
                containerSelector: "#path-idoc-modal-container"
              })
              .then(function () {
                vm.sdkOperate(idoc);
              });
          });
        }

        // 打开护理评估单
        function openHlpgd(estiamteNode) {
          if (estiamteNode.attribute.bindSheetId) {
            console.log("open hlpgd");
            nursingRest
              .getNursingSheetsById(estiamteNode.attribute.bindSheetId)
              .then(function (data) {
                var estiamteSheet = data.plain();
                vm.editingDoc = {
                  hlpgdSheet: estiamteSheet,
                  curNode: estiamteNode
                };
              });
          } else {
            console.log("create hlpgd");
            // 创建新单子
            nursingRest
              .updateNursingSheet({
                tplId: estiamteNode.attribute.bindTplId,
                tplName: estiamteNode.attribute.sheetTplName,
                nature: estiamteNode.attribute.sheetNature,
                wardCode: profile.wardCode,
                showType: estiamteNode.attribute.sheetShowType,
                inhosCode: vm.patient.inhosCode,
                category: estiamteNode.attribute.sheetCategory
              })
              .then(function (response) {
                var estiamteSheet = response.plain();
                vm.editingDoc = {
                  hlpgdSheet: estiamteSheet,
                  curNode: estiamteNode
                };
              });
          }
        }

        // 录入文书结点
        vm.toRecord = function (node) {
          if (node.attribute.sheetDataKey) {
            docRest
              .getAllIdocData({
                dataKey: node.attribute.sheetDataKey,
                key: "inhosCode=" + vm.patient.inhosCode
              })
              .then(function (res) {
                var result = res.plain();
                var idocObj = null;
                if (result.length > 0) {
                  idocObj = _.find(result, function (item) {
                    return item.status === 1;
                  });
                }

                if (idocObj) {
                  openIdoc(node, idocObj);
                } else {
                  docRest
                    .addData({
                      dataKey: node.attribute.sheetDataKey,
                      tplId: node.attribute.bindTplId,
                      showType: node.attribute.sheetShowType,
                      key: "inhosCode=" + vm.patient.inhosCode
                    })
                    .then(function (response) {
                      openIdoc(node, response.plain());
                    });
                }
              });
          } else {
            openHlpgd(node);
          }
        };

        //关闭文书编辑
        vm.closeDocEditing = function () {
          var param = {
            inhosCode: vm.patient.inhosCode,
            nodeId: vm.editingDoc.curNode.nodeId,
            startTime: moment(vm.currentShift.startTime).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(vm.currentShift.endTime).format("YYYY-MM-DD HH:mm:ss")
          }

          var changedItemIndex = vm.editingCurrentSelectedNodesForTable.indexOf(vm.editingDoc.curNode);
          nursingRest.getPatientPathNodeSingleDetail(param).then(function (data) {
            var editData = data.plain();
            updateEditingNode(
              changedItemIndex,
              "pathExecuteInfo",
              editData.pathExecuteInfo
            );

            updateEditingNode(
              changedItemIndex,
              "executeStatus",
              editData.executeStatus
            );

            updateEditingNode(
              changedItemIndex,
              "attribute",
              editData.attribute
            );

            delete vm.editingDoc;
            sdk.reset();
          });
        }

        // 路径结点展开/收起
        vm.nodeExpanderClick = function (node) {
          node.treeNode.isExpanded = !node.treeNode.isExpanded;
          nursingPathUtil.dfsUpdateNodeHidden(node, true, "childNodeExecs");
        }

        // 观察项键盘操作
        vm.observeItemInputKeydown = function (event) {

          var inputs = angular.element('.observe-item-input');
          var inputsArray = [];
          for (var i = 0; i < inputs.length; i++) {
            inputsArray.push(inputs[i]);
          }
          var index = inputsArray.indexOf(event.target);

          if ((event.keyCode == 38) && index > 0) {
            inputs.eq(index - 1).focus();
          } else if (event.keyCode == 40 || event.keyCode == 13) {
            inputs.eq(index + 1).focus();
          }
        }
      }
    };

    return directive;
  }
})();
