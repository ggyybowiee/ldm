(function() {
  'use strict';
  angular.element(document).on('dragover', function (event) {
    event.preventDefault();
  });
  angular
    .module('lachesis-ldm')
    .directive('dragMarker', dragMarker);

  /** @ngInject */
  function dragMarker(dragMarkerService, utilService, _) {
    var directive = {
      restrict: 'A',
      scope: {
        target: '@',
        data: '=?',
        extra: '=',
        save: '='
      },
      link: function(scope, element, attrs) {
        var targetElement = angular.element(scope.target);
        var positionStart = {
          pageX: 0,
          pageY: 0
        };

        var styleStart = {};

        var diff = {
          x: 0,
          y: 0
        };

        var position = {
          left: 0,
          top: 0
        };

        var isDragging = false;

        element[0].addEventListener('mousedown', function (event) {
          var pageX = event.pageX;
          var pageY = event.pageY;

          diff.x = event.offsetX;
          diff.y = event.offsetY;

          positionStart.pageX = pageX;
          positionStart.pageY = pageY;

          var left = isNaN(parseFloat(this.style.left)) ? 0 : parseFloat(this.style.left);
          var top = isNaN(parseFloat(this.style.top)) ? 0 : parseFloat(this.style.top);

          position.left = left;
          position.top = top;

          isDragging = true;

          if (scope.data.uid) {
            angular.element(this).addClass('dragging');
          }
        }, false);

        document.addEventListener('mousemove', function (event) {
          var pageX = event.pageX;
          var pageY = event.pageY;
          var _parent = element.parent();

          if (!isDragging) {
            return;
          }

          event.preventDefault();

          // diff.x = pageX - positionStart.pageX;
          // diff.y = pageY - positionStart.pageY;

          var style = {
            left: pageX - diff.x - _parent.offset().left,
            top: pageY - diff.y - _parent.offset().top
          };

          // if (scope.data.uid) {
            var width = _parent.width();
            var height = _parent.height();

            if (scope.data.uid && (style.left < 0 || style.left > width || style.top < 0 || style.top  > height)) {
              return;
            }

            position.left = style.left;
            position.top = style.top;

            element[0].style.left = position.left + 'px';
            element[0].style.top = position.top + 'px';
          // }
        }, false);

        !scope.data.uid && angular.element(document).off('dragenter').on('dragenter', function (event) {
          var target = event.target;

          if (scope.target.indexOf(target.className) >= 0) {
            targetElement.addClass('entered');
          } else {
            targetElement.removeClass('entered');
          }
        });

        scope.data.uid && angular.element(document).off('click', handleMarkerClick).on('click', handleMarkerClick);

        element[0].addEventListener('mouseup', function (event) {
          var target = event.target;
          var pageX = event.pageX;
          var pageY = event.pageY;
          var _target = angular.element(target);
          var _parent = angular.element(event.target).parent();

          isDragging = false;

          var targetOffset = !scope.data.uid ? targetElement.offset() : _parent.offset();

          !scope.data.uid && targetElement.removeClass('entered');

          scope.data.uid && angular.element(this).removeClass('dragging');

          if (targetOffset && (pageX < targetOffset.left || pageY < targetOffset.top)) {
            if (!scope.data.uid) {
              element[0].style.left = '0px';
              element[0].style.top = '0px';
            }
            return;
          }

          if (!scope.data.uid) {
            element[0].style.left = '0px';
            element[0].style.top = '0px';
            var data = scope.data.plain ? angular.copy(scope.data.plain()) : scope.data;
            var marker = _.assign({}, data, {
              left: pageX - targetElement.offset().left,
              top: pageY - targetElement.offset().top,
              // 与拖拽源关联的属性字段
              link: attrs.link,
              // 拖拽源id
              sourceId: attrs.link + scope.data[attrs.link],
              uid: utilService.guid()
            }, scope.extra);
            // delete data.id;

            scope.save && scope.save(marker).then(function (response) {
              if (response) {
                marker.locationId = response.id;
                dragMarkerService.addMarker(marker);
              }
            });
            angular.element(target).addClass('hide');
          } else {
            dragMarkerService.markers.forEach(function (marker) {
              if (scope.data.uid === marker.uid) {
                marker.left = position.left;
                marker.top = position.top;
                return;
              }
            });

            var currentMarker = _.find(dragMarkerService.markers, function (item) {
              return item.uid === scope.data.uid;
            });

            scope.save && scope.save(currentMarker, true);
          }
        }, false);
      }
    };

    return directive;
  }

  function handleMarkerClick(event) {
    var target = event.target;
    var _target = angular.element(target);

    if (!target.className) {
      return;
    }

    if (target.className.indexOf('map-markers__item') < 0) {
      angular.element('.map-markers__item').removeClass('active');
    } else {
      _target.toggleClass('active');
      _target.siblings().removeClass('active');
    }
  }

})();
