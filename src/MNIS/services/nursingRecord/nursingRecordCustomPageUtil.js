(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('nursingRecordCustomPageUtil', nursingRecordCustomPageUtil);

  /** @ngInject */
  function nursingRecordCustomPageUtil(_, modalService, nursingRest) {

    var service = {
      setCustomPage: setCustomPage,
      insertCustomPage: insertCustomPage
    };


    // 设置自定义
    function setCustomPage(scope, sheetId, callback) {

      modalService.open({
        size: 'sm',
        templateUrl: 'MNIS/components/nursingDoc/toolbar/customBlackPage/nursingDocCustomBlackPage.modal.html',
        data: {
          formData: {
            needReloadSheet: false
          }
        },
        initFn: function () {

          var that = this;
          nursingRest.getNursingDocBlankPage().customGET('', {
            sheetId: sheetId
          }).then(function (data) {
            that.formData.blankPageList = data.plain();
          })
        },
        ok: function (data) {
          return true;
        },
        cancel: function () {
          var that = this;
          if (that.formData.needReloadSheet) {
            if (callback) {
              callback();
            }
          }
        },
        methodsObj: {
          deleteBlankPage: function (item) {

            var that = this;
            var index = _.findIndex(that.formData.blankPageList, {
              "dataId": item.dataId
            });
            if (index == -1)
              return;
            nursingRest.deleteNursingDocBlackPage(item.dataId).then(function () {

              scope.$emit('toast', {
                type: "success",
                content: "删除换页符成功"
              })

              that.formData.needReloadSheet = true;
              that.formData.blankPageList.splice(index, 1);
              if (that.formData.selectedRow.dataId == item.dataId)
                delete that.formData.selectedRow;
            });
          },
          selectBlankPage: function (item) {
            var that = this;
            that.formData.selectedRow = _.cloneDeep(item);
          },
          saveBlankPage: function () {
            var that = this;
            var index = _.findIndex(that.formData.blankPageList, {
              "dataId": that.formData.selectedRow.dataId
            });
            if (index != -1 && that.formData.selectedRow.pageOffSet != that.formData.blankPageList[index].pageOffSet) {
              nursingRest.getNursingDocBlankPage().customPUT(that.formData.selectedRow).then(function (data) {
                that.formData.needReloadSheet = true;
                that.formData.blankPageList[index] = data.plain();
                that.methodsObj.selectBlankPage(that.formData.blankPageList[index]);

                scope.$emit('toast', {
                  type: "success",
                  content: "修改换页符成功"
                })
              })
            }
          }
        }
      });
    }

    // 插入换页符
    function insertCustomPage(sheetData, recordData, callback) {

      modalService.open({
        size: 'sm',
        templateUrl: 'MNIS/components/nursingDoc/toolbar/customBlackPage/nursingDocInsertCustomBlackPage.modal.html',
        data: {
          metaData: {
            sheetData: sheetData,
            recordData: recordData,
            pageIndex: Math.floor(recordData.rowInfile / sheetData.tplRowNum) + 1,
            rowIndex: (recordData.rowInfile % sheetData.tplRowNum) == 0 ? 1 : (recordData.rowInfile % sheetData.tplRowNum)
          },
          formData: {
            blankPageSize: 1
          }
        },
        initFn: function () {

        },
        ok: function (data) {
          var blackPageData = {
            blankPage: true,
            sheetId: sheetData.sheetId,
            dataId: recordData.dataId,
            pageOffSet: data.blankPageSize
          };
          return nursingRest.getNursingDocBlankPage().customPOST(blackPageData).then(function (data) {
            if (callback) {
              callback(data);
            }
          });
        }
      });
    }

    return service;
  }
})();
