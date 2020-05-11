(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .filter('allergy', function () {
      return function (allergyList) {

        if (allergyList) {

          var drugName = "";
          for (var i = 0; i < allergyList.length; i++) {
            drugName = drugName + (i == 0) ? "" : "," + allergyList[i].drugName;
          }

          return drugName;
        }
        return "—";
      }
    });

})();
