require('aframe');

AFRAME.registerComponent('timewarp-dial', {
  schema: {
    target: {type: 'selector'}
  },

  init: function() {
    this.el.addEventListener('change', e => {
      var target = this.data.target;
      var oldTimeWarp = target.getAttribute('physical-environment', 'time_warp');
      var newTimeWarp = Math.max(oldTimeWarp + e.detail.value/4, 0);
      target.setAttribute('physical-environment', 'time_warp', newTimeWarp);
    });
  }
});
