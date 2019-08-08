import {CONTROL_STATE, OrbitControls} from "./OrbitControls"
import {Quaternion, Vector3} from "three"


export class FineOrbitControls extends OrbitControls {



    update(): boolean {
        const offset = new Vector3()

        const quat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0))
        const quatInverse = quat.clone().inverse()

        const lastPosition = new Vector3()
        const lastQuat = new Quaternion()

        const position = this.object.position
        offset.copy(position).sub(this.target)
        offset.applyQuaternion(quat)

        this.updateRotation(offset);
        this.updatePan()

        offset.setFromSpherical(this.spherical)

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse)
        position.copy(this.target).add(offset)
        this.object.lookAt(this.target)
        this.scale = 1

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (this.zoomChanged ||
            lastPosition.distanceToSquared(this.object.position) > this.EPS ||
            8 * (1 - lastQuat.dot(this.object.quaternion)) > this.EPS) {

            this.dispatchEvent(this.changeEvent)

            lastPosition.copy(this.object.position)
            lastQuat.copy(this.object.quaternion)
            this.zoomChanged = false

            return true
        }

        return false
    }


    public updateRotation(offset: Vector3) {
        // angle from z-axis around y-axis
        this.spherical.setFromVector3(offset)

        if (this.autoRotate && this.state === CONTROL_STATE.NONE) {
            this.rotateLeft(this.getAutoRotationAngle())
        }

        if (this.enableDamping) {
            console.log("damping factor " + this.dampingFactor)
            this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor
            this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor
        } else {
            this.spherical.theta += this.sphericalDelta.theta
            this.spherical.phi += this.sphericalDelta.phi
        }

        // restrict theta to be between desired limits
        this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta))

        // restrict phi to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi))
        this.spherical.makeSafe()
        this.spherical.radius *= this.scale

        // restrict radius to be between desired limits
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius))

        if (this.enableDamping === true) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor)
            this.sphericalDelta.phi *= (1 - this.dampingFactor)
        } else {
            this.sphericalDelta.set(0, 0, 0)
        }
    }


    public updatePan() {
        // move target to panned location
        if (this.enableDamping === true) {
            this.target.addScaledVector(this.panOffset, this.dampingFactor)
            this.panOffset.multiplyScalar(1 - this.dampingFactor)
        } else {
            this.target.add(this.panOffset)
            this.panOffset.set(0, 0, 0)
        }
    }


}