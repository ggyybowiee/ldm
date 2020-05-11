(function () {
  'use strict';

  angular.module('lachesis-mnis')
    .filter('nursingDocSignType', function (docUtil) {
      return function () {
        return docUtil.getSignTypeConfig();
      }
    })
    .factory('docUtil', docUtil);

  /** @ngInject */
  function docUtil($q, _, $timeout, nursingRest, $stateParams, docRest, utilService, sessionService, modalService, tokenService) {

  
    var service = {
      getCrosslineDic: getCrosslineDic,
      prepareDataForSaving: prepareDataForSaving,
      getDateTimeFormat: getDateTimeFormat,
      loadWardCodeTpls: loadWardCodeTpls,
      getSignTypeConfig: getSignTypeConfig,
      caSignRecord: caSignRecord,
      signRecord: signRecord,
      getUserContentInSignContent: getUserContentInSignContent
    };

    function getWardCode() {

      var profile = sessionService.getProfile();
      return $stateParams.wardCode || profile.wardCode;
    }

    // 获取表头二分方式字典
    function getCrosslineDic() {
      return [{
        text: '无',
        value: 'N'
      }, {
        text: '左斜',
        value: 'L'
      }, {
        text: '右斜',
        value: 'R'
      }]
    }

    // 获取记录时间格式
    function getDateTimeFormat(headerKeys) {
      if (headerKeys.indexOf('datetime') != -1) {
        return "combine";
      } else if (headerKeys.indexOf('date') != -1) {
        return "seperate"
      }

      return 'none';
    }

    // 护理记录、护理文书数据提交前处理
    function prepareDataForSaving(record, docType, headerKeys, verifySignOnly) {

      if (!angular.isArray(headerKeys))
        return {
          result: false,
          error: '表头项不能为空'
        };

      // 签名此记录
      signRecord(record.data, docType, undefined, undefined, undefined, verifySignOnly);

      var datetimeFormat = getDateTimeFormat(headerKeys);
      if (datetimeFormat == 'combine') {
        if (!record.data.datetime) {
          return {
            result: false,
            error: '记录必须录入日期与时间'
          };
        }

        delete record.data.date;
        delete record.data.time;
        return {
          result: true
        }

      } else if (datetimeFormat == 'seperate') {
        if (!record.data.date) {
          return {
            result: false,
            error: '记录必须录入日期与时间'
          };
        }

        record.data.time = record.data.time || '00:00';
        delete record.data.datetime;
        return {
          result: true
        }
      } else {
        return {
          result: false,
          error: '表头没有日期或时间绑定项，请修改模版'
        };
      }

    }

    // 护理记录与护理文书数据签名方法
    function signRecord(data, actionType, signKey, caSign, signUser, verifySignOnly) {

      signKey = signKey || "sign";

      var profile = sessionService.getProfile();

      var conf = sessionService.getConfHelper().conf;
      var signType = _.get(conf, ['nursingDocSignType', 'configValue']) || 'text';
      var userContent = signUser ? signUser.userCode + '_' + signUser.userName : profile.userCode + '_' + profile.userName;
      var curSignContent = "";
      if (signType == 'text') {
        curSignContent = "@txt_" + userContent;
      } else if (signType == 'image') {
        curSignContent = "@img_" + userContent;
      } else if (signType == 'CA') {
        curSignContent = caSign ? "@ca_img_" + userContent : "@ca_txt_" + userContent;
      }

      if (!_.get(data, signKey)) {
        // 新建记录签名
        if (actionType == "nursingDoc") {
          _.set(data, signKey, [curSignContent]);
        } else if (actionType == "estimateDoc") {
          _.set(data, signKey, curSignContent);
        } else if (actionType == "verifySign") {
          // 审核签名
          _.set(data, signKey, curSignContent);
        }
      } else {

        var originSignContent = _.get(data, signKey);
        var newSignContent = _.clone(originSignContent);

        if (actionType == "verifySignCancel") {
          // 取消审核签名
          _.set(data, signKey, "");
        } else {
          // 审核\冠签签名
          if (actionType == "nursingDocCheckSign") {
            // 护理记录冠签签名
            if (angular.isArray(newSignContent) && newSignContent.length == 1) {
              newSignContent.push(curSignContent);
            }
          } else if (actionType == "nursingDocCheckSignCancel") {
            // 取消记录冠签签名
            if (_.isArray(newSignContent) && newSignContent.length > 1) {
              newSignContent.splice(1, newSignContent.length - 1);
            }
          }
          _.set(data, signKey, newSignContent);
        }
      }

      // 编辑后需要更新签名
      if (caSign || _.get(conf, ['nursingDocSignStrategy', 'configValue']) === 'save') {
        if (actionType == "nursingDoc" && !verifySignOnly) {
          _.set(data, [signKey, '0'], curSignContent);
        } else if (actionType == "estimateDoc" && !verifySignOnly) {
          _.set(data, signKey, curSignContent);
        }
      }

    }

    // 判断签名内容是否可被userCode的用户所签写
    function compareSignContent(signContent, userCode) {
      if (signContent == null)
        return true;

      if (angular.isArray(signContent) && signContent.length > 0)
        signContent = signContent[0];

      var userContent = getUserContentInSignContent(signContent);
      if (!userContent.userCode || (userContent.userCode == userCode && userContent.showType == "text"))
        return true;
      return false;
    }

    // 从签名内容中获取用户信息
    function getUserContentInSignContent(signContent) {

      var showType, userContent, userCode, userName;

      if (signContent) {
        if (_.isArray(signContent)) {
          signContent = signContent[0];
        }
        if (signContent.indexOf("@txt_") != -1) {
          showType = "text";
          userContent = signContent.substring(5);
        } else if (signContent.indexOf("@img_") != -1) {
          showType = "image";
          userContent = signContent.substring(5);
        } else if (signContent.indexOf("@ca_txt_") != -1) {
          showType = "text";
          userContent = signContent.substring(8);
        } else if (signContent.indexOf("@ca_img_") != -1) {
          showType = "image";
          userContent = signContent.substring(8);
        } else {
          showType = "text";
          userContent = signContent;
        }

        var userContents = userContent.split('_');
        if (userContents.length == 2) {
          userCode = userContents[0];
          userName = userContents[1];
        } else if (userContents.length == 1) {
          userName = userContents[0];
        }
      }

      return {
        showType: showType,
        userName: userName,
        userCode: userCode
      };
    }

    // 护理记录与护理评估电子签名
    // acitonType: nursingDoc, estimateDoc, nursingDocCheckSign, nursingDocCheckSignCancel, verifySign, verifySignCancel
    function caSignRecord(recordDatas, actionType, signKey, verifiedUserSign) {

      var deferred = $q.defer();
      var promise = deferred.promise;

      var profile = sessionService.getProfile();

      if (!angular.isArray(recordDatas)) {
        recordDatas = [recordDatas];
      }

      // 判断数据是否为当前用户
      var userRecordDatas = getAffectRecord(recordDatas);
      if (userRecordDatas.length == 0) {
        deferred.reject("noRecord");
        return promise;
      }

      if (!verifiedUserSign) {

        // 需求身份验证

        var userCode = profile.userCode,
          userName = profile.userName;
        var needOtherUser = (actionType == 'nursingDocCheckSign' || actionType == 'verifySign');
        if (needOtherUser) {
          userCode = "";
          userName = "";
        } else if (actionType == "verifySignCancel" || actionType == 'nursingDocCheckSignCancel') {
          // 前提：因为取消签名不能批量执行，取第一条记录的用户名
          var signContent = _.get(recordDatas[0], ['data', signKey]);
          if (actionType == 'nursingDocCheckSignCancel' && actionType.length > 1) {
            // 取消冠签时，取第二个签名信息
            signContent = signContent[1];
          }

          var userSign = getUserContentInSignContent(signContent);
          userCode = userSign.userCode;
          userName = userSign.userName;
        }

        modalService.open({
          templateUrl: "common/components/caUserSign/caUserSign.modal.html",
          size: 'sm',
          data: {
            metaData: {
              needOtherUser: needOtherUser
            },
            formData: {
              userCode: userCode,
              userName: userName,
              password: ""
            }
          },
          ok: function (data) {
            return tokenService.getToken(data).then(function (userData) {
              var userSign = userData.plain();
              _.forEach(userRecordDatas, function (recordData) {
                signRecordData(recordData, userSign);
              })
              deferred.resolve({
                datas: userRecordDatas,
                sign: userSign
              });
            });
          },
          cancel: function () {
            deferred.reject();
          }
        });
      } else {
        _.forEach(userRecordDatas, function (recordData) {
          signRecordData(recordData, verifiedUserSign);
        })
        deferred.resolve({
          datas: userRecordDatas,
          sign: verifiedUserSign
        });
      }

      // 密码输入框获取焦点
      $timeout(function () {
        if (needOtherUser) {
          angular.element('.ca-user-code-input').focus();
        } else {
          angular.element('.ca-user-password-input').focus();
        }
      })

      return promise;

      // 签名记录
      function signRecordData(recordData, userSign) {
        signRecord(recordData.data, actionType, signKey, true, userSign);
        // 冠签其它处理
        if (actionType == "nursingDocCheckSign") {
          recordData.checkUserCode = userSign.userCode;
          recordData.checkUserName = userSign.userName;
        } else if (actionType == "nursingDocCheckSignCancel") {
          recordData.checkUserCode = "";
          recordData.checkUserName = "";
        }
      }

      // 获取登录用户记录
      function getAffectRecord(recordDatas) {
        var userRecordDatas = [];
        _.forEach(recordDatas, function (recordData) {
          if (actionType == 'verifySign' || actionType == 'verifySignCancel' || actionType == 'nursingDocCheckSign' || actionType == 'nursingDocCheckSignCancel') {
            // 审核签名与取消不需要判断
            userRecordDatas.push(recordData);
          } else {
            var signContent = _.get(recordData, ['data', signKey]);
            if (compareSignContent(signContent, profile.userCode))
              userRecordDatas.push(recordData);
          }
        });
        return userRecordDatas;
      }
    }

    // 获取当前签名类型配置
    function getSignTypeConfig() {
      var conf = sessionService.getConfHelper().conf;
      return _.get(conf, ['nursingDocSignType', 'configValue']) || 'text';
    }

    // 获取病区文书列表
    function loadWardCodeTpls() {

      var deferred = $q.defer();

      var nDocQ = nursingRest.getNursingDocs({
        wardCode: getWardCode()
      });
      var iDocQ = docRest.getDocs({
        category: utilService.getParams('resource'),
        wardCode: getWardCode()
      });
      $q.all([nDocQ, iDocQ]).then(function (response) {
        var tpls = _.flatten([response[0], response[1]]);
        deferred.resolve({
          tpl: _.groupBy(tpls, 'showType'),
          idocTpls: response[1].plain()
        });
      });

      return deferred.promise;
    }


    return service;
  }
})();
