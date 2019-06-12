require('aframe');

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

// Represents an environment containing bodies that are affected by gravity
AFRAME.registerComponent('physical-environment', {
  schema: {
    // The number of seconds for each loop of the physics engine
    delta_t: {type: 'number', default: 1/1000},
    // A multiplier that affects how fast time in the simulation progresses
    // compared to real time.
    time_warp: {type: 'number', default: 1},
  },

  init: function() {
    this.tmpForceVec = new THREE.Vector3();
    this.remainingTime = 0;
  },

  // Sets the acceleration of each child element to zero
  resetAccels: function() {
    forEach(this.el.children, el => el.components['physical-body'].resetAccel());
  },

  // Applies a gravitational force between all pairs of children
  applyForces: function() {
    allPairs(this.el.children, (el1, el2) => {
      var p1 = el1.components['physical-body'];
      var p2 = el2.components['physical-body'];
      this.tmpForceVec.copy(p1.getPos()).sub(p2.getPos());
      var distSq = this.tmpForceVec.lengthSq();
      var F = p1.getMass() * p2.getMass() / distSq;
      this.tmpForceVec.normalize().multiplyScalar(F);
      p2.applyForce(this.tmpForceVec);
      this.tmpForceVec.negate();
      p1.applyForce(this.tmpForceVec);
    });
  },

  // Update the velocity and position of each child element
  doPhysics: function() {
    forEach(this.el.children, el => el.components['physical-body'].doPhysics(this.data.delta_t));
  },

  tick: function(time, timeDelta) {
    // Increase the remaining time in the physics simulation by the number of
    // seconds elapsed since previous tick, scaled by the current time_warp.
    this.remainingTime += timeDelta / 1000 * this.data.time_warp;
    // Complete iterations of the physics simulation until the remaining time
    // is less than one iteration.
    while(this.remainingTime > this.data.delta_t) {
      this.resetAccels();
      this.applyForces();
      this.doPhysics();
      this.remainingTime -= this.data.delta_t;
    }
  }
});

/////////////////////////////////////
// --- physical-body component --- //
/////////////////////////////////////

// Represents a body in a physical-environment that is affected by gravity
AFRAME.registerComponent('physical-body', {
  schema: {
    // The mass of this body
    mass: {type: 'number', default: 1},
    // The initial velocity of this body.
    'initial-vel': {type: 'vec3'},
  },

  init: function() {
    this.acc = new THREE.Vector3()
    this.vel = new THREE.Vector3()
  },

  update: function() {
    this.el.setAttribute('geometry', 'radius', Math.pow(this.getMass(), 1/3) / 10);
    this.vel.copy(this.data['initial-vel']);
  },

  // Returns the environment containing this body
  getEnvironment: function() {
    return this.el.parentNode;
  },

  // Accelerates this body's acceleration by applying a force vector to it
  applyForce: function(forceVector) {
    this.acc.addScaledVector(forceVector, 1/this.getMass());
  },

  // Sets the acceleration of this body to zero
  resetAccel: function() {
    this.acc.set(0,0,0);
  },

  // Returns the position of this body (in the reference frame of the parent
  // physical-environment
  getPos: function() {
    return this.el.object3D.position;
  },

  // Returns the mass of the body
  getMass: function() {
    return this.data.mass;
  },

  // Updates the body velocity and position
  doPhysics: function(timeDeltaSec) {
    this.vel.addScaledVector(this.acc, timeDeltaSec);
    this.el.object3D.position.addScaledVector(this.vel, timeDeltaSec);
  }
});

//////////////////////////////
// --- a-body primitive --- //
//////////////////////////////

var extendDeep = AFRAME.utils.extendDeep;
var meshMixin = AFRAME.primitives.getMeshMixin();

// A primitive for easily creating spherical bodies
AFRAME.registerPrimitive('a-body', extendDeep({}, meshMixin, {
  defaultComponents: {
    geometry: {primitive: 'sphere', segmentsWidth: 8, segmentsHeight: 8},
    'physical-body': {},
  },
  mappings: {
    mass: 'physical-body.mass',
    'initial-vel': 'physical-body.initial-vel'
  }
}));
