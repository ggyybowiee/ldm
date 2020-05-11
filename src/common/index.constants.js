/* global moment:false */
/* global _:false */
/* global d3:false */
/* global $:false */
/* global URI:false */
/* global echarts:false */
(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .constant('moment', moment)
    .constant('_', _)
    .constant('d3', d3)
    .constant('$', $)
    .constant('URI', URI)
    .constant('echarts', echarts);
})();
