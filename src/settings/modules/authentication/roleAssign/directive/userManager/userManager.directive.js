(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('userManager', userManager);

  /** @ngInject */
  function userManager() {
    var directive = {
      restrict: 'EA',
      scope: {

      },
      templateUrl: 'settings/modules/authentication/roleAssign/directive/userManager/userManager.tpl.html',
      controllerAs: "vm",
      controller: function ($scope, $q, userService, $timeout, hospitalRest, modalService, _) {

        var vm = this;

        // 获取用户信息
        vm.loadUsers = {
          func: getUsers,
          init: true
        };

        initViewModel();

        function initViewModel() {

          vm.params = {
            searchKey: '',
            num: 15,
            offset: 0,
            countAll: true
          }

          vm.pageItem = {
            maxSize: 10,
            totalItems: 0,
            count: '15',
            page: 1
          }

          // 函数
          vm.openUser = openUser;
          vm.delUser = delUser;
          vm.search = search;
          vm.queryList = queryList;

          vm.uploadUserImage = uploadUserImage;
          vm.uploadUserSignImage = uploadUserSignImage;

        }

        function search() {
          vm.params.offset = 0;
          vm.pageItem.page = 1;
          userService.getSysUsers(vm.params).then(function (data) {
            vm.users = data.queryResult || [];
            // vm.originalUsers = data.queryResult || [];
            vm.pageItem.totalItems = data.totalCnt;
          });
        }

        function getUsers() {

          return userService.getSysUsers(vm.params).then(function (data) {
            vm.users = data.queryResult || [];
            // vm.originalUsers = data.queryResult || [];
            vm.pageItem.totalItems = data.totalCnt;
          });
        }

        function queryList(page) {
          vm.params.num = +vm.pageItem.count;
          vm.params.offset = (page - 1) * vm.params.num;
          getUsers();
        }

        function openUser(data) {
          var raw = data ? data.clone() : userService.createUser();
          var instance = modalService.open({
            size: 'md',
            templateUrl: 'settings/modules/authentication/roleAssign/directive/userManager/user.modal.html',
            data: {
              formData: raw
            },
            ok: function () {
              return raw.save();
            }
          });
          instance.result.then(function () {
            vm.loadUsers.func();
          });
        }

        // 上传用户照片
        function uploadUserImage(user) {

          // 提取URL中的图片序号
          var seqIdPatten = /[0-9]+\/file$/g
          if (seqIdPatten.test(user.imageAttachmentUrl)) {
            var match = user.imageAttachmentUrl.match(seqIdPatten);
            user.imageAttachmentSeqid = match[0].substr(0, match[0].length - 5);
          }

          modalService.open({
            size: 'md',
            templateUrl: 'settings/modules/authentication/roleAssign/directive/userManager/upload.modal.html',
            data: {
              formData: _.cloneDeep(user),
              metaData: {
                options: {
                  module: 'sys',
                  moduleName: 'sysAttachment',
                  sizeRules: {
                    'max': '5M'
                  },
                  suffixRules: ['jpg', 'png', 'gif']
                }
              }
            },
            ok: function (data) {

              var defer = $q.defer();

              hospitalRest.getHosUsers({
                'userCode': data.hosUserCode
              }).then(function (queryHosUser) {

                if (queryHosUser.queryResult.length > 0) {

                  var changeHosUser = queryHosUser.plain().queryResult[0];
                  delete changeHosUser.imageAttachmentUrl;

                  changeHosUser.imageAttachmentSeqid = data.imageAttachmentSeqid;
                  if (!changeHosUser.imageAttachmentSeqid)
                    delete changeHosUser.imageAttachmentSeqid;

                  hospitalRest.updateHosUser(changeHosUser).then(function () {

                    user.imageAttachmentUrl = changeHosUser.imageAttachmentSeqid ? data.imageAttachmentUrl : null;
                    $scope.$emit("toast", {
                      type: "success",
                      content: "修改用户头像成功！"
                    });

                    defer.resolve();

                  }, function () {
                    defer.reject();
                  })

                } else {
                  defer.reject();
                }

              }, function () {
                defer.reject;
              })

              return defer.promise;
            }
          });
        }

        // 上传用户签名图片
        function uploadUserSignImage(user) {

          modalService.open({
            size: 'md',
            templateUrl: 'settings/modules/authentication/roleAssign/directive/userManager/uploadUserSign.modal.html',
            data: {
              formData: _.cloneDeep(user)
            },
            ok: function (formData) {

              if (formData.uploadUserSignContent) {
                // 添加或修改
                return userService.addHosUserDataSign(formData.uploadUserSignContent, formData.hosUserCode).then(function () {
                  user.dataSign = true;

                  // 前端重新加载图片
                  user.dataSign = false;
                  $scope.$emit("toast", {
                    type: "success",
                    content: "修改用户签名成功！"
                  });

                  $timeout(function () {
                    user.dataSign = true;
                  })
                });
              } else if (!formData.dataSign && user.dataSign) {
                // 删除
                var defer = $q.defer();
                userService.getHosUserDataSign({
                  nurseID: user.userHosCode
                }).then(function (queryResult) {

                  if (queryResult.queryResult.length > 0) {

                    var deleteSignData = queryResult.plain().queryResult[0];

                    userService.removeHosUserDataSign(deleteSignData).then(function () {
                      user.dataSign = false;
                      $scope.$emit("toast", {
                        type: "success",
                        content: "修改用户签名成功！"
                      });

                      defer.resolve();
                    }, function () {
                      defer.reject();
                    });
                  }

                }, function () {
                  defer.reject();
                })

                return defer.promise;
              }
            }
          });

        }

        function delUser(data) {
          return data.remove().then(function () {
            vm.loadUsers.func();
          });
        }
      }
    };

    return directive;

  }

})();
