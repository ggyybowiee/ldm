(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('CaBinding', CaBinding);

  /** @ngInject */
  function CaBinding(caTool, sessionService, docRest, hospitalRest, $scope, $q, _) {
    var vm = this;
    var profile = sessionService.getProfile()
    vm.formData = {};
    vm.bind = bind;
    vm.userList = [];

    init();

    function init() {
      caTool.getCAInfo().then(function (response) {
        vm.userList = response;
        getHosUserInfo().then(getHosSign);
        getCa();
      });
    }

    function pureSF(value) {
      return (value + '').replace('SF', '');
    }

    function bind() {
      if (vm.currentHosUser.papersNo && pureSF(vm.currentHosUser.papersNo) !== pureSF(vm.formData.SF)) {
        $scope.$emit('toast', {
          type: 'error',
          content: '此Key盘已绑定' + '【' + vm.formData.userName + '】，当前用户为' + '【' + profile.userName + '】，不可再次绑定！'
        });

        return;
      }

      return $q.all([hospitalRest.updateHosUser(profile.hisCode, {
        papersNo: vm.formData.SF
      }), saveCaPicture()]).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '绑定成功！'
        });
      });
    }

    function getHosSign() {
      return hospitalRest.getHosSign().customGET('', {
        nurseId: vm.currentHosUser.userCode
      }).then(function (response) {
        vm.currentSignPicture = _.get(response, 'queryResult[0]');
      });
    }

    function saveCaPicture() {
      return hospitalRest.uploadSignPicture().customPOST({
        nurseId: vm.currentHosUser.userCode,
        seqId: _.get(vm.currentSignPicture, 'seqId'),
        baseSignData: vm.formData.png
      });
    }

    function getHosUserInfo() {
      return hospitalRest.getHosUsers({
        hisCode: profile.hisCode
      }).then(function (response) {
        vm.currentHosUser = _.get(response, 'queryResult[0]');

        if (vm.currentHosUser.papersNo) {
          vm.formData = _.find(vm.userList, {
            SF: vm.currentHosUser.papersNo
          });
        }
      });
    }

    function getCa() {
      if (profile.userCode) {
        return docRest.getCa(profile.userCode).then(function (response) {
          if (!response) {
            return;
          }

          vm.oldCA = response;
          vm.formData = _.find(vm.userList, {
            certId: response.certId
          });
        });
      }
    }
    // function
  }
})();
