(function () {
  'use strict';
  angular.element(document).on('dragover', function (event) {
    event.preventDefault();
  });
  angular
    .module('lachesis-mnis')
    .directive('draggableTh', draggableTh);

  /** @ngInject */
  function draggableTh(_, $timeout) {
    var directive = {
      restrict: 'A',
      scope: {},
      link: function (scope, element, attrs) {
        window.positionStart = {
          pageX: 0,
          pageY: 0
        };

        var diff = {
          x: 0,
          y: 0
        };

        var position = {
          left: 0,
          top: 0
        };

        window.isDragging = false;

        element[0].addEventListener('mousedown', function (event) {
          var elem = angular.element(event.target);
          var pageX = event.pageX;
          var pageY = event.pageY;

          diff.x = event.offsetX;
          diff.y = event.offsetY;

          window.positionStart.pageX = pageX;
          window.positionStart.pageY = pageY;

          var left = isNaN(parseFloat(this.style.left)) ? 0 : parseFloat(this.style.left);
          var top = isNaN(parseFloat(this.style.top)) ? 0 : parseFloat(this.style.top);

          position.left = left;
          position.top = top;

          window.isDragging = true;

          if (!elem.hasClass('dragging')) {
            angular.element(this).addClass('dragging');
          }
        }, false);

        function mouseMove(event) {
          var pageX = event.clientX;
          var pageY = event.clientY;

          if (!window.isDragging) {
            return;
          }

          event.preventDefault();

          diff.x = pageX - window.positionStart.pageX;
          diff.y = pageY - window.positionStart.pageY;

          angular.element('th[name="' + element.attr('name') + '"] .th-succedaneum').css({
            left: diff.x + 'px',
            'z-index': 999
          });
        }

        document.removeEventListener('mousemove', mouseMove, false);
        document.addEventListener('mousemove', mouseMove, false);

        function mouseUp(e) {
          angular.element('th[name="' + element.attr('name') + '"] .th-succedaneum').css({
            left: 0
          });

          var range = _.map(angular.element('.exchange-th'), function (elem) {
            return elem.getBoundingClientRect().left;
          });

          var draggingElement = angular.element('th.dragging');

          if (draggingElement.length === 0) {
            return;
          }

          var draggingElementX = draggingElement[0].getBoundingClientRect().left

          var targetIndex = _.findIndex(range, function (x, index) {
            if (index + 1 === range.length) {
              return e.clientX >= x;
            }

            return e.clientX >= x && e.clientX < range[index + 1];
          });
          var currentIndex = _.findIndex(range, function (x) {
            return draggingElementX <= x;
          });

          if (targetIndex === currentIndex) {
            window.isDragging = false;
            draggingElement.removeClass('dragging');

            return;
          }
          var ths = angular.element('.exchange-th');
          var correctItem = ths.eq(targetIndex);

          if (window.isDragging) {
            var replaceTh = correctItem.scope().$parent.th;
            var currentTh = draggingElement.scope().$parent.th;
            var replaceIndex = typeof replaceTh.orderIndex === 'undefined' ? correctItem.index() - 1 : replaceTh.orderIndex;

            _.forEach(ths, function (th, index) {
              var that = angular.element(th).scope().$parent.th;

              if (typeof that.orderIndex === 'undefined') {
                that.orderIndex = index + 1;
              }

              if (currentIndex > targetIndex ) {
                if (index >= targetIndex && currentIndex > index) {
                  that.orderIndex += 1;
                }
              }

              if (targetIndex > currentIndex) {
                if (index > currentIndex && targetIndex >= index) {
                  that.orderIndex -= 1;
                }
              }
            });

            currentTh.orderIndex = replaceIndex;
            draggingElement.scope().$parent.$apply();
          }

          window.isDragging = false;
          draggingElement.removeClass('dragging');
        }

        document.removeEventListener('mouseup', mouseUp, false);
        document.addEventListener('mouseup', mouseUp, false);
      }
    };

    return directive;
  }

})();
