(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .factory('dragMarkerService', dragMarkerService);

  /** @ngInject */
  function dragMarkerService(_, deviceInfoService) {
    var service = {
      markers: [],
      addMarker: addMarker,
      removeMarker: removeMarker,
      clearMarkers: clearMarkers,
      updateMarker: updateMarker,
      reset: reset
    };

    return service;

    function addMarker(marker) {
      // if (!_.find(service.markers, function (item) {
      //   return item.locationId === item.locationId;
      // })) {
      service.markers.push(marker);
      // }
    }

    function reset() {
      service.markers = [];
    }

    function clearMarkers() {
      service.markers.splice(0, service.markers.length);
    }

    function updateMarker(marker) {
      var index = _.findIndex(service.markers, function (item) {
        return marker.deviceId === item.deviceId;
      })

      if (index > -1) {
        _.set(service.markers, index, marker);
      }
    }

    function removeMarker(uid) {
      var index = _.findIndex(service.markers, function (item) {
        return item.uid === uid;
      });
      if (index < 0) {
        return;
      }
      service.markers.splice(index, 1);
    }
  }
})();
