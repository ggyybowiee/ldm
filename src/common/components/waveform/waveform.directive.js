(function() {
  'use strict';

  var ctx = new (window.AudioContext || window.webkitAudioContext)();
  angular
    .module('lachesis-common')
    .directive('waveform', waveform);
  /** @ngInject */
  function waveform($timeout, $rootScope) {
    var directive = {
      restrict: 'E',
      scope: {
        src: '@',
        select: '@',
        id: '@',
        supOption: '=',
        hideControls: '='
      },
      templateUrl: 'common/components/waveform/waveform.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      var id = scope.id, src = scope.src, select = !!scope.select, supOption = scope.supOption || {};
      var playlist = WaveformPlaylist.init({
        ac: ctx,
        container: el.find('.waveform-chart')[0],
        waveHeight: supOption.height || 50,
        state: select ? 'select' : 'cursor',
        colors: {
          waveOutlineColor: supOption.color || '#5F88DF'
        },
        timescale: supOption.timescale || null
      });

      var selection;

      playlist.load([{
        src: src,
        states: {
          cursor: false,
          fadein: false,
          fadeout: false,
          select: select,
          shift: false
        }
      }]).then(function() {
        playlist.ee.emit('fixwidth', el.find('.waveform-chart').width());
        select && selectionInit();
      });

      function selectionInit() {
        selection = WaveformPlaylist.init({
          ac: ctx,
          container: el.find('.selection-chart')[0],
          waveHeight: 160,
          timescale: {
            position: 'bottom',
            hidLine: true
          },
          colors: {
            waveOutlineColor: {
              start: '#5BC9CA',
              end: '#6076E5'
            }
          }
        });
        selection.setMasterGain(0);
        var promise;
        selection.load(_.map(playlist.tracks, function(track) {
          return {
            src: track.buffer,
            states: {
              cursor: false,
              fadein: false,
              fadeout: false,
              select: false,
              shift: false
            }
          };
        })).then(function() {
          selection.ee.emit('fixwidth', el.find('.selection-chart').width());
        });

        playlist.ee.on('selectend', function(start, end, track) {
          // if(playlist.isPlaying()) {
          //   return;
          // }
          selection.ee.emit('clear');
          if(promise) $timeout.cancel(promise);
          promise = $timeout(function() {
            //剪切音频
            var src = track.buffer, total = src.duration;
            var dist = new AudioBuffer({
              length: src.length * (end - start) / total,
              numberOfChannels: src.numberOfChannels,
              sampleRate: src.sampleRate
            });
            var i, j, offset = Math.floor(src.length * start / total), srcData, distData;
            for(i = 0; i < dist.numberOfChannels; i++) {
              srcData = src.getChannelData(i);
              distData = dist.getChannelData(i);
              for(j = 0; j < distData.length; j++) {
                distData[j] = srcData[offset + j];
              }
            }
            //加载音频
            selection.load([{
              src: dist,
              states: {
                cursor: false,
                fadein: false,
                fadeout: false,
                select: false,
                shift: false
              }
            }]).then(function() {
              selection.ee.emit('fixwidth', el.find('.selection-chart').width());
              if(playlist.isPlaying()) {
                selection.ee.emit('play', playlist.getElapsedTime() + playlist.playOffset);
              }
            });
          }, 500);
        });

        scope.$on('waveformSelect', function(e, interval) {
          var start = interval.start, end = interval.end;
          playlist.ee.emit('select', start, end, playlist.tracks[0]);
        });
      }

      function toggle() {
        if(playlist.isPlaying()) {
          pause();
        }else {
          play();
        }
      }

      function play() {
        playlist.ee.emit('play');
        selection && selection.ee.emit('play');
      }

      function pause() {
        playlist.ee.emit('pause');
        selection && selection.ee.emit('pause');
      }

      function stop() {
        playlist.ee.emit('stop');
        selection && selection.ee.emit('stop');
      }
//
      function setSpeed(speed) {
        playlist.ee.emit('setSpeed',speed);
        selection && selection.ee.emit('setSpeed',speed);
      }
//
      scope.$on('audio.play', function(e, audioId) {
        if(id == audioId && !playlist.isPlaying()) {
          play();
        }
      });

      scope.$on('audio.pause', function(e, audioId) {
        if(id == audioId) {
          pause();
        }
      });

      scope.$on('audio.stop', function(e, audioId) {
        if(id == audioId) {
          stop();
        }
      });

      //
      scope.$on('audio.setSpeed', function(e, audioId) {
        if(id == audioId.id) {
          setSpeed(audioId.speed);
        }
      });

      //

      scope.$on('$destroy', function() {
        playlist.ee.emit('stop');
        selection && selection.ee.emit('stop');
      });


    }
  }

})();
