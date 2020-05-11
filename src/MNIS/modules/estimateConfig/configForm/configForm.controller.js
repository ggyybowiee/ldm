(function () {
  "use strict";

  angular
    .module("lachesis-mnis")
    .controller("EstimateConfigFormController", controller);

  /** @ngInject */
  function controller(
    $scope,
    modalService,
    Restangular,
    sessionService,
    nursingRest,
    utilService,
    hospitalRest,
    estimateUtil,
    _,
    $stateParams,
    estimateTplUtil
  ) {
    var dicHelper = sessionService.getDicHelper();
    var dic = dicHelper.dic;
    var confHelper = sessionService.getConfHelper();

    var profile = sessionService.getProfile();
    var vm = this;
    vm.dic = dic;
    vm.conf = confHelper.conf;
    vm.save = save;
    vm.pageSize = [{
        value: "297,420",
        label: "A3（纵）"
      },
      {
        value: "420,297",
        label: "A3（横）"
      },
      {
        value: "210,297",
        label: "A4（纵）"
      },
      {
        value: "297,210",
        label: "A4（横）"
      },
      {
        value: "176,250",
        label: "B5（纵）"
      },
      {
        value: "250,176",
        label: "B5（横）"
      },
      {
        value: "184,260",
        label: "16K（纵）"
      },
      {
        value: "260,184",
        label: "16K（横）"
      }
    ];

    vm.inputTypes = [{
        type: "text",
        desc: "文本"
      },
      {
        type: "textarea",
        desc: "多行文本"
      },
      {
        type: "multiSelect",
        desc: "多选"
      },
      {
        type: "radio",
        desc: "单选"
      },
      {
        type: "boolean",
        desc: "布尔"
      },
      {
        type: "select",
        desc: "下拉单选"
      },
      {
        type: "date",
        desc: "日期"
      },
      {
        type: "time",
        desc: "时间"
      },
      {
        type: "signature",
        desc: "签名"
      },
      {
        type: "signaturePicture",
        desc: "仅签名图片"
      }
    ];

    vm.formData = {
      components: {
        tables: [{
          row: [],
          tableHeader: [{
            id: utilService.guid(),
            title: "标题1",
            colspan: "1",
            rowspan: "1",
            dataType: "text",
            textAlign: "center",
            dataBind: "hearRate",
            children: []
          }]
        }],
        risk: (function () {
          var obj = {};

          dic.riskLevel.forEach(function (riskItem) {
            obj[riskItem.dicCode] = [];
          });

          return obj;
        })()
      },
      wardCode: profile.wardCode,
      category: "hlpgd",
      size: "297,210"
    }; 

    vm.validationOption = {};

    vm.appendChildCell = appendChildCell;
    vm.addTable = addTable;
    vm.getPageSize = getPageSize;
    vm.removeCell = removeCell;
    vm.appendCell = appendCell;
    vm.getRowArray = getRowArray;
    vm.handleTypeChange = handleTypeChange;

    vm.openSettings = openSettings;
    vm.showTableConfigDetailConfig = true;

    vm.filter = {};
    vm.filter.showType = 1;

    vm.selectedWards = [];

    activate();
    getWardsList();

    function Selected(index) {
      vm.wardList[index].selected = !vm.wardList[index].selected;
      vm.selectedWards = _.filter(vm.wardList, function (item) {
        return item.selected;
      });
    }

    // 升级文书模版版本
    vm.updateTplVersion = function () {
      vm.formData = estimateTplUtil.updateTplFromV1ToV11(vm.formData);
      vm.filter.showType = 1;
    };

    // function getWardsList() {
    //   return hospitalRest.getWards().then(function(response) {
    //     vm.wardList = response;
    //     _.map(vm.wardList, function(item) {
    //       item.selected = false;
    //     });
    //     $scope.$watch('vm.formData',function (newValue,oldValue) {
    //       console.log(newValue)
    //       _.map(vm.wardList, function(item) {
    //         if (newValue.wardCodes.indexOf(item.wardCode)>-1) {
    //           item.selected = true;
    //         }
    //       });
    //     }, true);
    //   });
    // }

    function getWardsList() {
      return hospitalRest.getWards().then(function (response) {
        vm.wardList = response;
        _.map(vm.wardList, function (item) {
          item.selected = false;
        });
        $scope.$watch(
          "vm.formData.wardCodes",
          function (newValue, oldValue) {
            if (newValue) {
              _.map(vm.wardList, function (item) {
                if (newValue.indexOf(item.wardCode) > -1) {
                  item.selected = true;
                }
              });
            }
          },
          true
        );
      });
    }

    function activate() {
      getWards();
      getTpl();
    }

    function getTpl() {
      if (!$stateParams.tplId) {
        doWatch();
        return;
      }
      return nursingRest
        .getNursingDoc($stateParams.tplId)
        .then(function (response) {
          vm.formData = response;
          if (!vm.formData.components) {
            vm.formData.components = {
              tables: [{
                row: [],
                tableHeader: [{
                  id: utilService.guid(),
                  title: "标题1",
                  colspan: "1",
                  rowspan: "1",
                  dataType: "text",
                  textAlign: "center",
                  dataBind: "hearRate",
                  children: []
                }]
              }],
              risk: (function () {
                var obj = {};

                dic.riskLevel.forEach(function (riskItem) {
                  obj[riskItem.dicCode] = [];
                });

                return obj;
              })()
            };
          }
          doWatch();
        });
    }

    function handleTypeChange(item) {
      if (item.dataType === "boolean") {
        item.settings = {
          trueValue: 1,
          falseValue: 0
        };
      }
    }

    var PAPER_RATIO = 2.8238;

    function mmToPt(num) {
      if (!num) {
        return 0;
      }
      return parseInt(num - 20, 10) * PAPER_RATIO;
    }

    function getRowArray(count) {
      var _count = count || 1;
      return new Array(parseInt(_count) - 1);
    }

    function doWatch() {
      $scope.$watch(
        "vm.formData.components.tables",
        function (newValue) {
          vm.prevoewColumns = estimateUtil.getTableHeader(newValue, true);
        },
        true
      );
    }  

    function openSettings(item) {
      modalService.open({
        templateUrl: "MNIS/modules/estimateConfig/configForm/settings.modal.html",
        size: "md",
        data: {
          formData: item.settings
        },
        ok: function () {
          item.settings = this.formData;
          return true;
        }
      });
    }

    function getWards() {
      return hospitalRest.getWards().then(function (response) {
        vm.wards = response;
      });
    }

    function appendChildCell(item) {
      item.children.push({
        id: utilService.guid(),
        title: "标题" + Number(parseInt(item.children.length) + 1),
        colspan: "1",
        rowspan: "1",
        textAlign: "center",
        dataType: "text",
        dataBind: "hearRate",
        children: [],
        editable: true,
        validator: function () {}
      });
      item.colspan = item.children.length;
    }

    function appendCell(column) {
      column.push({
        id: utilService.guid(),
        title: "标题" + Number(column.length + 1),
        colspan: "1",
        rowspan: "1",
        textAlign: "center",
        dataType: "text",
        dataBind: "hearRate",
        children: [],
        editable: true,
        validator: function () {}
      });
    }

    function removeCell(collection, index, parentCollection) {
      collection.splice(index, 1);
      parentCollection.colspan =
        parentCollection.children.length === 0 ?
        1 :
        parentCollection.children.length;
    }

    function getPageSize() {
      var size = vm.formData.size ? vm.formData.size.split(",") : [297, 210];
      return {
        width: mmToPt(size[0]) + "pt",
        height: mmToPt(size[1]) + "pt"
      };
    }

    function addTable(target) {
      target.push({
        row: [],
        tableHeader: [{
          id: utilService.guid(),
          title: "标题1",
          colspan: "1",
          rowspan: "1",
          dataType: "text",
          textAlign: "center",
          dataBind: "hearRate",
          editable: true,
          children: [],
          validator: function () {}
        }]
      });
    }

    function save() {

      var data = angular.copy(vm.formData);
      Object.keys(data.components.risk).forEach(function (key) {
        data.components.risk[key] = [
          parseInt(data.components.risk[key][0]),
          parseInt(data.components.risk[key][1])
        ];
      });

      // _.forEach(data.components.tables, function (tableItem) {
      //   _.forEach(tableItem.row, function (rowItem) {
      //     // delete rowItem.children;
      //   });
      // });

      delete data.wardCode;

      nursingRest.updateNursingDocs(data).then(function (response) {
        $scope.$emit("toast", "保存成功");
        if (!$stateParams.tplId) {
          vm.formData = response;
        }
      });
    }

    // Commit by hsw
    // 没有任何引用
    //   vm.headerItems = [{
    //     dicName: "患者姓名",
    //     dicCode: "patientName"
    //   },
    //   {
    //     dicName: "年龄",
    //     dicCode: "age"
    //   },
    //   {
    //     dicName: "诊断",
    //     dicCode: "diagnose"
    //   },
    //   {
    //     dicName: "床号",
    //     dicCode: "bedCode"
    //   },
    //   {
    //     dicName: "性别",
    //     dicCode: "gender"
    //   },
    //   {
    //     dicName: "入院日期",
    //     dicCode: "inhosDate"
    //   }
    // ];
  }
})();
