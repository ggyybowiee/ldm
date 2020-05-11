(function () {
  'use strict';

  /**
   * @file 解决浮动运算问题，避免小数点后产生多位数和计算精度损失。
   * 问题示例：2.3 + 2.4 = 4.699999999999999，1.0 - 0.9 = 0.09999999999999998
   */
  /**
   * 把错误的数据转正
   * strip(0.09999999999999998)=0.1
   */
  function strip(num, precision) {
    if (precision === void 0) {
      precision = 12;
    }
    return +parseFloat(num.toPrecision(precision));
  }
  /**
   * Return digits length of a number
   * @param {*number} num Input number
   */
  function digitLength(num) {
    // Get digit length of e
    var eSplit = num.toString().split(/[eE]/);
    var len = (eSplit[0].split('.')[1] || '').length - (+(eSplit[1] || 0));
    return len > 0 ? len : 0;
  }
  /**
   * 把小数转成整数，支持科学计数法。如果是小数则放大成整数
   * @param {*number} num 输入数
   */
  function float2Fixed(num) {
    if (num.toString().indexOf('e') === -1) {
      return Number(num.toString().replace('.', ''));
    }
    var dLen = digitLength(num);
    return dLen > 0 ? num * Math.pow(10, dLen) : num;
  }
  /**
   * 检测数字是否越界，如果越界给出提示
   * @param {*number} num 输入数
   */
  function checkBoundary(num) {
    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
      // console.warn(num + " is beyond boundary when transfer to integer, the results may not be accurate");
    }
  }
  /**
   * 精确乘法
   */
  function times(num1, num2) {
    var others = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      others[_i - 2] = arguments[_i];
    }
    if (others.length > 0) {
      return times.apply(void 0, [times(num1, num2), others[0]].concat(others.slice(1)));
    }
    var num1Changed = float2Fixed(num1);
    var num2Changed = float2Fixed(num2);
    var baseNum = digitLength(num1) + digitLength(num2);
    var leftValue = num1Changed * num2Changed;
    checkBoundary(leftValue);
    return leftValue / Math.pow(10, baseNum);
  }
  /**
   * 精确加法
   */
  function plus(num1, num2) {
    var others = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      others[_i - 2] = arguments[_i];
    }
    if (others.length > 0) {
      return plus.apply(void 0, [plus(num1, num2), others[0]].concat(others.slice(1)));
    }
    var baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
    return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
  }
  /**
   * 精确减法
   */
  function minus(num1, num2) {
    var others = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      others[_i - 2] = arguments[_i];
    }
    if (others.length > 0) {
      return minus.apply(void 0, [minus(num1, num2), others[0]].concat(others.slice(1)));
    }
    var baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
    return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
  }
  /**
   * 精确除法
   */
  function divide(num1, num2) {
    var others = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      others[_i - 2] = arguments[_i];
    }
    if (others.length > 0) {
      return divide.apply(void 0, [divide(num1, num2), others[0]].concat(others.slice(1)));
    }
    var num1Changed = float2Fixed(num1);
    var num2Changed = float2Fixed(num2);
    checkBoundary(num1Changed);
    checkBoundary(num2Changed);
    return times((num1Changed / num2Changed), Math.pow(10, digitLength(num2) - digitLength(num1)));
  }
  /**
   * 四舍五入
   */
  function round(num, ratio) {
    var base = Math.pow(10, ratio);
    return divide(Math.round(times(num, base)), base);
  }

  angular.module('lachesis-common').factory('temperatureSheetUtil', temperatureSheetUtil);

  /** @ngInject */
  function temperatureSheetUtil(estimateUtil, _, moment, sessionService, $timeout, $filter) {

    var svg;
    var underGrid;
    var diff;

    var COLUMN_NUM = 8;
    var ROW_CHART_NUM = 45;
    var TOP_ROW_NUM = 5;
    var ROW_4_HOUR_NUM;
    var ROW_12_HOUR_NUM;
    var ROW_24_HOUR_NUM;
    var ROW_CUSTOM_NUM;

    var ROW_NUM;

    // 每小列的单位宽度
    var COLUMN_WIDTH;

    // 每行的单位高度
    var ROW_HEIGHT;
    var FINAL_SVG_WIDTH;

    var service = {
      init: init,
      fillData: fillData,
      getWeekParam: getWeekParam
    };

    var iconInfo = {
      "口": {
        'name': '口表',
        'style': 1,
        'radius': 5,
        'bgcolor': "#00f",
        "borderColor": "#00f"
      },
      "默": {
        'name': '腋表',
        'radius': 5,
        'bgcolor': "#00f",
        "borderColor": "#00f",
        "borderWidth": 1
      },
      "腋": {
        'name': '腋表',
        'radius': 5,
        'bgcolor': "#00f",
        "borderColor": "#00f",
        "borderWidth": 1
      },
      "肛": {
        'name': '肛表',
        'style': 2,
        'radius': 5,
        'bgcolor': "transparent",
        "borderColor": "#00f",
        "borderWidth": 1
      },
      "pulse": {
        'name': '脉搏',
        'style': 1,
        'radius': 5,
        'borderWidth': 1,
        'bgcolor': "#f00",
        "borderColor": "#f00"
      },
      "heartRate": {
        'name': '心率',
        'style': 2,
        'radius': 5,
        'borderWidth': 1,
        'bgcolor': "transparent",
        "borderColor": "#f00"
      },
      "painScore": {
        'name': '疼痛强度',
        'style': 2,
        'radius': 5,
        'borderWidth': 1,
        'bgcolor': "transparent",
        "borderColor": "#f00"
      }
    };

    function getWeekParam(date, indate) {
      var week = Math.ceil((new Date(date + ' 00:00:00').getTime() - new Date(indate + ' 00:00:00').getTime() + 24 * 3600 * 1000) / (7 * 24 * 3600 * 1000));

      return {
        startDate: moment(indate).add({
          days: (week - 1) * 7
        }).format('YYYY-MM-DD'),
        endDate: moment(indate).add({
          days: (week - 1) * 7
        }).format('YYYY-MM-DD')
      }
    }

    function setPlaceholder(config, source, len) {
      var objTemp = {};

      config[source].forEach(function (dic) {
        objTemp[dic.dicCode] = new Array(len);
      });

      return objTemp;
    }

    function getStrLen(str) {
      return str.replace(/[^\x00-\xff]/g, 'xx').length;
    }

    function getXOfText(column, holdColumnCount, text, fontSize) {

      fontSize = fontSize ? fontSize : 12;

      var len = getStrLen(text);
      var wordWidth = divide(times(len, fontSize), 2);
      // var wordWidth = divide(times(len, COLUMN_WIDTH), 2);
      var columnWidth = times(column, 6, COLUMN_WIDTH);
      var offsetX = divide(minus(times(holdColumnCount, COLUMN_WIDTH, 6), wordWidth), 2);
      var result = plus(columnWidth, offsetX);

      return result < 0 ? 2 : result;
    }

    function getYOfText(rowNum, holdRowCount, fontSize) {

      // (rowNum * ROW_HEIGHT) +  (((holdRowCount * ROW_HEIGHT) + fontSize) /2) - 1

      return minus(plus(times(rowNum, ROW_HEIGHT), divide(plus(times(holdRowCount, ROW_HEIGHT), fontSize), 2)), 1);
    }

    function getXOfCircle(column, offset) {
      var columnWidth = times(column, 6, COLUMN_WIDTH);
      return plus(columnWidth, times(offset, COLUMN_WIDTH));
    }

    function getYOfCircle(rowNum, offset) {
      return plus(times(rowNum, ROW_HEIGHT), offset);
    }

    function init(config, scope, element, vitalItems) {
      var pageSize = config.size.split(',');
      var dpi = angular.element('#dpi')[0].offsetHeight;
      var SCALE = dpi / 72;
      var marginHorizontal = (+_.get(config, 'margin.left') || 0) + (+_.get(config, 'margin.right') || 0);
      var marginVertival = (+_.get(config, 'margin.top') || 0) + (+_.get(config, 'margin.bottom') || 0);
      var width = estimateUtil.mmToPt(pageSize[0] - marginHorizontal) * SCALE;
      var height = estimateUtil.mmToPt(pageSize[1] - marginVertival) * SCALE;
      // 线条
      var columnLineData = [];
      // 文字
      var textArray = [];

      scope.containerWidth = pageSize[0] + 'mm';
      scope.containerHeight = pageSize[1] + 'mm';
      element[0].id = scope.id;

      scope.vitalItems = vitalItems;

      if (!scope.id) {
        throw new Error('体温单需要id！');
      }

      var tempRange = config.temperatureRange ? config.temperatureRange.split(',') : [35, 42];
      // 体温差值
      diff = parseInt(tempRange[1]) - parseInt(tempRange[0]);
      var container = angular.element('#' + scope.id);
      svg = container.find('svg');
      underGrid = container.find('.temperature-sheet__under-grid');
      var FOOTER_HEIGHT = 30;
      COLUMN_NUM = 8;
      ROW_CHART_NUM = (diff + 1) * 5;
      TOP_ROW_NUM = 5;
      ROW_4_HOUR_NUM = config.row4Hour.length * 2;
      ROW_12_HOUR_NUM = config.row12Hour.length * 2;
      ROW_24_HOUR_NUM = config.row24Hour.length * 2;

      ROW_CUSTOM_NUM = config.rowCustomCount * 2 || 0;

      var svgWidth = parseInt(width);
      // angular.element('.temperature-sheet-header').outerHeight()
      var contentHeight = parseInt(height) - 140 - FOOTER_HEIGHT;
      scope.contentHeight = contentHeight;

      if (config.row35DegChart) {
        // diff += 1;
        ROW_CHART_NUM += 5;
      }

      ROW_NUM = ROW_CHART_NUM + TOP_ROW_NUM + ROW_4_HOUR_NUM + ROW_12_HOUR_NUM + ROW_24_HOUR_NUM + ROW_CUSTOM_NUM + 2;

      // 每行的单位高度
      ROW_HEIGHT = Math.floor(contentHeight / ROW_NUM);

      // 每小列的单位宽度
      COLUMN_WIDTH = Math.floor(svgWidth / COLUMN_NUM / 6);

      FINAL_SVG_WIDTH = COLUMN_WIDTH * 6 * COLUMN_NUM;

      // svg样式
      scope.innerSvgOffsetLeft = 'calc((' + (pageSize[0] - marginHorizontal) + 'mm - ' + FINAL_SVG_WIDTH + 'px) / 2)';
      scope.innerSvgwidth = (COLUMN_NUM * 6) * COLUMN_WIDTH;
      svg.attr('id', scope.id + 'Svg').css({
        width: (scope.innerSvgwidth + 1) + 'px',
        height: (ROW_CHART_NUM + TOP_ROW_NUM) * ROW_HEIGHT + 'px',
        marginLeft: scope.innerSvgOffsetLeft,
        'outline': !config.seperatorLineStrok ? '1px solid black' : (config.seperatorLineStrok - 1) + 'px solid black'
      });
      underGrid.css({
        marginLeft: scope.innerSvgOffsetLeft,
        width: (FINAL_SVG_WIDTH + 1) + 'px',
        top: (ROW_CHART_NUM + 5) * ROW_HEIGHT + 'px',
        'outline': !config.seperatorLineStrok ? '1px solid black' : (config.seperatorLineStrok - 1) + 'px solid black',
        'margin-top': !config.seperatorLineStrok ? '0px solid black' : (config.seperatorLineStrok - 1) + 'px solid black'
      });

      scope.unitRowHeight = ROW_HEIGHT;
      scope.unitRowCount = ROW_NUM;

      scope.rowLabelWidth = COLUMN_WIDTH * 6;
      scope.rowHeight = ROW_HEIGHT * 2;

      scope.svgHeight = (ROW_CHART_NUM + TOP_ROW_NUM) * ROW_HEIGHT;
      scope.underGridHeight = (ROW_NUM - ROW_CHART_NUM - TOP_ROW_NUM - 2) * ROW_HEIGHT;
      scope.row4HourValueWidth = COLUMN_WIDTH;
      scope.row12HourValueWidth = COLUMN_WIDTH * 3;
      scope.row24HourValueWidth = COLUMN_WIDTH * 6;

      if (config.row35DegChart) {

        columnLineData.push({
          start: {
            x1: 6 * COLUMN_WIDTH + 0.5,
            y1: ((diff + 1) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          end: {
            x2: 8 * 6 * COLUMN_WIDTH + 0.5,
            y2: ((diff + 1) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          color: '#000',
          strokeWidth: config.seperatorLineStrok ? config.seperatorLineStrok : 1
        });

        columnLineData.push({
          start: {
            x1: 4 * COLUMN_WIDTH + 0.5,
            y1: ((diff + 1) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          end: {
            x2: 6 * COLUMN_WIDTH + 0.5,
            y2: ((diff + 1) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          color: '#000'
        });

        columnLineData.push({
          start: {
            x1: 5 * COLUMN_WIDTH + 0.5,
            y1: ((diff + 1) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          end: {
            x2: 5 * COLUMN_WIDTH + 0.5,
            y2: ((diff + 2) * 5 + 5) * ROW_HEIGHT + 0.5
          },
          color: '#000'
        });

        var row35ChartText = config.row35DegChart.dicName.split('');

        row35ChartText.forEach(function (textItem, i) {
          textArray.push({
            x: plus(getXOfText(0, 1 / 6, textItem, 10), times(4, COLUMN_WIDTH)),
            y: plus(plus(getYOfText(plus(5, times(plus(diff, 1), 5), i), 0, 10), times(0.5, ROW_HEIGHT)), 2),
            fontSize: 10,
            text: textItem
          });
        });

        for (var row35Unit = 10; row35Unit > 0; row35Unit -= 2) {
          textArray.push({
            x: getXOfText(5 / 6, 1 / 6, (minus(12, row35Unit)) + ''),
            y: getYOfText(minus(plus(times(plus(diff, 2), 5), (row35Unit) / 2), 1), 1, 12),
            fontSize: 12,
            text: (12 - row35Unit) + ''
          });
        }
      }

      for (var i = 0; i <= COLUMN_NUM; i++) {
        columnLineData.push({
          start: {
            x1: i * COLUMN_WIDTH * 6 + 0.5,
            y1: 0.5
          },
          end: {
            x2: i * COLUMN_WIDTH * 6 + 0.5,
            y2: ROW_HEIGHT * (ROW_CHART_NUM + 5) + 0.5
          }
        });
      }

      // 表头区域
      for (i = 0; i <= 3; i++) {
        columnLineData.push({
          start: {
            x1: 0.5,
            y1: i * ROW_HEIGHT + 0.5
          },
          end: {
            x2: COLUMN_WIDTH * 6 * COLUMN_NUM + 0.5,
            y2: i * ROW_HEIGHT + 0.5
          }
        });
      }

      // 时间区域
      columnLineData.push({
        start: {
          x1: COLUMN_WIDTH * 6 + 0.5,
          y1: 4 * ROW_HEIGHT + 0.5
        },
        end: {
          x2: FINAL_SVG_WIDTH + 0.5,
          y2: 4 * ROW_HEIGHT + 0.5
        }
      });

      columnLineData.push({
        start: {
          x1: 0.5,
          y1: 5 * ROW_HEIGHT + 0.5
        },
        end: {
          x2: FINAL_SVG_WIDTH + 0.5,
          y2: 5 * ROW_HEIGHT + 0.5
        }
      });

      // 上下午
      for (i = 0; i <= 13; i++) {
        columnLineData.push({
          start: {
            x1: 6 * COLUMN_WIDTH + i * COLUMN_WIDTH * 6 * 0.5 + 0.5,
            y1: 3 * ROW_HEIGHT
          },
          end: {
            x2: COLUMN_WIDTH * 6 + i * COLUMN_WIDTH * 6 * 0.5 + 0.5,
            y2: 4 * ROW_HEIGHT + 0.5
          },
          strokeWidth: (i == 0) ? (config.seperatorLineStrok ? config.seperatorLineStrok : 1) : 1
        });
      }

      // 时间列
      for (i = 0; i < 43; i++) {
        columnLineData.push({
          start: {
            x1: 6 * COLUMN_WIDTH + i * COLUMN_WIDTH + 0.5,
            y1: 4 * ROW_HEIGHT
          },
          end: {
            x2: 6 * COLUMN_WIDTH + i * COLUMN_WIDTH + 0.5,
            y2: (5 + ROW_CHART_NUM) * ROW_HEIGHT + 0.5
          },
          strokeWidth: (i == 0) ? (config.seperatorLineStrok ? config.seperatorLineStrok : 1) : 1
        });
      }

      columnLineData.push({
        start: {
          x1: Math.ceil(COLUMN_WIDTH * 4) + 0.5,
          y1: 5 * ROW_HEIGHT + 0.5
        },
        end: {
          x2: Math.ceil(COLUMN_WIDTH * 4) + 0.5,
          y2: (5 + ROW_CHART_NUM) * ROW_HEIGHT + 0.5
        }
      });

      // 网格横线
      for (i = 0; i < ROW_CHART_NUM; i++) {
        columnLineData.push({
          start: {
            x1: (i == 0 ? 0 : 6) * COLUMN_WIDTH + 0.5,
            y1: (i + 5) * ROW_HEIGHT + 0.5
          },
          end: {
            x2: FINAL_SVG_WIDTH + 0.5,
            y2: (i + 5) * ROW_HEIGHT + 0.5
          },
          strokeWidth: (i == 0) ? (config.seperatorLineStrok ? config.seperatorLineStrok : 1) : 1
        });
      }

      // 红色竖线
      for (i = 1; i < 8; i++) {

        columnLineData.push({
          start: {
            x1: i * 6 * COLUMN_WIDTH + 0.5,
            y1: 0.5
          },
          end: {
            x2: i * 6 * COLUMN_WIDTH + 0.5,
            y2: (5 + ROW_CHART_NUM) * ROW_HEIGHT + 0.5
          },
          color: config.dataAreaYLines ? config.dataAreaYLines[i - 2] : '#f00',
          strokeWidth: config.seperatorLineStrok ? config.seperatorLineStrok : 1
        });
      }

      // 蓝色横线
      for (i = 1; i < (diff + 1); i++) {

        columnLineData.push({
          start: {
            x1: 6 * COLUMN_WIDTH + 0.5,
            y1: (i * 5 + 5) * ROW_HEIGHT + 0.5
          },
          end: {
            x2: 8 * 6 * COLUMN_WIDTH + 0.5,
            y2: (i * 5 + 5) * ROW_HEIGHT + 0.5
          },
          color: config.dataAreaXLines ? config.dataAreaXLines[i - 1] : '#00f',
          strokeWidth: config.seperatorLineStrok ? config.seperatorLineStrok : 1
        });
      }

      scope.columnLineData = columnLineData;

      textArray.push({
        x: getXOfText(0, 1, config.headers.date, 10),
        y: getYOfText(0, 1, 10),
        fontSize: 10,
        text: config.headers.date
      }, {
          x: getXOfText(0, 1, config.headers.inHosDays, 10),
          y: getYOfText(1, 1, 10),
          fontSize: 10,
          text: config.headers.inHosDays
        }, {
          x: getXOfText(0, 1, config.headers.surgeryOrElse, 10),
          y: getYOfText(2, 1, 10),
          fontSize: 10,
          text: config.headers.surgeryOrElse
        }, {
          x: getXOfText(0, 1, '时间', 10),
          fontSize: 10,
          y: getYOfText(3, 2, 10),
          text: '时间'
        });

      for (i = 0; i < 14; i++) {
        var text = '下午';
        if (i % 2 == 0) {
          text = '上午';
        }
        textArray.push({
          x: getXOfText(i / 2 + 1, 0.5, text),
          fontSize: 12,
          y: getYOfText(3, 1, 12),
          text: text
        });
      }

      // 时间点
      var timeTitle = config.timesInterval.split(',');

      timeTitle.forEach(function (item, i) {

        var color = config.timesIntervalColors[i] || '#000';
        if (config.times12HourFormat) {
          if (parseInt(item) > 12)
            item = (parseInt(item) - 12) + '';
        }

        for (var n = 1; n < 8; n++) {
          textArray.push({
            x: getXOfText(n + i / 6, 1 / 6, item, 11),
            fontSize: 11,
            y: getYOfText(4, 1, 11),
            text: item,
            color: color
          });
        }
      });

      // 左侧坐标轴
      textArray.push({
        x: getXOfText(1.5 / 6, 2.2 / 6, '脉搏'),
        fontSize: 12,
        y: getYOfText(5, 1.5, 12),
        text: '脉搏',
        color: config.yAxisPulseTitleColor || '#f00'
      }, {
          x: getXOfText(1.5 / 6, 2.5 / 6, '(次/分)'),
          fontSize: 12,
          y: getYOfText(6, 1.5, 12),
          text: '(次/分)',
          color: config.yAxisPulseTitleColor || '#f00'
        }, {
          x: getXOfText(4 / 6, 2 / 6, '体温'),
          fontSize: 12,
          y: getYOfText(5, 1.5, 12),
          text: '体温',
          color: config.yAxisTemperatureTitleColor || '#f00'
        }, {
          x: getXOfText(4.2 / 6, 2 / 6, '(℃)'),
          fontSize: 12,
          y: getYOfText(6, 1.5, 12),
          text: '(℃)',
          color: config.yAxisTemperatureTitleColor || '#f00'
        });

      // 坐标轴数字
      for (i = 0; i < diff; i++) {
        textArray.push({
          x: getXOfText(2.5 / 6, 1 / 6, 160 - i * 20 + ''),
          fontSize: 12,
          y: getYOfText(9 + i * 5 + 0.5, 1, 12),
          text: 160 - i * 20 + '',
          color: config.yAxisPulseNodeColor || '#f00'
        }, {
            x: getXOfText(4 / 6, 2 / 6, (parseInt(tempRange[1]) - i) + '°'),
            fontSize: 12,
            y: getYOfText(9 + i * 5 + 0.5, 1, 12),
            text: (parseInt(tempRange[1]) - i - 1) + '°',
            color: config.yAxisTemperatureNodeColor || '#f00'
          });
      }

      // 图例
      var tempNum = ROW_CHART_NUM + 5;
      // 图表点的信息
      var circleArray = [];
      var tempText = ['口温', '腋温', '肛温', '脉搏', '心率'];
      tempText.forEach(function (textItem, i) {
        textArray.push({
          x: getXOfText(0, 1 / 6, textItem, 10),
          fontSize: 10,
          y: getYOfText(tempNum - (8.2 - i * 1.2), 1.5, 11),
          text: textItem
        });
      });

      circleArray.push({
        cx: 1.8 * COLUMN_WIDTH + 3,
        cy: (tempNum - 7) * ROW_HEIGHT - 3,
        radius: 5,
        color: '#00f'
      }, {
          cx: 1.8 * COLUMN_WIDTH + 3 + .2,
          cy: (tempNum - 4.8) * ROW_HEIGHT - 3,
          radius: 4.6,
          color: '#fff',
          stroke: '#00f',
          strokeWidth: 1
        }, {
          cx: 1.8 * COLUMN_WIDTH + 3,
          cy: (tempNum - 3.6) * ROW_HEIGHT - 3,
          radius: 5,
          color: '#f00'
        }, {
          cx: 1.8 * COLUMN_WIDTH + 3 + 0.2,
          cy: (tempNum - 2.4) * ROW_HEIGHT - 3,
          radius: 4.6,
          color: '#fff',
          stroke: '#f00',
          strokeWidth: 1
        });

      columnLineData.push({
        start: {
          x1: 1.8 * COLUMN_WIDTH - 1.4,
          y1: (tempNum - 5.9) * ROW_HEIGHT + 2
        },
        end: {
          x2: 1.8 * COLUMN_WIDTH + 5.6 + 1,
          y2: (tempNum - 5.9) * ROW_HEIGHT - 7
        },
        color: iconInfo['腋'].borderColor,
        strokeWidth: iconInfo['腋'].borderWidth
      }, {
          start: {
            x1: 1.8 * COLUMN_WIDTH - 1.4,
            y1: (tempNum - 5.9) * ROW_HEIGHT - 7
          },
          end: {
            x2: 1.8 * COLUMN_WIDTH + 5.6 + 1,
            y2: (tempNum - 5.9) * ROW_HEIGHT + 2
          },
          color: iconInfo['腋'].borderColor,
          strokeWidth: iconInfo['腋'].borderWidth
        });

      var row4HourData = setPlaceholder(scope.config, 'row4Hour', 42);
      var row12HourData = setPlaceholder(scope.config, 'row12Hour', 14);
      var row24HourData = setPlaceholder(scope.config, 'row24Hour', 7);
      var skinTestInfo = new Array(7);

      scope.row4HourData = row4HourData;
      scope.row12HourData = row12HourData;
      scope.row24HourData = row24HourData;

      scope.textArray = textArray;
      scope.circleArray = circleArray;
      scope.skinTestInfo = skinTestInfo;

      // $timeout(function () {
      scope.isReady = true;
      // });
    }

    /**************************************** 数据填充 *****************************************/
    function fillData(data, eventSourceData, scope, pageStartDate, sysConfig) {
      if (!data) {
        return;
      }
      // var sheetData = dataToShow(data);
      var patientInfo = scope.patientInfo;
      var inDateTime = moment(moment(patientInfo.inDate).format('YYYY-MM-DD'));
      var daysText = [];

      var row4HourData = setPlaceholder(scope.config, 'row4Hour', 42);
      var row12HourData = setPlaceholder(scope.config, 'row12Hour', 14);
      var row24HourData = setPlaceholder(scope.config, 'row24Hour', 7);

      var rowCustom = {};
      var rowCustomConfig = [];

      var skinTestInfo = new Array(7);
      var statusArray = _.map(scope.config.statusList, 'dicName');
      var expireDays = scope.config.surgeryExpireDays || 14;

      scope.dateArr = _.map(data, function (item, index) {
        var date = item.date;
        var momentDate = moment(date);
        var today = moment();
        var inHosDay = (momentDate.diff(inDateTime, 'days') + 1).toString();
        if (index > 0) {
          if (scope.config.headers.dateType == 'byMonthAndDay') {
            date = item.date.substr(5, 5);
          } else {
            date = item.date.substr(8, 2);
          }

          // 跨月
          if (!moment(item.date).isSame(data[index - 1].date, 'month')) {
            date = item.date.substr(5, 5);
          }

          // 跨年
          if (!moment(item.date).isSame(data[index - 1].date, 'year')) {
            date = item.date.substr(0, 10);
          }
        }

        /**
         * 第一天还是显示0，两台手术的话显示成2/3分母是第一台手术时间，分子是第二台手术时间，多台的话就显示为X4/X3/X2/X1
         * @type {string}
         */

        var surgeryArray = [];
        var surgeDates = [];
        var orderedEventSourceData = $filter('orderBy')(eventSourceData, 'recordTime');
        _.forEachRight(orderedEventSourceData, function (eventItem) {
          // 获取手术或分娩事件
          if (eventItem.event == 'ss' || eventItem.event == 'fm') {
            surgeDates.push(moment(new Date(eventItem.recordTime)));
          }
        });

        var romanCharcters = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
        surgeDates.forEach(function (dateItem, index) {
          if (
            (dateItem.isBefore(momentDate, 'day') || dateItem.isSame(momentDate, 'day')) &&
            (momentDate.isBefore(today, 'day') || today.isSame(momentDate, 'day')) &&
            (momentDate.diff(dateItem, 'days') < expireDays)
          ) {
            var deltaDays = momentDate.diff(dateItem.format('YYYY-MM-DD'), 'days');

            if (!scope.config.isToRecoredNewSurgery) {

              if (deltaDays == 0 && scope.config.surgeryDayCharacterSets && scope.config.surgeryDayCharacterSets === 'roman' && index < 20) {

                if (surgeDates.length - index - 1 === 0) {
                  surgeryArray.push('0');
                } else {
                  surgeryArray.push(romanCharcters[surgeDates.length - index - 1]);
                }
              } else {
                surgeryArray.push(deltaDays.toString());
              }
            } else {

              if (deltaDays == 0 && scope.config.surgeryDayCharacterSets && scope.config.surgeryDayCharacterSets === 'roman' && index < 20) {
                if (surgeDates.length - index - 1 === 0) {
                  surgeryArray.push('0');
                } else {
                  surgeryArray.push(romanCharcters[surgeDates.length - index - 1], '0');
                }
              } else {
                if (romanCharcters.indexOf(surgeryArray[0]) < 0) {
                  surgeryArray.push(deltaDays.toString());
                  surgeryArray = [surgeryArray[0]];
                }
              }
            }
          }
        });

        if (!scope.config.isShowSurgeryDay) {
          var findIndex = _.findIndex(surgeryArray, function (item) {
            return item == '0';
          });

          if (findIndex > -1) {
            surgeryArray.splice(findIndex, 1);
          }
        }

        if (surgeryArray.length > 0) {
          daysText.push({
            x: !scope.config.isToRecoredNewSurgery ? getXOfText(index + 1, 1, surgeryArray.join('/')) : getXOfText(index + 1, 1, surgeryArray.join('-')),
            fontSize: 12,
            y: getYOfText(2, 1, 12),
            text: !scope.config.isToRecoredNewSurgery ? surgeryArray.join('/') : surgeryArray.join('-'),
            color: '#f00'
          });
        }

        daysText.push({
          x: getXOfText(index + 1, 1, date),
          fontSize: 12,
          y: getYOfText(0, 1, 12),
          text: date
        }, {
            // 住院日期
            x: getXOfText(index + 1, 1, inHosDay),
            fontSize: 12,
            y: getYOfText(1, 1, 12),
            text: inHosDay
          });

        return item.date;
      });

      // 存储鼠标悬停信息
      scope.chartMouseMove = function (event) {
        scope.hoverIndex = Math.ceil(event.offsetX / (COLUMN_WIDTH * 6)) - 2;
      }

      scope.chartMouseLeave = function () {
        delete scope.hoverIndex;
      }

      scope.tableMouseEnter = function (index, baseline) {
        scope.hoverIndex = Math.floor(index / baseline);
      }

      scope.tableMouseLeave = function () {
        delete scope.hoverIndex;
      }

      function findSamePosition(point, collection) {
        return _.findIndex(collection, function (item) {
          return parseInt(point.cx) === parseInt(item.cx) && parseInt(point.cy) === parseInt(item.cy);
        });
      }
      var chartLineKeys = {
        heartRate: {
          max: 180,
          title: '心率'
        },
        temperature: {
          max: 42,
          title: '体温'
        },
        cooledTemperature: {
          max: 42,
          title: '降温体温'
        },
        pulse: {
          max: 180,
          title: '脉搏'
        },
        painScore: {
          max: 10,
          title: '疼痛强度'
        }
      };
      var row35DegData = []; // 35℃以下描述区
      var row35DegChartData = []; // 35℃以下曲线
      var pulsePointData = [];
      var heartRatePointData = [];
      var temperatureCrossData = [];
      var temperatureCrossDataForHover = [];
      var cooledTemperaturePointData = [];
      var temperatureCrossPointData = [];
      var temperaturePointData = [];
      var eventData = [];

      var under35DegSource = _.chain(scope.config.clickToSetValue)
        .map(function (values) {
          return _.filter(values, function (valueItem) {
            return valueItem.isShowUnder35Deg;
          });
        })
        .flatten()
        .value();

      var lanternSource = _.chain(scope.config.clickToSetValue)
        .map(function (values) {
          return _.filter(values, function (valueItem) {
            return valueItem.isShowLantern;
          });
        })
        .flatten()
        .value();

      function arr2Obj(arr) {
        return _.fromPairs(_.map(arr, function (item) {
          return [item.dicCode, item.dicName]
        }));
      }

      // TODO：35下显示权重配置
      function getNameUnder35Deg(measureName, vitalSigns) {
        var found = _.find(under35DegSource, function (item) {
          return item.dicName === measureName && vitalSigns === item.dicType;
        });

        return found && found.dicName || '';
      }

      // 是否显示连线成灯笼
      function isShowLineToLantern(measureCode) {
        var foundIndex = _.findIndex(lanternSource, function (item) {
          return item.dicCode === measureCode;
        });

        return foundIndex > -1;
      }

      var row4h = arr2Obj(scope.config.row4Hour);
      var row12h = arr2Obj(scope.config.row12Hour);
      var row24h = arr2Obj(scope.config.row24Hour);

      var times = _.map(scope.config.timesInterval.split(','), function (item) {
        return parseInt(item);
      });

      // times.unshift(0);

      var skinTestTextMap = {
        p: '(+)',
        n: '(-)'
      };
      // 体征数据
      data && data.forEach(function (item, index) {
        
        var columnIndex = index;
        var row12WhichToShow = {};

        _.map(item.vitalsignDatas, function (values, key) {
          var dateTimeArr = key.split(' ');
          var time = parseInt(dateTimeArr[1].split(':')[0]);

          if (dateTimeArr[0] != item.date) {
            time = 24 + time;
          }

          var timeIndex = times.indexOf(time);
          if (timeIndex == -1) {
            // 体征单一个显示多个体征的情况
            var additionTimeIndex;
            for (additionTimeIndex = 0; additionTimeIndex < times.length; additionTimeIndex++) {
              if (times[additionTimeIndex] > time) {
                break;
              }
            }
            timeIndex = additionTimeIndex - .5;
          }

          values.forEach(function (vitalItem) {
            var showObj = {
              label: vitalItem.measureName || '',
              value: vitalItem.vitalSignsValues
            };

            var specName = getNameUnder35Deg(vitalItem.measureName, vitalItem.vitalSigns);

            if (statusArray.indexOf(vitalItem.vitalSignsValues) > -1) {
              specName = vitalItem.vitalSignsValues;
            }

            if (specName !== '') {
              specName.split('').forEach(function (textItem, textItemIndex) {
                row35DegData.push({
                  x: getXOfText(columnIndex + ((timeIndex + 0.5) / 6) + 1, 1 / 6, textItem) - 0.5 * COLUMN_WIDTH,
                  y: getYOfText(5 + 7 * 5 + textItemIndex, 0, 10) + 0.5 * ROW_HEIGHT,
                  fontSize: 10,
                  color: '#00f',
                  isSkip: true,
                  columnIndex: columnIndex,
                  timeIndex: timeIndex,
                  text: textItem,
                  wholeText: specName
                });
              });
              // 如存在需要在35下显示，则在显示该体征处不显示该值。
              showObj.value = '';
            }

            // 呼吸机特殊显示
            if (vitalItem.vitalSigns === 'breath') {
              // TODO：呼吸方式字典
              var breathWays = ['02', '09', '10'];
              if (vitalItem.measureCode === '02') {
                showObj.symbol = '®';
                showObj.value = vitalItem.vitalSignsValues;
              }
              // if (breathWays.indexOf(vitalItem.measureCode) > -1) {
              //   vitalItem.measureName.split('').forEach(function(textItem, textItemIndex) {
              //     row35DegData.push({
              //       x: getXOfText(columnIndex + ((timeIndex + 0.5) / 6) + 1, 1 / 6, textItem) - 0.5 * COLUMN_WIDTH,
              //       y: getYOfText(5 + 7 * 5 + textItemIndex, 0, 10) + 0.5 * ROW_HEIGHT,
              //       fontSize: 10,
              //       color: '#00f',
              //       columnIndex: columnIndex,
              //       timeIndex: timeIndex,
              //       text: textItem
              //     });
              //   });
              // }
            }

            // ICON
            if (chartLineKeys[vitalItem.vitalSigns]) {
              if (vitalItem.vitalSigns === 'temperature' && !_.isNaN(parseInt(vitalItem.vitalSignsValues))) {
                var startKey = vitalItem.measureName && vitalItem.measureName.substr(0, 1) || '腋';

                if (!iconInfo[startKey]) {
                  // REVIEW
                  vitalItem.measureName.split('').forEach(function (textItem, textItemIndex) {
                    row35DegData.push({
                      x: getXOfText(columnIndex + ((timeIndex + 0.5) / 6) + 1, 1 / 6, textItem) - 0.5 * COLUMN_WIDTH,
                      y: getYOfText(5 + 7 * 5 + textItemIndex, 0, 10) - 0.5 * ROW_HEIGHT,
                      fontSize: 10,
                      columnIndex: columnIndex,
                      timeIndex: timeIndex,
                      color: '#00f',
                      text: textItem
                    });
                  });
                  return;
                }

                if (startKey === '腋') {

                  temperatureCrossData.push({
                    start: {
                      x1: minus(getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.35)), 2),
                      y1: plus(getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 2), 2, 0.5)
                    },
                    end: {
                      x2: plus(getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.35)), 6),
                      y2: plus(minus(getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 2), 7), 0.5)
                    },
                    color: iconInfo['腋'].borderColor,
                    strokeWidth: iconInfo['腋'].borderWidth,
                    value: vitalItem.vitalSignsValues
                  }, {
                      start: {
                        x1: minus(getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.35)), 2),
                        y1: plus(minus(getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 2), 7), 0.5)
                      },
                      end: {
                        x2: getXOfCircle(columnIndex + 1, timeIndex + 0.35) + 6,
                        y2: plus(getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 2), 2, 0.5)
                      },
                      color: iconInfo['腋'].borderColor,
                      strokeWidth: iconInfo['腋'].borderWidth,
                      value: vitalItem.vitalSignsValues
                    });

                  temperatureCrossDataForHover.push({
                    cx: getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.5)),
                    cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 0),
                    radius: 5,
                    style: '',
                    columnIndex: columnIndex,
                    timeIndex: timeIndex,
                    color: 'transparent',
                    stroke: 'transparent',
                    value: vitalItem.vitalSignsValues,
                    strokeWidth: 1
                  });
                } else if (iconInfo[startKey]) {
                  temperaturePointData.push({
                    cx: getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.5)),
                    cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 0),
                    radius: iconInfo[startKey].radius,
                    style: '',
                    columnIndex: columnIndex,
                    timeIndex: timeIndex,
                    color: iconInfo[startKey].bgcolor,
                    stroke: iconInfo[startKey].borderColor,
                    value: vitalItem.vitalSignsValues,
                    strokeWidth: iconInfo[startKey].borderWidth
                  });
                }

                // 用做计算重合
                if (iconInfo[startKey]) {
                  temperatureCrossPointData.push({
                    cx: getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.5)),
                    cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 0),
                    radius: iconInfo[startKey].radius,
                    style: '',
                    columnIndex: columnIndex,
                    color: iconInfo[startKey].bgcolor,
                    timeIndex: timeIndex,
                    stroke: iconInfo[startKey].borderColor,
                    value: vitalItem.vitalSignsValues,
                    strokeWidth: iconInfo[startKey].borderWidth
                  });
                }

                var thePulseSameIndexWithTemp = findSamePosition(_.last(temperatureCrossPointData), pulsePointData);
                var theHeartRateSameIndexWithTemp = findSamePosition(_.last(temperatureCrossPointData), heartRatePointData);

                // 体温与脉搏', '心率重合
                if (thePulseSameIndexWithTemp > -1 && !pulsePointData[thePulseSameIndexWithTemp].isRested) {
                  pulsePointData[thePulseSameIndexWithTemp].color = 'transparent';
                  pulsePointData[thePulseSameIndexWithTemp].radius += 1;
                  pulsePointData[thePulseSameIndexWithTemp].strokeWidth += 1;
                  pulsePointData[thePulseSameIndexWithTemp].isRested = true;
                }

                if (theHeartRateSameIndexWithTemp > -1 && !heartRatePointData[theHeartRateSameIndexWithTemp].isRested) {
                  heartRatePointData[theHeartRateSameIndexWithTemp].color = 'transparent';
                  heartRatePointData[theHeartRateSameIndexWithTemp].radius += 1;
                  heartRatePointData[theHeartRateSameIndexWithTemp].strokeWidth += 1;
                  heartRatePointData[theHeartRateSameIndexWithTemp].isRested = true;
                }
              }

              if (vitalItem.vitalSigns === 'cooledTemperature' && !_.isNaN(parseInt(vitalItem.vitalSignsValues))) {
                cooledTemperaturePointData.push({
                  cx: getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.5)),
                  cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 0.2), 5), 0),
                  radius: 5,
                  columnIndex: columnIndex,
                  color: 'transparent',
                  stroke: '#f00',
                  strokeWidth: 1,
                  measureCode: vitalItem.measureCode,
                  value: vitalItem.vitalSignsValues
                });
              }

              if (vitalItem.vitalSigns === 'pulse' && !_.isNaN(parseInt(vitalItem.vitalSignsValues))) {
                pulsePointData.push({
                  cx: getXOfCircle(plus(columnIndex, 1), plus(timeIndex, 0.5)),
                  cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 4), 5), 0),
                  radius: 5,
                  columnIndex: columnIndex,
                  timeIndex: timeIndex,
                  color: iconInfo[vitalItem.vitalSigns].bgcolor,
                  stroke: iconInfo[vitalItem.vitalSigns].borderColor,
                  strokeWidth: iconInfo[vitalItem.vitalSigns].borderWidth,
                  value: vitalItem.vitalSignsValues
                });

                var theTemperatureSameIndexWithPulse = findSamePosition(_.last(pulsePointData), temperatureCrossPointData);
                var theHeartRateSameIndexWithPulse = findSamePosition(_.last(pulsePointData), heartRatePointData);

                // 脉搏与体温重合
                if (theTemperatureSameIndexWithPulse > -1 && !_.last(pulsePointData).isRested) {
                  _.last(pulsePointData).color = 'transparent';
                  _.last(pulsePointData).radius += 1;
                  _.last(pulsePointData).strokeWidth += 1;
                  _.last(pulsePointData).isRested = true;
                }

                // 脉搏心率重合
                if (theHeartRateSameIndexWithPulse > -1 && !heartRatePointData[theHeartRateSameIndexWithPulse].isRested) {

                  var tempSheetPHROverlay = _.get(sysConfig, 'tempSheetPHROverlay.configValue') || '0';
                  if (tempSheetPHROverlay === '0') {
                    heartRatePointData[theHeartRateSameIndexWithPulse].radius += 1;
                    heartRatePointData[theHeartRateSameIndexWithPulse].strokeWidth += 1;
                    _.last(pulsePointData).radius -= 1;
                  } else if (tempSheetPHROverlay === '1') {
                    heartRatePointData[theHeartRateSameIndexWithPulse].display = 'none';
                  } else if (tempSheetPHROverlay === '2') {
                    _.last(pulsePointData).display = 'none';
                  }

                  heartRatePointData[theHeartRateSameIndexWithPulse].isRested = true;

                }
              }

              if (vitalItem.vitalSigns === 'heartRate' && !_.isNaN(parseInt(vitalItem.vitalSignsValues))) {
                heartRatePointData.push({
                  cx: getXOfCircle(columnIndex + 1, timeIndex + 0.5),
                  cy: getYOfCircle(plus(divide((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)), 4), 5), 0),
                  radius: 5,
                  columnIndex: columnIndex,
                  timeIndex: timeIndex,
                  color: iconInfo[vitalItem.vitalSigns].bgcolor,
                  stroke: iconInfo[vitalItem.vitalSigns].borderColor,
                  strokeWidth: iconInfo[vitalItem.vitalSigns].borderWidth,
                  value: vitalItem.vitalSignsValues
                });

                var theTemperatureSameIndexWithHeartRate = findSamePosition(_.last(heartRatePointData), temperatureCrossPointData);
                var thePulseSameIndexWitheartRate = findSamePosition(_.last(heartRatePointData), pulsePointData);

                // 心率与体温重合
                if (theTemperatureSameIndexWithHeartRate > -1) {
                  _.last(heartRatePointData).radius += 1;
                  _.last(heartRatePointData).strokeWidth += 1;
                  _.last(heartRatePointData).isRested = true;
                }

                // 心率与脉搏重合
                if (thePulseSameIndexWitheartRate > -1) {

                  _.last(heartRatePointData).radius += 1;
                  _.last(heartRatePointData).strokeWidth += 1;
                  _.last(heartRatePointData).isRested = true;

                  pulsePointData[thePulseSameIndexWitheartRate].radius -= 1;
                }
              }

            }

            // 非曲线区
            if (row4h[vitalItem.vitalSigns]) {
              row4HourData[vitalItem.vitalSigns][columnIndex * 6 + timeIndex] = showObj;
            }
            if (row12h[vitalItem.vitalSigns]) {
              if (!row12WhichToShow[vitalItem.vitalSigns]) {
                row12WhichToShow[vitalItem.vitalSigns] = [];
              }
              row12WhichToShow[vitalItem.vitalSigns].push({
                timeIndex: timeIndex,
                data: showObj.value
              });
              row12HourData[vitalItem.vitalSigns][columnIndex * 2 + Math.floor(timeIndex / 3)] = showObj;
            }
            if (row24h[vitalItem.vitalSigns] && vitalItem.vitalSigns !== 'skinTestInfo') {
              row24HourData[vitalItem.vitalSigns][columnIndex] = showObj;
            }

            var row35DegDicCode = scope.config.row35Deg ? scope.config.row35Deg.dicCode : null;
            var row35DegChartDicCode = scope.config.row35DegChart ? scope.config.row35DegChart.dicCode : null;
            // 处理自定义数据
            if (scope.vitalItems.filter(function (vItem) {
              return vItem.dicCode === vitalItem.vitalSigns;
            }).length === 0 && ['event', 'skinTestInfo', row35DegDicCode, row35DegChartDicCode].indexOf(vitalItem.vitalSigns) < 0) {

              if (!rowCustom[vitalItem.vitalSigns]) {
                rowCustom[vitalItem.vitalSigns] = new Array(7);
              }

              if (rowCustomConfig.indexOf(vitalItem.vitalSigns) < 0) {
                rowCustomConfig.push(vitalItem.vitalSigns);
              }

              rowCustom[vitalItem.vitalSigns][columnIndex] = {
                label: vitalItem.vitalSigns,
                value: showObj.value
              };
            }

            // 皮试
            if (vitalItem.vitalSigns === 'skinTestInfo' && !skinTestInfo[columnIndex]) {
              skinTestInfo[columnIndex] = _.chain(vitalItem.measureName)
                .split(',')
                .map(function (measureName, index) {
                  var values = vitalItem.vitalSignsValues && vitalItem.vitalSignsValues.split(',') || [];
                  var vitalSignsValue = _.get(values, index);
                  return {
                    value: measureName + (skinTestTextMap[vitalSignsValue] || ''),
                    color: vitalSignsValue === 'p' ? '#f00' : ''
                  };
                })
                .value();
            }

            if (scope.config.row35Deg && scope.config.row35Deg.dicCode === vitalItem.vitalSigns) {
              // TODO: 显示在35下描述的多个体征需要配置权重，权重最高的才显示
              vitalItem.vitalSignsValues && vitalItem.vitalSignsValues.split('').forEach(function (textItem, textItemIndex) {
                row35DegData.push({
                  x: getXOfText(columnIndex + ((timeIndex + 0.5) / 6) + 1, 1 / 6, textItem) - 0.5 * COLUMN_WIDTH,
                  y: getYOfText(5 + 7 * 5 + textItemIndex, 0, 10) + 0.5 * ROW_HEIGHT,
                  fontSize: 10,
                  color: '#00f',
                  text: textItem,
                  mode: isNaN(parseFloat(textItem)) ? '' : 'normal'
                });
              });
            }

            // 35°以下曲线数据
            if (scope.config.row35DegChart && scope.config.row35DegChart.dicCode === vitalItem.vitalSigns) {
              row35DegChartData.push({
                cx: getXOfCircle(columnIndex + 1, timeIndex + 0.5),
                cy: getYOfCircle((minus(chartLineKeys[vitalItem.vitalSigns].max, vitalItem.vitalSignsValues)) / 2 + 5, (diff + 1) * 5 * ROW_HEIGHT),
                radius: 5,
                columnIndex: columnIndex,
                timeIndex: timeIndex,
                color: iconInfo[vitalItem.vitalSigns].bgcolor,
                stroke: iconInfo[vitalItem.vitalSigns].borderColor,
                strokeWidth: iconInfo[vitalItem.vitalSigns].borderWidth,
                value: vitalItem.vitalSignsValues
              });
            }
          });
        });

        // 12小时一次的体征项按录入时间排序，根据不同的策略取不同的值
        if (!scope.config.row12HourEditType || scope.config.row12HourEditType == '4Hour') {
          row12WhichToShow = _.map(row12WhichToShow, function (whichItemValue, whichKey) {
            var sorted = _.sortBy(whichItemValue, 'timeIndex');
            var sortedIndex = sorted[0].timeIndex;

            row12HourData[whichKey][columnIndex * 2 + Math.floor(sortedIndex / 3)].value = sorted[0].data;
            return sorted;
          });
        } else if (scope.config.row12HourEditType == '12Hour') {

          var editTimePoint1 = scope.config.row12HourEditPoint1;
          var editTimePoint2 = scope.config.row12HourEditPoint2 + 3;

          row12WhichToShow = _.map(row12WhichToShow, function (whichItemValue, whichKey) {

            var resultItem = [];
            resultItem.push(_.find(whichItemValue, {
              'timeIndex': editTimePoint1
            }));
            resultItem.push(_.find(whichItemValue, {
              'timeIndex': editTimePoint2
            }));

            for (var i = 0; i < 2; i++) {
              _.set(row12HourData[whichKey], [columnIndex * 2 + i, 'value'], resultItem[i] ? resultItem[i].data : undefined);
              // row12HourData[whichKey][columnIndex * 2 + i].value = ;
            }
            // console.log('whichItemValue', whichItemValue);
            // console.log('resultItem', resultItem);
            // console.log('row12HourData', row12HourData);

            return resultItem;
          });
        }

      });

      // 事件区
      var existItem = {};
      eventSourceData && _.forEach(eventSourceData, function (eventItem) {

        var secondsOfTime = 4 * 60 * 60 * 1000;
        var secondsOfColumn = secondsOfTime * 6;

        var deltaTimes = new Date(eventItem.recordDate) - new Date(pageStartDate + ' 00:00:00');
        if (deltaTimes >= 0 && deltaTimes < secondsOfColumn * 7) {

          var columnIndex = Math.floor(deltaTimes / secondsOfColumn);
          var timeIndex = Math.floor((deltaTimes % secondsOfColumn) / secondsOfTime);
          while (existItem[columnIndex * 100 + timeIndex] != undefined) {
            timeIndex++;
          }

          var eventDictionary = sessionService.getDicHelper().getDictionary('eventType');
          var eventStr = eventDictionary[eventItem.event].dicName;
          eventStr = eventStr + ((eventItem.timeInChinese && !eventItem.hideTime) ? ("—" + eventItem.timeInChinese) : "");
          if (eventStr) {
            eventStr.split('').forEach(function (textItem, textItemIndex) {
              eventData.push({
                x: getXOfText(columnIndex + ((timeIndex + 0.4) / 6) + 1, 1 / 6, textItem, 10),
                // y: getYOfText(5 + textItemIndex, 1, 10),
                y: getYOfText(4 + textItemIndex + 0.3, 0, 10) + 0.5 * ROW_HEIGHT,
                fontSize: 10,
                color: '#f00',
                text: textItem
              });
            });
            existItem[columnIndex * 100 + timeIndex] = 'exsit';
          }
        }
      });

      // if (vitalItem.vitalSigns === 'event') {
      //   var eventStr = vitalItem.timeInChinese ? vitalItem.vitalSignsValues + '—' + vitalItem.timeInChinese : vitalItem.vitalSignsValues;
      //   console.log(eventStr);
      //   eventStr.split('').forEach(function (textItem, textItemIndex) {
      //     eventData.push({
      //       x: getXOfText(columnIndex + ((timeIndex + 0.5) / 6) + 1, 1 / 6, textItem) + 0.5,
      //       y: getYOfText(5 + textItemIndex, 0, 10),
      //       fontSize: 10,
      //       color: '#f00',
      //       text: textItem
      //     });
      //   });
      // }

      // 曲线区
      /*
       * 体温单 心率和脉搏连线规则:
       * 1. 心率和脉搏其实是一个东西, 只是测量的部位不同;
       * 2. 体温测量天数不连贯，则中断.
       * */
      var pulseLine = [];
      var row35DegLine = [];
      var temperatureLine = [];
      var cooledTemperatureLine = [];
      var heartRatePulseLine = [];
      var heartRateLine = [];
      var sortedTemperatureCrossPointData = _.sortBy(temperatureCrossPointData, 'cx');
      var sortedPulsePointData = _.sortBy(pulsePointData, 'cx');
      var sortedHeartRatePointData = _.sortBy(heartRatePointData, 'cx');
      var sorted35DegPointData = _.sortBy(row35DegChartData, 'cx');

      // 找出要在体温单中显示措施/方式的体征
      var showNameInSheetArr = _.chain(scope.config.clickToSetValue)
        .mapValues(function (values) {
          return _.filter(values, function (item) {
            return item.isShowInSheet;
          });
        })
        .filter(function (item) {
          return item.length > 0;
        })
        .map(function (item) {
          return _.map(item, 'nameInSheet');
        })
        .flatten()
        .value();

      scope.showNameInSheetArr = showNameInSheetArr;

      function isSkipJoin(start, end) {
        var startIndex = start.columnIndex * 6 + start.timeIndex;
        var endIndex = end.columnIndex * 6 + end.timeIndex;
        var str = statusArray.join("");
        var found35DegData = _.filter(row35DegData, function (item) {
          var index = item.columnIndex * 6 + item.timeIndex;
          return index > startIndex && index < endIndex && item.isSkip && str.indexOf(item.wholeText) != -1;
        });

        return found35DegData.length > 0;
      }

      sortedTemperatureCrossPointData.forEach(function (dataItem, index) {
        var columnIndex = dataItem.columnIndex;
        var nextItem = sortedTemperatureCrossPointData[index + 1];

        if (nextItem && (columnIndex + 1 === nextItem.columnIndex || columnIndex === nextItem.columnIndex) && !isSkipJoin(dataItem, nextItem)) {
          temperatureLine.push({
            start: {
              x1: dataItem.cx,
              y1: dataItem.cy
            },
            end: {
              x2: nextItem.cx,
              y2: nextItem.cy
            },
            color: '#00f'
          });
        }

        var cooledPointIndex = _.findIndex(cooledTemperaturePointData, function (pointItem) {
          return parseInt(dataItem.cx) === parseInt(pointItem.cx) && isShowLineToLantern(pointItem.measureCode);
        });
        //  降温连线
        if (cooledPointIndex > -1) {
          var cooledPoint = cooledTemperaturePointData[cooledPointIndex];

          cooledTemperatureLine.push({
            start: {
              x1: dataItem.cx,
              y1: dataItem.cy
            },
            end: {
              x2: cooledPoint.cx,
              y2: cooledPoint.cy
            },
            color: '#f00'
          });
        }
      });

      sortedPulsePointData.forEach(function (dataItem, index) {
        var columnIndex = dataItem.columnIndex;
        var nextItem = sortedPulsePointData[index + 1];

        if (nextItem && (columnIndex + 1 === nextItem.columnIndex || columnIndex === nextItem.columnIndex) && !isSkipJoin(dataItem, nextItem)) {

          // 判断两个结点间是否存在其它心率结点，如果有则不连线
          var containHeartRateDataIndex = _.findIndex(heartRatePointData, function (pointItem) {
            return parseInt(dataItem.cx) < parseInt(pointItem.cx) && parseInt(nextItem.cx) > parseInt(pointItem.cx);
          })

          if (containHeartRateDataIndex == -1) {
            pulseLine.push({
              start: {
                x1: dataItem.cx,
                y1: dataItem.cy
              },
              end: {
                x2: nextItem.cx,
                y2: nextItem.cy
              },
              color: '#f00'
            });
          }
        }

        // 心率和脉搏不一致时需要实线相连
        var heartRateDataIndex = _.findIndex(heartRatePointData, function (pointItem) {
          return parseInt(dataItem.cx) === parseInt(pointItem.cx);
        });

        if (heartRateDataIndex > -1) {
          var overly = heartRatePointData[heartRateDataIndex];

          heartRatePulseLine.push({
            start: {
              x1: dataItem.cx,
              y1: dataItem.cy
            },
            end: {
              x2: overly.cx,
              y2: overly.cy
            },
            color: '#f00'
          });
        }

      });

      sortedHeartRatePointData.forEach(function (dataItem, index) {
        var columnIndex = dataItem.columnIndex;
        var nextItem = sortedHeartRatePointData[index + 1];


        if (nextItem && (columnIndex + 1 === nextItem.columnIndex || columnIndex === nextItem.columnIndex) && !isSkipJoin(dataItem, nextItem)) {

          //判断两个结点间是否存在其它心率结点，如果有则不连线
          var containPulseDataIndex = _.findIndex(pulsePointData, function (pointItem) {
            return parseInt(dataItem.cx) < parseInt(pointItem.cx) && parseInt(nextItem.cx) > parseInt(pointItem.cx);
          })

          if (containPulseDataIndex == -1) {
            heartRateLine.push({
              start: {
                x1: dataItem.cx,
                y1: dataItem.cy
              },
              end: {
                x2: nextItem.cx,
                y2: nextItem.cy
              },
              color: '#f00'
            });
          }
        }
      });

      sorted35DegPointData.forEach(function (dataItem, index) {
        var columnIndex = dataItem.columnIndex;
        var nextItem = sorted35DegPointData[index + 1];

        if (nextItem && (columnIndex + 1 === nextItem.columnIndex || columnIndex === nextItem.columnIndex) && !isSkipJoin(dataItem, nextItem)) {

          row35DegLine.push({
            start: {
              x1: dataItem.cx,
              y1: dataItem.cy
            },
            end: {
              x2: nextItem.cx,
              y2: nextItem.cy
            },
            color: '#f00'
          });
        }
      });

      //  TODO : 35描述区重合处理

      scope.eventData = eventData;
      scope.pulsePointData = pulsePointData;
      scope.temperatureCrossData = temperatureCrossData;
      scope.temperatureCrossDataForHover = temperatureCrossDataForHover;
      scope.temperaturePointData = temperaturePointData;
      scope.heartRatePointData = heartRatePointData;
      scope.row35DegChartData = row35DegChartData;
      scope.cooledTemperaturePointData = cooledTemperaturePointData;
      scope.temperatureLine = temperatureLine;
      scope.cooledTemperatureLine = cooledTemperatureLine;
      scope.heartRatePulseLine = heartRatePulseLine;
      scope.pulseLine = pulseLine;
      scope.heartRateLine = heartRateLine;
      scope.daysText = daysText;
      scope.row35DegData = row35DegData;
      scope.row35DegLine = row35DegLine;

      scope.row4HourData = row4HourData;
      scope.row12HourData = row12HourData;
      scope.row24HourData = row24HourData;
      scope.skinTestInfo = skinTestInfo;

      // 上下交错显示的数据
      // TODO：呼吸是写死的，需要配置
      var upDowns = ['breath'];
      _.forEach(upDowns, function (key) {
        var notEmptyValues = _.chain(scope.row4HourData[key])
          .map(function (item, index) {
            return _.assign({}, item, {
              index: index
            });
          })
          .filter(function (item) {
            return !_.isEmpty(item.value);
          })
          .value();
        _.forEach(scope.row4HourData[key], function (item, index) {
          var correctItemIndex = _.findIndex(notEmptyValues, function (notEmptyItem) {
            return notEmptyItem.index === index;
          });
          if (correctItemIndex % 2 === 0) {
            item.isOdd = true;
          } else if (correctItemIndex > -1) {
            item.isEven = true;
          }
        });
      });

      // 自定义数据

      if (scope.config.rowCustomCount && scope.config.rowCustomCount > rowCustomConfig.length) {
        for (var i = scope.config.rowCustomCount - rowCustomConfig.length; i > 0; i -= 1) {
          rowCustomConfig.push('');
          rowCustom[''] = new Array(7);
        }
      }

      scope.rowCustomConfig = rowCustomConfig;
      scope.rowCustom = rowCustom;
    }

    return service;
  }
})();
