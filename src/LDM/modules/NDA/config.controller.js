// (function() {
//   'use strict';

//   angular
//     .module('lachesis-ldm')
//     .controller('NDAConfigController', NDAConfigController);

//   /** @ngInject */
//   function NDAConfigController(modalService, ldmSessionCache) {
//     var vm = this, wardHelper = ldmSessionCache.getWardHelper();

    

//     activate();

//     function activate() {
//       vm.open = open;
//     }

//     function open() {
//       modalService.open({
//         templateUrl: 'LDM/modules/NDA/config.modal.html',
//         size: 'lg',
//         methodsObj: {
//           wards: wardHelper.wards
//         },
//         ok: function() {
//           console.log('tarol')
//         }
//       })
//     }
//   }
// })();