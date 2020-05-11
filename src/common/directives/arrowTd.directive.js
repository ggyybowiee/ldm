(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('arrowTd', fn);

  var moveDirection = {
    37: function (position) {
      position.left -= 1;

      if (position.left <= 0) {
        position.left = 0;
      }

      return position;
    },

    38: function (position) {
      position.top -= 1;

      if (position.top <= 0) {
        position.top = 0;
      }

      return position;
    },

    39: function (position) {
      position.left += 1;

      return position;
    },

    40: function (position) {
      position.top += 1;

      return position;
    }
  };

  /** @ngInject */
  function fn($timeout) {
    var directive = {
      restrict: 'A',
      link: function(scope, element) {
        $timeout(function () {
          element.find('.form-control').on('keydown', function(e) {
            var dir = [37, 38, 39, 40];

            if(dir.indexOf(e.which) > -1) {
              e.preventDefault();
              var rowIndex = element.parent().index();
              var columnIndex = element.index();

              var nextPosition = moveDirection[e.which]({
                left: columnIndex,
                top: rowIndex
              });

              var nextStepRow = element.parents('table').find('tbody tr').eq(nextPosition.top);
              var cell = nextStepRow.find('td').eq(nextPosition.left);

              cell.find('.form-control').focus();
            }
          });
        });
      }
    };

    return directive;
  }

})();
