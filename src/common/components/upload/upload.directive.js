(function () {
  "use strict";

  angular.module("lachesis-common").directive("uploadImage", uploadImage);

  /** @ngInject */
  function uploadImage(FileUploader, _, sysRest) {
    //上传文件，并可以显示上传的图片。
    //上传文件使用sysRest.postFile，其返回值中包含已上传文件的seqId.调用sysRest.getFileUrl使用该seqId可以获得已上传文件的地址。
    //scope中的ngModel的值设置为seqId. optionalModel的值为上传文件的地址。
    var directive = {
      restrict: "E",
      scope: {
        ngModel: "=",
        optionalModel: "=",
        options: "=",
        name: "="
      },
      controller: function ($scope) {
        $scope.$watch('ngModel', function (newValue, oldValue) {
          if (newValue) {
            $scope.optionalModel = sysRest.getFileUrl(newValue);
          }
        });

        $scope.removeUserImage = function () {
          $scope.ngModel = "";
        }
      },
      require: "?ngModel",
      templateUrl: "common/components/upload/upload.tpl.html",
      compile: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var sizeMap = _.reduce(
        ["K", "M", "G", "T"],
        function (memo, key, i) {
          memo[key] = Math.pow(1024, ++i);
          return memo;
        }, {}
      );

      function getSuffix(fileName) {
        return _.last(fileName.split("."));
      }

      function getSize(sizeStr) {
        var reg = /(\d+)|([m|g|k]{1})/gi;
        var matches = sizeStr.match(reg);
        if (matches.length !== 2) {
          throw new Error("size配置项格式错误");
        }
        return +matches[0] * sizeMap[matches[1]];
      }
      return {
        pre: function (scope, el, attr, ngModel) {
          reset();
          scope.uploader = new FileUploader({
            url: _.get(scope, 'options.url') || ("/windranger/sys/sysAttachment/" + (_.get(scope, 'options.module') || 'ldm') + "/file"),
            alias: "myFile",
            filters: [{
                name: "size",
                fn: function (item) {
                  var sizeRules = scope.options.sizeRules,
                    min,
                    max;
                  if (!sizeRules) return true;
                  min = sizeRules.min ? getSize(sizeRules.min) : 0;
                  max = sizeRules.max ? getSize(sizeRules.max) : Infinity;
                  if (item.size >= min && item.size <= max) return true;
                }
              },
              {
                name: "suffix",
                fn: function (item) {
                  var suffixRules = scope.options.suffixRules;
                  if (!suffixRules) return true;
                  if (_.isString(suffixRules)) {
                    return getSuffix(item.name) === suffixRules;
                  } else if (_.isArray(suffixRules)) {
                    return suffixRules.indexOf(getSuffix(item.name.toLowerCase())) > -1;
                  }
                  throw new Error("suffix配置项格式错误");
                }
              }
            ],
            onAfterAddingFile: function (item) {
              // this.uploadAll();
              //设置属性并上传文件
              var fileType = /\.(\w*)$/g.exec(item.file.name)[1];
              var formData = new FormData();
              var uploader = this;
              formData.append("uploadFile", item._file);
              sysRest.postFile({
                moduleName: scope.options.moduleName || 'untitledModule',
                type: fileType
              }, formData).then(function (response) {
                uploader.onCompleteItem(item, response, response ? 200 : 500);
              });
              scope.info.status = "upload-doing";
              scope.echo.fileName = item.file.name;
            },
            onWhenAddingFileFailed: function (file, filter) {
              scope.info.status = "file-fail";
              if (filter.name === "size") {
                scope.echo.msg = "文件过大，上传失败。";
              } else if (filter.name === "suffix") {
                scope.echo.msg =
                  "不支持" + getSuffix(file.name) + "格式文件上传";
              }
            },
            onProgressItem: function (item, progress) {
              scope.info.progress = progress;
            },
            onCompleteItem: function (item, response, status) {
              if (status === 200) {
                reset("upload-success", "上传成功，文件名：" + item.file.name);
                ngModel.$setViewValue(response.seqId);
                //上传成功后，获得文件的Url.显示上传成功的图片
                scope.optionalModel = sysRest.getFileUrl(response.seqId);
              } else if (status === 0) {
                reset("file-cancel", "用户取消了上传");
              }
            },
            onErrorItem: function () {
              reset("upload-fail", "上传失败");
            }
          });

          function reset(status, msg) {
            scope.info = {
              progress: 0,
              status: status || "waiting"
            };
            scope.echo = {
              msg: msg || ""
            };
          }
        },
        post: function (scope, el, attr) {
          scope.select = function () {
            el.find(".upload-input").trigger("click");
          };
          scope.cancel = function () {
            scope.uploader.cancelAll();
          };
          scope.getType = function () {
            var map = {
              "upload-success": "success",
              "upload-fail": "danger",
              "upload-doing": "primary"
            };
            return map[scope.info.status];
          };
        }
      };
    }
  }
})();
