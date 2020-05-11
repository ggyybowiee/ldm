(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('chartsService', chartsService);

  function chartsService($echarts, utilService) {
    var pie = {
        title: {
          x: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: "{b} : {c} ({d}%)"
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: []
        },
        series: [{
          type: 'pie',
          radius: '55%',
          center: ['50%', '50%'],
          label: {
            normal: {
              show: true,
              formatter: "{b} : {c} ({d}%)"
            }
          },
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: []
        }]
      },
      ring = {
        title: {
          x: 'center',
          bottom: true,
          textStyle: {
            fontSize: 12,
            fontWeight: 'normal'
          }
        },
        animation:false,
        series : [
          {
            type : 'pie',
            center : ['50%', '40%'],
            radius : ['57%', '70%'],
            data: [],
            clockwise: false
          }, {
            type: 'pie',
            center : ['50%', '40%'],
            radius : ['50%', '52%'],
            data: [],
            clockwise: false
          }
        ]
      },
      horBar = {
        grid: {
          top: 60,
          right: '2%',
          left: '2%',
          bottom: '2%',
          containLabel: true
        },
        legend: {
          orient: 'horizontal',
          top: 0,
          data: []
        },
        xAxis: [{
          type: 'value'
        }],
        yAxis: [{
          type: 'category',
          axisTick: { show: false },
          data: []
        }],
        serie: {
          type: 'bar',
          label: {
            normal: {
              show: true
            }
          },
          data: []
        },
        series: []
      },
      verBar = {
        grid: {
          top: 60,
          right: '2%',
          left: '2%',
          bottom: '2%',
          containLabel: true
        },
        legend: {
          orient: 'horizontal',
          top: 0,
          data: []
        },
        xAxis: [{
          type: 'category',
          axisTick: { show: false },
          data: []
        }],
        yAxis: [{
          type: 'value'
        }],
        serie: {
          type: 'bar',
          label: {
            normal: {
              show: true
            }
          },
          data: []
        },
        series: []
      },
      line = {
        title: {
          x: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: []
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: [{
          type: 'category',
          boundaryGap: false,
          data: [],
          splitLine: {
            show: true,
            lineStyle: {
              color: '#ddd',
              type: 'solid'
            }
          }
        }],
        yAxis: [{
          type: 'value',
          splitLine: {
            show: true,
            lineStyle: {
              color: '#ddd',
              type: 'solid'
            }
          }
        }],
        series: [],
        serie: {
          type: 'line',
          data: []
        }
      },
      radar = {
        title: {},
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          x: 'center',
          data: [],
          top: '30'
        },
        grid: {
          left: '3%',
          right: '3%',
          top: '80',
          containLabel: true
        },
        radar: [],
        series: [],
        serie: {
          type: 'radar',
          tooltip: {
            trigger: 'item'
          },
          itemStyle: { normal: { areaStyle: { type: 'default' } } },
          data: []
        }
      },
      config = {
        pie: pie,
        ring: ring,
        horBar: horBar,
        verBar: verBar,
        line: line,
        radar: radar
      },
      service = {
        pieInit: pieInit,
        ringInit: ringInit,
        horBarInit: horBarInit,
        verBarInit: verBarInit,
        lineInit: lineInit,
        radarInit: radarInit,
        getId: getId,
        refresh: refresh
      };
    return service;

    function pieInit(title) {
      var pie = config.pie,
        raw = angular.copy(pie, {});
      raw.title.text = title;
      return raw;
    }

    function ringInit(title, label, percent, color) {
      var ring = config.ring,
        raw = angular.copy(ring, {}),
        custom = getCustom(title, color);
      raw.series[0].itemStyle = custom.label;
      raw.series[0].data.push({
        itemStyle: custom.emptyStyle,
        value: 100 - percent
      });
      raw.series[0].data.push({
        name: label,
        itemStyle: custom.fullStyle,
        value: percent
      });
      raw.series[1].data.push({
        value: 100,
        itemStyle: custom.emptyStyle
      })
      // raw.series[0].tooltip = {
      //     trigger: 'item',
      //     position: ['50%', '50%'],
      //     backgroundColor: 'rgba(197,196,222,0.6)',
      //     borderWidth :0,
      //     textStyle:{
      //         color:'#333'
      //     },
      //     formatter: title + '包含' + label
      // };
      raw.title.text = title;
      return raw;
    }

    function getCustom(title, color) {
      var fullStyle = {
        normal : {
          color: color,
          label : {
            position : 'center',
            formatter : '{b}',
            textStyle : {
              color: '#7E8387'
            }
          }
        }
      }, emptyStyle = {
        normal : {
          color: utilService.hexToRGB(color, 0.5),
          label : {
            position : 'center',
            textStyle : {
              fontSize: 18,
              color: color
            }
          }
        }
      }, label = {
        normal : {
          label : {
            formatter : function (params){
              return 100 - params.value + '%'
            }
          }
        }
      };
      return {
        fullStyle: fullStyle,
        emptyStyle: emptyStyle,
        label: label
      }
    }

    function horBarInit(legends) {
      var bar = config.horBar,
        raw = angular.copy(bar, {});
      legends.forEach(function(v) {
        var item = angular.copy(raw.serie, {});
        item.name = v;
        raw.series.push(item);
      });
      raw.legend.data = legends;
      delete raw.serie;
      return raw;
    }

    function verBarInit(legends) {
      var bar = config.verBar,
        raw = angular.copy(bar, {});
      legends.forEach(function(v) {
        var item = angular.copy(raw.serie, {});
        item.name = v;
        raw.series.push(item);
      });
      raw.legend.data = legends;
      delete raw.serie;
      return raw;
    }

    function lineInit(title, legends) {
      var line = config.line,
        raw = angular.copy(line, {});
      if (legends) {
        legends.forEach(function(v) {
          var item = angular.copy(raw.serie, {});
          item.name = v;
          raw.series.push(item);
        });
        raw.legend.data = legends;
      }
      raw.title.text = title;
      delete raw.serie;
      return raw;
    }

    function radarInit(title, legends) {
      var radar = config.radar,
        raw = angular.copy(radar, {});
      raw.legend.data = legends;
      raw.title.text = title;
      return raw;
    }

    function getId() {
      return $echarts.generateInstanceIdentity();
    }

    function refresh(id, config) {
      $echarts.updateEchartsInstance(id, config);
    }
  }

})();
