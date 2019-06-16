require('aframe');
import { LineSegment } from './line-segment'

// A component that enables oculus-touch-controls to launch 'planets' (i.e.,
// bodies)
AFRAME.registerComponent('planet-launcher', {
  schema: {
    // The environment to launch planets in
    target: {type: 'selector'},
    launcherLine: {type: 'selector'},
  },

  init: function() {
    this.launching = false;

    this.planetIndex = 0;
    this.colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];

    this.line = new LineSegment(0x00ff00, 2);
    this.data.launcherLine.setObject3D('planet-launcher-line', this.line.getLine());

    this.tmp = new THREE.Vector3();

    this.el.addEventListener('abuttondown', this.startLaunch.bind(this));
    this.el.addEventListener('abuttonup', this.endLaunch.bind(this));
    this.el.addEventListener('xbuttondown', this.startLaunch.bind(this));
    this.el.addEventListener('xbuttonup', this.endLaunch.bind(this));
  },

  remove: function() {
    this.data.launcherLine.removeObject3D('planet-launcher-line');
  },

  tick: function() {
    if (this.launching) {
      this.el.object3D.getWorldPosition(this.tmp);
      this.line.setEnd(this.tmp);
    }
  },

  // Event handler starting a planet launch action
  startLaunch: function() {
    this.launching = true;
    this.el.object3D.getWorldPosition(this.tmp);
    this.line.setStart(this.tmp);
    this.line.setEnd(this.tmp);
    this.line.setVisible(true);
  },

  // Event handler ending a planet launch action
  endLaunch: function() {
    this.launching = false;
    this.line.setVisible(false);
    let planetColor = this.colors[this.planetIndex++ % this.colors.length];
    var pos = new THREE.Vector3();
    this.line.getStart(pos);
    var vel = new THREE.Vector3();
    this.line.getEnd(vel);
    vel.sub(pos).multiplyScalar(5);
    this.data.target.components['physical-environment'].createAndAppendBody(0.1, pos, vel, planetColor);
  }

});
