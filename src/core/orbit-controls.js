import * as THREE from 'three';
import { GlobeControls, clamp } from './globe-controls.js';

// Reuses tested pointer capture, pinch and tap-vs-drag handling from the Earth globe.
export class SpaceControls extends GlobeControls {
  constructor() {
    super();
    this.goal = { theta: .12, phi: .72, distance: 145 };
    this.pose3D = { ...this.goal };
    this.center = new THREE.Vector3();
    this.minDistance = 6;
  }
  rotate(dx, dy) {
    this.goal.theta -= dx * .005;
    this.goal.phi = clamp(this.goal.phi - dy * .004, .15, Math.PI - .15);
  }
  zoom(factor) { if (Number.isFinite(factor) && factor > 0) this.goal.distance = clamp(this.goal.distance * factor, this.minDistance, 650); }
  wheel(event) {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1;
    this.zoom(Math.exp(clamp(event.deltaY * unit, -120, 120) * .0018));
  }
  sync(camera, look) {
    this.center.copy(look);
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(look));
    this.goal = { theta: spherical.theta, phi: spherical.phi, distance: spherical.radius };
    this.pose3D = { ...this.goal };
  }
  update(dt, camera, look) {
    const blend = 1 - Math.exp(-10 * Math.min(dt, .1));
    for (const key of Object.keys(this.goal)) this.pose3D[key] += (this.goal[key] - this.pose3D[key]) * blend;
    camera.position.setFromSpherical(new THREE.Spherical(this.pose3D.distance, this.pose3D.phi, this.pose3D.theta)).add(this.center);
    look.copy(this.center);
  }
}
