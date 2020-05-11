(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('uploadFiles', uploadFiles);

  /** @ngInject */
  function uploadFiles(FileUploader, _, setDoc) {
    var directive = {
      restrict: 'EA',
      scope: {
        options: '=',
        cb: '&'
      },
      templateUrl: 'common/components/uploadFiles/uploadFiles.tpl.html',
      compile: linkFunc,
     
      replace: true
    };

    return directive;

    function linkFunc() {
      var sizeMap = _.reduce(['K', 'M', 'G', 'T'], function(memo, key, i) {
        memo[key] = Math.pow(1024, ++i);
        return memo;
      }, {});
      function getSuffix(fileName) {
        return _.last(fileName.split('.'));
      }
      function getSize(sizeStr) {
        var reg = /(\d+)|([m|g|k]{1})/ig;
        var matches = sizeStr.match(reg);
        if(matches.length !== 2) {
          throw new Error('size配置项格式错误');
        }
        return +matches[0] * sizeMap[matches[1]];
      }
      var type='';
      return {
        pre: function (scope, el, attr) {
          reset();
          scope.uploader = new FileUploader({
            headers:{
              'Authorization':_.get(scope, 'options.token')
            },
            url: _.get(scope, 'options.url'),
            alias: 'uploadFile',
            filters: [{
              name: 'urlParameter',
              fn: function(item) {
                var url=_.get(scope, 'options.url');
                // this.url=url+getSuffix(item.name);
                this.url=url;
                return true;
              }
            }, {
              name: 'size',
              fn: function(item) {
                type=getSuffix(item.name);
                var sizeRules = _.get(scope, 'options.size'), min, max;
                if(!sizeRules) return true;
                min = sizeRules.min ? getSize(sizeRules.min) : 0;
                max = sizeRules.max ? getSize(sizeRules.max) : Infinity;
                if(item.size >= min && item.size <= max) return true;
              }
            }, {
              name: 'suffix',
              fn: function(item) {
                type=getSuffix(item.name);
                var suffixRules = _.get(scope, 'options.suffix');
                if(!suffixRules) return true;
                if(_.isString(suffixRules)) {
                  return getSuffix(item.name) === suffixRules;
                }else if(_.isArray(suffixRules)) {
                  return suffixRules.indexOf(getSuffix(item.name)) > -1;
                }
                throw new Error('suffix配置项格式错误');
              }
            }],
            onAfterAddingFile: function(item) {
              var that = this;
              return setDoc.hugeFileUpload().then(function(response) {
                item.url = item.url+'?uploadId='+response;
                that.uploadAll();
                scope.info.status = 'upload-doing';
                scope.echo.fileName = item.file.name;
              },function() {

              });
            },
            onWhenAddingFileFailed: function(file, filter) {
              scope.info.status = 'file-fail';
              if(filter.name === 'size') {
                scope.echo.msg = '文件过大，上传失败。';
              }else if(filter.name === 'suffix') {
                scope.echo.msg = '不支持' + getSuffix(file.name) + '格式文件上传';
              }
            },
            onProgressItem: function(item, progress) {
              scope.info.progress = progress;
            },
            onCompleteItem: function(item, response, status) {
              if(status === 200) {
                reset('upload-success', '上传成功，文件名：' + item.file.name);
                scope.$parent.response = response;
              } else if(status === 0) {
                reset('file-cancel', '用户取消了上传');
              }
            },
            onErrorItem: function() {
              reset('upload-fail', '上传失败');
            }
          });

          function reset(status, msg) {
            scope.info = {
              progress: 0,
              status: status || 'waiting'
            };
            scope.echo = {
              msg: msg || ''
            };
          }
        },
        post: function(scope, el, attr) {
          scope.select = function() {
            el.find('.upload-input').trigger('click');
          };
          scope.cancel = function() {
            scope.uploader.cancelAll();
          };
          scope.getType = function() {
            var map = {
              'upload-success': 'success',
              'upload-fail': 'danger',
              'upload-doing': 'primary'
            };
            return map[scope.info.status];
          }
        }
      }

    }
  }

})();