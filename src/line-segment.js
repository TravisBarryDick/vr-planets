// Helper class for drawing and updating line segments in three.js efficiently.
export function LineSegment(color, width, start, end) {
  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2*3), 3));
  var material = new THREE.LineBasicMaterial({color: color, linewidth: width});
  this.line = new THREE.Line(geometry, material);

  if (start) { this.setStart(start); }
  if (end) { this.setEnd(end); }
}

// Returns the THREE.Line instance
LineSegment.prototype.getLine = function() {
  return this.line;
};

// Updates the geometry of the LineSegment
LineSegment.prototype.updateGeo = function() {
  this.line.geometry.attributes.position.needsUpdate = true;
  // The geometry gets culled when its bounding sphere does not intersect with
  // the camera's frustum. After updating the start or end points, we need to
  // update the bounding sphere to get proper culling.
  this.line.geometry.computeBoundingSphere();
};

// Set the starting point of the LineSegment
LineSegment.prototype.setStart = function(v) {
  var pb = this.line.geometry.attributes.position.array;
  pb[0] = v.x;
  pb[1] = v.y;
  pb[2] = v.z;
  this.updateGeo();
};

// Set the ending point of the LineSegment
LineSegment.prototype.setEnd = function(v) {
  var pb = this.line.geometry.attributes.position.array;
  pb[3] = v.x;
  pb[4] = v.y;
  pb[5] = v.z;
  this.updateGeo();
};

// Copies the starting point of the line segment into the vector v
LineSegment.prototype.getStart = function(v) {
  var pb = this.line.geometry.attributes.position.array;
  v.x = pb[0];
  v.y = pb[1];
  v.z = pb[2];
};

// Copies the ending point of the line segment into the vector v
LineSegment.prototype.getEnd = function(v) {
  var pb = this.line.geometry.attributes.position.array;
  v.x = pb[3];
  v.y = pb[4];
  v.z = pb[5];
};

// Set the visibility property of the line
LineSegment.prototype.setVisible = function(visible) {
  this.line.visible = visible;
};
