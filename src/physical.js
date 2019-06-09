import AFRAME from 'aframe'

//////////////////////////////
// --- Helper Functions --- //
//////////////////////////////

// Calls f(a[i], a[j]) for all 0 <= i < j < a.length.
function allPairs(a, f) {
  for (var i = 0; i < a.length; i++) {
    for (var j = i+1; j < a.length; j++) {
      f(a[i], a[j]);
    }
  }
}

// Calls f(a[i]) for all 0 <= i <= a.length
function forEach(a, f) {
  for (var i = 0; i < a.length; i++) {
    f(a[i]);
  }
}

////////////////////////////////////////////
// --- physical-environment component --- //
////////////////////////////////////////////

AFRAME.registerComponent('physical-environment', {
  schema: {
    // The number of seconds for each loop of the physics engine
    delta_t: {type: 'number', default: 1/1000},
    time_warp: {type: 'number', default: 1},
  },

  init: function() {
    this.tmpForceVec = new THREE.Vector3();
    this.remainingTime = 0;
  },

  resetAccels: function() {
    forEach(this.el.children, el => el.components.physical.resetAccel());
  },

  applyForces: function() {
    allPairs(this.el.children, (el1, el2) => {
      var p1 = el1.components.physical;
      var p2 = el2.components.physical;
      this.tmpForceVec.copy(p1.getPos()).sub(p2.getPos());
      var distSq = this.tmpForceVec.lengthSq();
      var F = p1.getMass() * p2.getMass() / distSq;
      this.tmpForceVec.normalize().multiplyScalar(F);
      p2.applyForce(this.tmpForceVec);
      this.tmpForceVec.multiplyScalar(-1);
      p1.applyForce(this.tmpForceVec);
    });
  },

  doPhysics: function() {
    forEach(this.el.children, el => el.components.physical.doPhysics(this.data.delta_t));
    this.remainingTime -= this.data.delta_t;
  },

  tick: function(time, timeDelta) {
    this.remainingTime += timeDelta / 1000 * this.data.time_warp;
    while(this.remainingTime > this.data.delta_t) {
      this.resetAccels();
      this.applyForces();
      this.doPhysics();
    }
  }
});

////////////////////////////////
// --- physical component --- //
////////////////////////////////

AFRAME.registerComponent('physical', {
  schema: {
    mass: {type: 'number', default: 1},
    vel: {type: 'vec3'},
    acc: {type: 'vec3'}
  },

  getEnvironment: function() {
    return this.el.parentNode;
  },

  init: function() {
    //this.getEnvironment().registerMe(this.el);
  },

  remove: function() {
    this.getEnvironment().unregisterMe(this.el);
  },

  update: function() {
    this.el.setAttribute('geometry', 'radius', Math.pow(this.data.mass, 1/3) / 10);
  },

  applyForce: function(fv) {
    this.data.acc.x += fv.x / this.data.mass;
    this.data.acc.y += fv.y / this.data.mass;
    this.data.acc.z += fv.z / this.data.mass;
  },

  resetAccel: function() {
    this.data.acc.x = 0;
    this.data.acc.y = 0;
    this.data.acc.z = 0;
  },

  getPos: function() {
    return this.el.object3D.position;
  },

  getMass: function() {
    return this.data.mass;
  },

  doPhysics: function(timeDeltaSec) {
    this.data.vel.x += this.data.acc.x * timeDeltaSec;
    this.data.vel.y += this.data.acc.y * timeDeltaSec;
    this.data.vel.z += this.data.acc.z * timeDeltaSec;
    this.el.object3D.position.addScaledVector(this.data.vel, timeDeltaSec);
  }
});

/////////////////////////////////////
// --- timewarp-dial component --- //
/////////////////////////////////////

AFRAME.registerComponent('timewarp-dial', {
  schema: {
    target: {type: 'selector'}
  },

  init: function() {
    this.el.addEventListener('change', e => {
      var target = this.data.target;
      var oldTimeWarp = target.components['physical-environment'].data.time_warp;
      var newTimeWarp = Math.max(oldTimeWarp + e.detail.value/4, 0);
      target.setAttribute('physical-environment', 'time_warp', newTimeWarp);
    });
  }
});

////////////////////////////////
// --- a-planet primitive --- //
////////////////////////////////

var extendDeep = AFRAME.utils.extendDeep;
var meshMixin = AFRAME.primitives.getMeshMixin();
AFRAME.registerPrimitive('a-planet', extendDeep({}, meshMixin, {
  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
  defaultComponents: {
    geometry: {primitive: 'sphere', segmentsWidth: 8, segmentsHeight: 8},
    physical: {},
  },
  mappings: {
    mass: 'physical.mass',
    vel: 'physical.vel'
  }
}));
