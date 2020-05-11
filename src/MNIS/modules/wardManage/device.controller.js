(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('DeviceController', DeviceController);

  /** @ngInject */
  function DeviceController($q, $scope, sessionService, nursingRest, _) {
    var vm = this,
      profile = sessionService.getProfile();

    activate();

    function activate() {
      vm.load = {
        func: loadData,
        init: true
      };
      vm.filter = {
        cate: 0,
        option: '0',
        text: ''
      };
      vm.search = search;
      vm.listFilter = listFilter;
      vm.printFilter = printFilter;
    }

    function loadData() {
      var rq, fq;
      rq = nursingRest.getInhosRecordsFromEmr(profile.wardCode, vm.params).then(function (data) {
        vm.list = data.plain();
        return vm.list;
      });
      // fq = nursingRest.getFocusBeds(profile.wardCode, profile.userCode);
      return $q.all([rq]).then(function (results) {
        var beds = results[0],
          focusBeds = results[1];
        _.each(focusBeds, function (item) {
          var match = _.find(beds, {
            bedCode: item.bedCode
          });
          match && (match.focus = item.seqId);
        });
      });
    }

    function search() {
      vm.filter.text = vm.text;
    }

    function listFilter(item) {
      var optionFlag;
      if (vm.filter.option == 0) {
        if (!item.bedCode) {
          optionFlag = true;
        } else {
          optionFlag = item.bedCode.indexOf(vm.filter.text) > -1;
        }
      } else if (vm.filter.option == 1) {
        optionFlag = item.patName.indexOf(vm.filter.text) > -1;
      } else if (vm.filter.option == 2) {
        if (!item.displayCode) {
          optionFlag = true;
        } else {
          optionFlag = item.displayCode.indexOf(vm.filter.text) > -1;
        }
      }
      return optionFlag && (!vm.filter.cate || (vm.filter.cate && item.focus));
    }

    function printFilter(checked) {
      var filterList = [];
      _.each(checked, function (patCode) {
        filterList.push(_.find(vm.list, function (item) {
          return item.patCode == patCode;
        }))
      });
      vm.filterList = filterList;
    }

    $scope.$on('preview_finish', function (e, d) {
      vm.checked = [];
    })
  }
})();
