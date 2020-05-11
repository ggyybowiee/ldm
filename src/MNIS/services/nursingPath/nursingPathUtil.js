(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('nursingPathUtil', nursingPathUtil)
    .filter('pathStatus', function () {
      return function (status) {
        if (status == "1") {
          return "入";
        } else if (status == "2") {
          return "出";
        } else return "";
      }
    });

  /** @ngInject */
  function nursingPathUtil(_) {

    var service = {
      dfsNodeForTables: dfsNodeForTables,
      dfsUpdateNodeHidden: dfsUpdateNodeHidden,
      prepareForSave: prepareForSave,
      initNodeExpand: initNodeExpand
    };


    function dfsNodeForTables(node, isRoot, nodesForTable, level, childAttrName) {

      if (!isRoot) {
        node.treeNode = {
          level: level,
          isExpanded: true,
          isHidden: false
        }
        nodesForTable.push(node);
      }

      _.get(node, childAttrName) && _.get(node, childAttrName).forEach(function (item) {
        dfsNodeForTables(item, false, nodesForTable, level + 1, childAttrName);
      });
    }

    function dfsUpdateNodeHidden(node, parentExpand, childAttrName) {

      node.treeNode.isHidden = !parentExpand;
      _.get(node, childAttrName) && _.get(node, childAttrName).forEach(function (item) {
        dfsUpdateNodeHidden(item, parentExpand && node.treeNode.isExpanded, childAttrName);
      });
    }

    function prepareForSave(node) {
      var savingNode = _.cloneDeep(node);
      delete savingNode.treeNode;
      return savingNode;
    }

    function initNodeExpand(node, isRoot, level, childAttrName) {

      if (!isRoot && (!_.get(node, childAttrName) || _.get(node, childAttrName).length == 0)) {
        node.treeNode.isExpanded = node.executeStatus;
      } else {
        var needExpand = false;
        _.get(node, childAttrName).forEach(function (item) {
          needExpand = initNodeExpand(item, false, level, childAttrName) || node.executeStatus || needExpand;
        });

        if (!isRoot) {          
          node.treeNode.isExpanded = needExpand || node.treeNode.level < level;
        } else return true;
      }
      return node.treeNode.isExpanded;
    }

    return service;
  }

})();
