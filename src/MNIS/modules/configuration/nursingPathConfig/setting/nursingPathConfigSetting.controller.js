(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('NursingPathConfigSetting', NursingPathConfigSetting)
    .filter('pathBindTplName', function (_) {
      return function (pathTpl, list) {

        return _.get(_.find(list, {
          'tplId': pathTpl.bindSheetTpl
        }), 'tplName');

      }
    });

  /** @ngInject */
  function NursingPathConfigSetting($scope, $stateParams, sessionService, nursingPathRest, nursingPathUtil, nursingRest, docRest, sysRest, $timeout, modalService, _) {

    // 自动注入服务数据声明
    var vm = this;
    vm.profile = sessionService.getProfile();

    // 初始化
    initViewModel();

    function initViewModel() {

      // 执行频率字典
      vm.frequencyDic = [{
        dicCode: 'DAY',
        dicName: '每天'
      }, {
        dicCode: 'SHIFT',
        dicName: '每班'
      }, {
        dicCode: 'ONCE',
        dicName: '一次'
      }];

      //   加载
      vm.loadNursingPathTpl = {
        func: getNursingPathTpl,
        init: true
      }

      // 加载护理记录单列表
      nursingRest.getNursingDocs({
        wardCode: "",
        category: ""
      }).then(function (data) {
        vm.nursingDocList = data.plain();
      });

      vm.treeOption = {
        allowDeselect: false,
        nodeChildren: "childNodes",
        dirSelectable: true
      }

      vm.loadNodsForTableData = {
        func: loadNodsForTableData,
        init: false
      }

      vm.specialValueClick = false;
    }

    // 设置护理记录单模版
    vm.setHljldTpl = function () {

      modalService.open({

        templateUrl: 'MNIS/modules/configuration/nursingPathConfig/setting/nursingPathConfigHljfdPicker.modal.html',
        size: 'sm',
        initFn: function () {

          var that = this;
          var dic = sessionService.getDicHelper().dic;

          that.metaData.attendShowCategoryDic = {};
          for (var i = 0; i < dic.attendShowCategory.length; i++) {
            that.metaData.attendShowCategoryDic[dic.attendShowCategory[i].dicCode] = dic.attendShowCategory[i];
          }
        },
        data: {
          formData: {},
          metaData: {
            nursingDocList: vm.nursingDocList
          }
        },
        ok: function (data) {
          var that = this;
          if (!data.selectedTpl) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '请选择文书模板!'
            });
            return;
          }
          vm.nursingPathTpl.bindSheetTpl = data.selectedTpl.tplId;
          return nursingPathRest.updateNursingPathConfigByWardCode(vm.nursingPathTpl).then(function (response) {
            vm.nursingPathTpl = response.plain();
            $scope.$emit('toast', {
              type: 'success',
              content: '绑定成功!'
            });
          });
        },
        methodsObj: {
          selectedTpl: function (tpl) {
            var that = this;
            that.formData.selectedTpl = tpl;
          }
        }
      });
    }

    //获取护理路径模版
    function getNursingPathTpl(index, node, newNode) {

      vm.treeCollection = [];
      return nursingPathRest.getNursingPathConfigById($stateParams.tplId).then(function (res) {
        vm.nursingPathTpl = res.plain();

        if (vm.nursingPathTpl.pathNodes && vm.nursingPathTpl.pathNodes.length > 0) {
          for (var m = 0; m < vm.nursingPathTpl.pathNodes.length; m++) {
            var obm = vm.nursingPathTpl.pathNodes[m];
            obm.canAdd = true;
            if (obm.childNodes && obm.childNodes.length > 0) {
              for (var n = 0; n < obm.childNodes.length; n++) {
                var obn = obm.childNodes[n];
                obn.canAdd = false;
                obn.nodeChildren = obn.childNodes || [];
                obn.childNodes = null;
              }
            }
          }
        }

        vm.treeCollection = vm.nursingPathTpl.pathNodes || [];

        if (node) {
          var parentIndex = findParentIndex(node);
          vm.selectedNode = (vm.treeCollection[parentIndex].childNodes[vm.currentIndex]);
          loadNodsForTableData();

          vm.currentSelectedNode = {};
          // TODO: 查询该当前节点下的childNodes
          nursingPathRest.getNodeChildsByCurrentNode({
            pathTplId: $stateParams.tplId,
            nodeTplId: node.nodeTplId
          }).then(function (res) {

            var result = res.plain();
            if (!result.childNodes) {
              result.childNodes = [];
            }
            addIndexToNode(result.childNodes);
            vm.currentSelectedNode = result;

            if (newNode) {
              var index = _.findIndex(vm.expandedRightNodes, function (item) {
                return item.nodeTplId === newNode.nodeTplId;
              })
              if (index === -1) {
                vm.expandedRightNodes.push(newNode);
              }
            }
          });

        } else {
          // 默认选中第一个左侧第一个树
          if (vm.treeCollection.length > 0) {
            vm.selectedNode = vm.treeCollection[index || 0];
            if (vm.selectedNode.childNodes.length > 0) {
              vm.selectedNode = vm.selectedNode.childNodes[0];
              vm.expandedNodes = vm.treeCollection.slice();
              vm.select(vm.selectedNode, 0);
            }
          }
        }
      });
    }

    // 获取绑定文书模板list
    function getNursingDocList() {
      vm.loadNursingDocList = [];
      nursingRest.getNursingDocs({
        category: 'hlpgd',
        wardCode: vm.profile.wardCode
      }).then(function (data) {
        vm.loadNursingDocList = data;
        docRest.getDocs({
          category: 'MNIS-IN',
          wardCode: vm.profile.wardCode
        }).then(function (res) {
          for (var i = 0; i < res.length; i++) {
            vm.loadNursingDocList.push(res[i]);
          }
        })
      })
    }
    getNursingDocList();

    // 获取配置观察项list
    function getObservationItemConfig() {
      vm.observationItemList = [];
      sysRest.getObservationItemConfig({
        wardCode: vm.profile.wardCode
      }).then(function (res) {
        vm.observationItemList = res.plain();
      })
    }
    getObservationItemConfig();

    function addIndexToNode(nodes, tier) {
      var tierIndex = _.isUndefined(tier) ? 0 : tier + 1;
      _.forEach(nodes, function (node) {
        node.tier = tierIndex;

        if (node.childNodes) {
          addIndexToNode(node.childNodes, tierIndex);
        }
      });
    }

    function removeIndexToNode(nodes) {
      _.forEach(nodes, function (node) {
        if (node.tier !== null) {
          delete node.tier;
          removeIndexToNode(node.childNodes);
        }
      });
    }

    vm.select = function (node, index) {
      vm.specialValueClick = false;
      if (!node.nodeChildren) {
        return;
      }
      nodesHasChild = [];
      vm.currentSelectedNode = {};
      vm.currentIndex = index;
      vm.expandedRightNodes = [];

      // TODO: 查询该当前节点下的childNodes
      nursingPathRest.getNodeChildsByCurrentNode({
        pathTplId: $stateParams.tplId,
        nodeTplId: node.nodeTplId
      }).then(function (res) {

        var result = res.plain();

        if (!result.childNodes) {
          result.childNodes = [];
        }

        addIndexToNode(result.childNodes);
        vm.currentSelectedNode = result;

        getNodesHasChildren([result]);
        vm.expandedRightNodes = nodesHasChild.slice();

        loadNodsForTableData();
      });
    };

    function loadNodsForTableData() {
      var nodeForTables = [];
      vm.currentSelectedNodeForTable = [];
      nursingPathUtil.dfsNodeForTables({
        'childNodes': vm.currentSelectedNode.childNodes
      }, true, nodeForTables, 0, 'childNodes');
      vm.currentSelectedNodeForTable = nodeForTables
    }

    vm.editNode = function (node, e) {
      vm.stopPropagation(e);
      node.isEdit = true;
      $timeout(function () {
        var nodeInput = document.getElementById(node.nodeTplId);
        nodeInput.focus();
      }, 100)
    };

    vm.stopPropagation = function (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    vm.inputBlur = function (node, e) {
      vm.saveNode(node, e);
    }

    vm.removeNode = function (node, e) {
      // vm.stopPropagation(e);
      // TODO: 调用删除接口
      nursingPathRest.deleteNursingPathNode($stateParams.tplId, node.nodeTplId).then(function (data) {
        getNursingPathTpl(node.canAdd ? 0 : findParentIndex(node), null);
        modalService.close();
      });
    };

    vm.saveNode = function (node, e) {
      vm.stopPropagation(e);
      // TODO: 调用保存接口

      node.isEdit = false;
      node.isAdd = false;

      var children = [];
      if (node.childNodes && node.childNodes.length > 0) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var obi = node.childNodes[i];
          if (_.has(obi, 'nodeChildren')) {
            obi.childNodes = obi.nodeChildren;
            delete obi.nodeChildren;
          }
          delete obi.canAdd;
          children.push(obi);
        }
      }

      if (node.nodeChildren && node.nodeChildren.length > 0) {
        removeIndexToNode(node.nodeChildren);
        children = node.nodeChildren;
      }

      var param = {
        pathTplId: $stateParams.tplId,
        node: {
          nodeName: node.nodeName,
          nodeTplId: node.nodeTplId,
          childNodes: children
        }
      }

      nursingPathRest.updateNursingPathNode(param).then(function (data) {
        if (!findParentIndex(node)) {
          var index = _.findIndex(vm.treeCollection, function (item) {
            return item.nodeTplId === node.nodeTplId;
          });
          getNursingPathTpl(index === -1 ? false : index, null);
          return;
        }
        getNursingPathTpl(findParentIndex(node), null);
      });
    };

    vm.addNode = function (node) {
      var param = {
        pathTplId: $stateParams.tplId,
        node: {
          nodeName: '新节点'
        }
      }
      if (node) {
        param.parentNodeTplId = node.nodeTplId;
        nursingPathRest.addNursingPathNode(param).then(function (res) {
          var index = _.findIndex(vm.treeCollection, function (item) {
            return item.nodeTplId === node.nodeTplId;
          })
          getNursingPathTpl(index === -1 ? false : index, null);
        });
      } else {
        param.parentNodeTplId = '';
        nursingPathRest.addNursingPathNode(param).then(function (res) {
          getNursingPathTpl(null, null);
        });
      }
    };

    // 查询左侧父节点index
    function findParentIndex(node) {
      if (vm.treeCollection && vm.treeCollection.length > 0) {
        for (var m = 0; m < vm.treeCollection.length; m++) {
          var obm = vm.treeCollection[m];

          if (node.nodeTplId === obm.nodeTplId) {
            return null;
          }

          if (obm.childNodes && obm.childNodes.length > 0) {
            for (var n = 0; n < obm.childNodes.length; n++) {
              var obn = obm.childNodes[n];

              if (node.nodeTplId === obn.nodeTplId) {
                return m;
              }
            }
          }
        }
        return null;
      }
    }

    var nodesHasChild = [];

    function getNodesHasChildren(nodes) {
      _.forEach(nodes, function (item) {
        if (item.childNodes) {
          nodesHasChild.push(item);
          getNodesHasChildren(item.childNodes);
        }
      });
    }

    // 新建节点
    vm.createItem = function () {
      var param = {
        pathTplId: $stateParams.tplId,
        parentNodeTplId: vm.currentSelectedNode.nodeTplId,
        node: {
          nodeName: '新项目'
        }
      }
      nursingPathRest.addNursingPathNode(param).then(function (res) {
        getNursingPathTpl(null, vm.currentSelectedNode);
      });
    };

    // 文书模板改变时
    vm.docChange = function (attr, value) {
      if (value !== '') {
        attr.bindObserveItem = '';
      }
      var filterObj = _.find(vm.loadNursingDocList, function (item) {
        return item.tplId === attr.bindTplId;
      });

      attr.sheetDataKey = _.has(filterObj, 'dataKey') ? filterObj.dataKey : null;
      attr.sheetCategory = filterObj.category;
    };

    // 绑定观察项和绑定文书模板只能存在一个
    vm.bindObserveItemChange = function (attr, value) {
      if (value !== '') {
        attr.bindTplId = '';
      }
    }

    // 添加右侧节点
    vm.addRightNode = function (node) {
      var param = {
        pathTplId: $stateParams.tplId,
        parentNodeTplId: node.nodeTplId,
        node: {
          nodeName: '新项目'
        }
      }
      nursingPathRest.addNursingPathNode(param).then(function (res) {
        if (node.childNodes === null) {
          node.childNodes = [];
        }
        node.childNodes.push(res.plain());
        getNursingPathTpl(null, vm.currentSelectedNode, node);
      });
    };

    // 删除右侧节点
    vm.removeRightNode = function (node) {
      // TODO: 调用删除接口
      nursingPathRest.deleteNursingPathNode($stateParams.tplId, node.nodeTplId).then(function (res) {
        getNursingPathTpl(null, vm.currentSelectedNode);
        modalService.close();
        var index = _.findIndex(vm.expandedRightNodes, function (item) {
          return item.nodeTplId === node.nodeTplId;
        })
        if (index > -1) {
          vm.expandedRightNodes.splice(index, 1);
          loadNodsForTableData();
        }
      });
    };

    vm.goBack = function () {
      history.back();
    }

    vm.saveRightNode = function (node) {
      var children = [];

      if (node.childNodes && node.childNodes.length > 0) {
        var tempChildNodes = angular.copy(node.childNodes);
        removeIndexToNode(tempChildNodes);
        children = tempChildNodes;
      }

      var param = {
        pathTplId: $stateParams.tplId,
        node: {
          nodeName: node.nodeName,
          nodeTplId: node.nodeTplId,
          childNodes: children,
          attribute: node.attribute
        }
      }

      nursingPathRest.updateNursingPathNode(param).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '保存成功!'
        });

        // 更新右侧节点list
        nodesHasChild = [];
        vm.expandedRightNodes = [];
        // TODO: 查询该当前节点下的childNodes
        nursingPathRest.getNodeChildsByCurrentNode({
          pathTplId: $stateParams.tplId,
          nodeTplId: vm.currentSelectedNode.nodeTplId
        }).then(function (res) {
          vm.currentSelectedNode = {};
          var result = res.plain();
          if (!result.childNodes) {
            result.childNodes = [];
          }
          addIndexToNode(result.childNodes);
          vm.currentSelectedNode = result;

          getNodesHasChildren([result]);
          vm.expandedRightNodes = nodesHasChild.slice();
          loadNodsForTableData();
        });
      });
    }

    // 表格操作
    vm.nodeExpanderClick = function (node) {
      node.treeNode.isExpanded = !node.treeNode.isExpanded;
      nursingPathUtil.dfsUpdateNodeHidden(node, true, 'childNodes');
    }

    // textarea自动扩展高度
    vm.autoExpandHeight = function (e) {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }

    // 特殊值配置
    vm.specialValueConfig = function () {
      vm.specialValueClick = true;
      nursingPathRest.getNursingPathConfigById($stateParams.tplId).then(function (res) {
        vm.nursingPathTpl = res.plain();
        vm.selectedNode = null;
      });
    }
  }
})();
