import AFRAME from 'aframe'

AFRAME.registerComponent('planet-launcher', {
  schema: {
    target: {type: 'selector'}
  },

  init: function() {
    this.launching = false;

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2*3), 3));
    var material = new THREE.LineBasicMaterial({color: 0x00aa00, linewidth: 2});
    this.line = new THREE.Line(geometry, material);
    this.el.sceneEl.setObject3D('planet-launcher-line', this.line);

    this.tmp = new THREE.Vector3();

    this.el.addEventListener('abuttondown', this.startLaunch.bind(this));
    this.el.addEventListener('abuttonup', this.endLaunch.bind(this));
  },

  updateGeo: function() {
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.geometry.computeBoundingSphere();
  },

  setStart: function(v) {
    var pb = this.line.geometry.attributes.position.array;
    pb[0] = v.x;
    pb[1] = v.y;
    pb[2] = v.z;
    this.updateGeo();
  },

  setEnd: function(v) {
    var pb = this.line.geometry.attributes.position.array;
    pb[3] = v.x;
    pb[4] = v.y;
    pb[5] = v.z;
    this.updateGeo();
  },

  startLaunch: function() {
    this.launching = true;
    this.el.object3D.getWorldPosition(this.tmp);
    this.setStart(this.tmp);
    this.setEnd(this.tmp);
    this.line.visible = true;
  },

  endLaunch: function() {
    this.launching = false;
    this.line.visible = false;
    var newPlanet = document.createElement('a-planet');
    var pb = this.line.geometry.attributes.position.array;
    newPlanet.object3D.position.set(pb[0], pb[1], pb[2]);
    var vel = new THREE.Vector3(pb[3] - pb[0], pb[4] - pb[1], pb[5] - pb[2]);
    vel.multiplyScalar(5);
    newPlanet.setAttribute('physical', {mass: 0.1, vel: vel});
    this.data.target.appendChild(newPlanet);
  },

  tick: function() {
    if (this.launching) {
      this.el.object3D.getWorldPosition(this.tmp);
      this.setEnd(this.tmp);
    }
  }

});
