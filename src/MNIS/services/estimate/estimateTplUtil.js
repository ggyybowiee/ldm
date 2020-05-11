(function () {
  'use strict';

  angular.module('lachesis-mnis')
    .factory('estimateTplUtil', estimateTplUtil)
    .filter('optionSelectText', function (utilService) {
      return function (option) {
        if (option.text == option.value || !option.value) {
          return (option.text || "")
        } else {
          var scoreValue = "";
          if (option.value != undefined) {
            scoreValue = "(" + option.value + (utilService.isRealNum(option.value) ? "分" : "") + ")";
          }
          return (option.text || "") + scoreValue;
        }
      }
    }).filter('optionDisplayText', function () {
      return function (option) {
        return option.shortcut || option.value || option.text;
      }
    }).filter('headerDataBindCheck', function (_, estimateTplUtil) {
      return function (header) {
        return estimateTplUtil.headerDataBindCheck(header);
      }
    }).filter('headerDemoText', function () {
      return function (header) {
        if (header.dataType == "date")
          return "xxxx-xx-xx";
        else if (header.dataType == "time")
          return "xx:xx";
        else if (header.dataType == "datetime")
          return "xxxx-xx-xx xx:xx";
        else if (header.dataType == "signature")
          return "四位名字";

        return "123"
      }
    });


  /** @ngInject */
  function estimateTplUtil(_, utilService) {

    var service = {
      updateTplFromV1ToV11: updateTplFromV1ToV11,
      headerDataBindCheck: headerDataBindCheck,
      getPagePadding: getPagePadding,
      getVaraibleInFormula: getVaraibleInFormula
    };

    // 获取页面边距
    function getPagePadding(margin) {

      var padding = angular.copy(margin);
      if (!padding) {
        padding = {
          top: 5,
          right: 10,
          bottom: 0,
          left: 10
        }
      } else {
        padding.top = 5 + (utilService.isRealNum(padding.top) ? parseInt(padding.top) : 0);
        padding.right = 10 + (utilService.isRealNum(padding.right) ? parseInt(padding.right) : 0);
        padding.bottom = 0 + (utilService.isRealNum(padding.bottom) ? parseInt(padding.bottom) : 0);
        padding.left = 10 + (utilService.isRealNum(padding.left) ? parseInt(padding.left) : 0);
      }

      // console.log(padding);
      return padding;
    }

    function headerDataBindCheck(header) {

      var notes = [];
      if (header.isSum && header.dataBind != 'total') {
        notes.push("总和项的数据绑定编码必须为total，否则护理系统无法评估获取评估值");
      }

      if (header.dataType == 'date' && header.dataBind != 'date') {
        notes.push("日期项数据绑定编码为date时，才可以自动生成日期");
      } else if (header.dataType == 'time' && header.dataBind != 'time') {
        notes.push("时间项数据绑定编码为time时，才可以自动生成时间");
      } else if (header.dataType == 'signature' && header.dataBind != 'sign') {
        notes.push("签名项数据绑定编码为sign时，才可以自动完成签明");
      } else if (header.dataType == 'datetime' && header.dataBind != 'datetime') {
        notes.push("日期时间项数据绑定编码为datetime时，才可以自动生成时间");
      }

      if (notes.length == 0)
        return undefined;

      for (var i = 0; i < notes.length; i++) {
        notes[i] = (i + 1) + ". " + notes[i];
      }
      return notes;
    }

    function updateTplFromV1ToV11(tpl) {
      var tplV11 = angular.copy(tpl);
      tplV11.components.render = "v1_1";
      tplV11.orientation = tpl.orientation || 'horizon';
      tplV11.rowNum = tpl.rowNum || 20;
      tplV11.lineHeight = tpl.lineHeight || 20;
      tplV11.components.tableSpace = 5;

      var newTable = [];
      _.forEach(tpl.components.tables, function (table) {
        newTable.push(getV11HeaderFromV1(table, 0, 0));
      })
      tplV11.components.tablesV11 = newTable;

      // Commit by HSW
      // For Debug
      // console.log('Src V10:', tplV11.components.tables);
      // console.log('Des V11', newTable);
      // console.log('Tpl11', tplV11);

      return tplV11;
    }

    function getV11HeaderFromV1(header, bindCountDown, level) {

      var newHeader = {};

      if (level == 0) {
        // 表结点
        newHeader = {
          subHeaders: []
        }

        // 生成孩子结点
        _.forEach(header.tableHeader, function (item) {
          newHeader.subHeaders.push(getV11HeaderFromV1(item, 0, level + 1));
        })

      } else {
        // 表头结点

        if (level == 1) {
          // 第一层表头结点
          if (!header.dataBindTier)
            bindCountDown = 1
          else bindCountDown = parseInt(header.dataBindTier);
        }

        newHeader = {
          subHeaders: [],
          dataBind: header.dataBind,
          dataType: header.dataType || 'text',
          editable: header.editable || false,
          isDataBind: bindCountDown == 1,
          isValueHeader: true,
          textAlign: header.textAlign || 'center',
          title: header.title,
          isSum: header.isSum || false,
          isLevel: header.isLevel || false,
          countable: header.countable || false,
          opts: _.map(header.opts, function (item, index) {
            return {
              id: item.id || index,
              text: item.dicName || item.dicCode,
              value: item.dicCode || item.dicName,
              shortcut: item.shortcut
            }
          }),
          level: level
        };

        if (newHeader.dataType == "boolean") {
          newHeader.dataType = "multiSelect"
          newHeader.opts = [{
            id: 0,
            text: "是/否",
            value: 1,
            shortcut: "√"
          }];
        }

        // 生成孩子结点
        _.forEach(header.children, function (item) {
          newHeader.subHeaders.push(getV11HeaderFromV1(item, bindCountDown - 1, level + 1));
        })
      }

      return newHeader;
    }

    function getVaraibleInFormula(formula) {
      var characters = formula.split('');
      var varaibleList = [];
      var varaible = "";
      for (var i = 0; i < characters.length; i++) {
        if (characters[i] == ' ')
          continue;

        if (["+", "-", "*", "/", "(", ")"].indexOf(characters[i]) == -1) {
          varaible += characters[i];
        } else if (varaible) {
          varaibleList.push(varaible);
          varaible = "";
        }
      }

      if (varaible)
        varaibleList.push(varaible);

      return varaibleList;
    }

    return service;
  }
})();
