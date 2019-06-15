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
    this.bodiesToRemove = [];
  },

  // Sets the acceleration of each child element to zero
  resetAccels: function() {
    forEach(this.el.children, el => el.components['physical-body'].resetAccel());
  },

  // Applies gravitational forces between bodies b1 and b2
  pairwiseGravity: function(b1, b2) {
    this.tmpForceVec.copy(b1.getPos()).sub(b2.getPos());
    var distSq = this.tmpForceVec.lengthSq();
    var F = b1.getMass() * b2.getMass() / distSq;
    this.tmpForceVec.normalize().multiplyScalar(F);
    b2.applyForce(this.tmpForceVec);
    this.tmpForceVec.negate();
    b1.applyForce(this.tmpForceVec);
  },

  // Process interactions between pairs of bodies (gravitational attraction and
  // collisions).
  bodyInteractions: function() {
    allPairs(this.el.children, (el1, el2) => {
      var b1 = el1.components['physical-body'];
      var b2 = el2.components['physical-body'];
      // If the bodies are colliding then merge them into one body
      if (b1.checkForCollision(b2)) {
        var bigger  = b1.getMass() > b2.getMass() ? b1 : b2;
        var smaller = b1.getMass() > b2.getMass() ? b2 : b1;
        this.bodiesToRemove.push(smaller.el);
        bigger.absorbBody(smaller);
      }
      // Otherwise, apply a gravitational force betweenthem
      else {
        this.pairwiseGravity(b1, b2);
      }
    });
  },

  // Adds and removes all the bodies from the add and remove arrays, and then
  // empties them.
  removeDeadBodies: function() {
    for (var b of this.bodiesToRemove) {
      this.el.removeChild(b);
    }
    this.bodiesToRemove.splice(0, this.bodiesToRemove.length);
  },

  // Update the velocity and position of each child element
  doBodyPhysics: function() {
    forEach(this.el.children, el => el.components['physical-body'].doPhysics(this.data.delta_t));
  },

  createAndAppendBody: function(mass, pos, vel, color) {
    var b = createBody(mass, pos, vel, color);
    this.el.appendChild(b);
  },

  tick: function(time, timeDelta) {
    // Increase the remaining time in the physics simulation by the number of
    // seconds elapsed since previous tick, scaled by the current time_warp.
    this.remainingTime += timeDelta / 1000 * this.data.time_warp;
    // Complete iterations of the physics simulation until the remaining time
    // is less than one iteration.
    while(this.remainingTime > this.data.delta_t) {
      this.resetAccels();
      this.bodyInteractions();
      this.removeDeadBodies();
      this.doBodyPhysics();
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
    this.vel.copy(this.data['initial-vel']);
  },

  update: function() {
    this.el.setAttribute('geometry', 'radius', this.getRadius());
  },

  // Returns the environment containing this body
  getEnvironment: function() {
    return this.el.parentNode;
  },

  // Absorbs another body into this one (and updates the mass, position, and
  // velocity accordingly)
  absorbBody: function(other) {
    var newMass = this.getMass() + other.getMass();

    var pos = this.getPos();
    pos.multiplyScalar(this.getMass());
    pos.addScaledVector(other.getPos(), other.getMass());
    pos.divideScalar(newMass);

    var vel = this.getVel();
    vel.multiplyScalar(this.getMass());
    vel.addScaledVector(other.getVel(), other.getMass());
    vel.divideScalar(newMass);

    this.el.setAttribute('physical-body', 'mass', newMass);
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

  // Returns the velocity of the vector
  getVel: function() {
    return this.vel;
  },

  // Returns the mass of the body
  getMass: function() {
    return this.data.mass;
  },

  // Returns the radius of the body
  getRadius: function() {
    return Math.pow(this.getMass(), 1/3) / 10;
  },

  // Checks whether this body is intersecting with other
  checkForCollision: function(other) {
    var dist = this.getPos().distanceTo(other.getPos());
    return dist <= this.getRadius() + other.getRadius();
  },

  // Updates the body velocity and position
  doPhysics: function(timeDeltaSec) {
    this.vel.addScaledVector(this.acc, timeDeltaSec);
    this.el.object3D.position.addScaledVector(this.vel, timeDeltaSec);
  }
});

export function createBody(mass, pos, vel, color) {
  var newBody = document.createElement('a-body');
  if (color) { newBody.setAttribute('material','color:' + color); }
  newBody.object3D.position.copy(pos);
  newBody.setAttribute('physical-body', {mass: mass, 'initial-vel': vel});
  return newBody;
}

//////////////////////////////
// --- a-body primitive --- //
//////////////////////////////

var extendDeep = AFRAME.utils.extendDeep;
var meshMixin = AFRAME.primitives.getMeshMixin();

// A primitive for easily creating spherical bodies
AFRAME.registerPrimitive('a-body', extendDeep({}, meshMixin, {
  defaultComponents: {
    geometry: {primitive: 'sphere', segmentsWidth: 10, segmentsHeight: 10},
    'physical-body': {},
  },
  mappings: {
    mass: 'physical-body.mass',
    'initial-vel': 'physical-body.initial-vel'
  }
}));
