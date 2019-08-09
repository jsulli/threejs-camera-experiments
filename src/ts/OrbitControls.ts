import {
    EventDispatcher,
    MOUSE,
    OrthographicCamera,
    PerspectiveCamera,
    Quaternion,
    Spherical,
    TOUCH,
    Vector2,
    Vector3
} from "three"


export enum CONTROL_STATE {
    NONE = -1,
    ROTATE,
    DOLLY,
    PAN,
    TOUCH_ROTATE,
    TOUCH_PAN,
    TOUCH_DOLLY_PAN,
    TOUCH_DOLLY_ROTATE
}

/*
 * This is a TS rewrite of OrbitControls with no functional changes except turning interals properties
 * and functions into `protected`, to allow for more extendability without need to make functional
 * changes within the base class itself.
 *
 */
export class OrbitControls extends EventDispatcher {

    public object: PerspectiveCamera | OrthographicCamera
    public domElement
    public enabled = true
    public target = new Vector3()

    public minDistance = 0
    public maxDistance = Infinity

    public minZoom = 0
    public maxZoom = 0

    public minPolarAngle = 0
    public maxPolarAngle = Math.PI

    public minAzimuthAngle = -Infinity
    public maxAzimuthAngle = Infinity

    public enableDamping = false
    public dampingFactor = 1.0

    public enableZoom = true
    public zoomSpeed = 1.0

    public enableRotate = true
    public rotateSpeed = 1.0

    public enablePan = true
    public panSpeed = 1.0
    public screenSpacePanning = false
    public keyPanSpeed = 1.0

    public autoRotate = false
    public autoRotateSpeed = 2.0

    public enableKeys = true

    public keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40}

    public mouseButtons = {LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN}

    public touches = {ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN}

    public target0: Vector3
    public position0: Vector3
    public zoom0: number


    // internals

    protected changeEvent = {type: 'change'}
    protected startEvent = {type: 'start'}
    protected endEvent = {type: 'end'}

    protected state = CONTROL_STATE.NONE
    protected EPS = 0.000001

    protected spherical = new Spherical()
    protected sphericalDelta = new Spherical()

    protected scale = 1
    protected panOffset = new Vector3()
    protected zoomChanged = false

    protected rotateStart = new Vector2()
    protected rotateEnd = new Vector2()
    protected rotateDelta = new Vector2()

    protected panStart = new Vector2()
    protected panEnd = new Vector2()
    protected panDelta = new Vector2()

    protected dollyStart = new Vector2()
    protected dollyEnd = new Vector2()
    protected dollyDelta = new Vector2()


    constructor(object: PerspectiveCamera | OrthographicCamera, domElement) {
        super()
        this.object = object
        this.domElement = domElement || document


        this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this), false)

        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false)
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), false)

        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), false)
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), false)
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), false)

        window.addEventListener('keydown', this.onKeyDown.bind(this), false)

        // force an update at start

        this.update()
    }


    public getPolarAngle() {
        return this.spherical.phi
    }


    public getAzimuthalAngle() {
        return this.spherical.theta
    }


    public saveState() {
        this.target0.copy(this.target)
        this.position0.copy(this.object.position)
        this.zoom0 = this.object.zoom
    }


    public reset() {
        this.target.copy(this.target0)
        this.object.position.copy(this.position0)
        this.object.zoom = this.zoom0

        this.object.updateProjectionMatrix()
        this.dispatchEvent(this.changeEvent)

        this.update()

        this.state = CONTROL_STATE.NONE
    }


    public update(): boolean {
        const offset = new Vector3()

        const quat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0))
        const quatInverse = quat.clone().inverse()

        const lastPosition = new Vector3()
        const lastQuat = new Quaternion()

        const position = this.object.position
        offset.copy(position).sub(this.target)
        offset.applyQuaternion(quat)

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


        // move target to panned location
        if (this.enableDamping === true) {
            this.target.addScaledVector(this.panOffset, this.dampingFactor)
            this.panOffset.multiplyScalar(1 - this.dampingFactor)
        } else {
            this.target.add(this.panOffset)
            this.panOffset.set(0, 0, 0)
        }

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


    public dispose() {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu.bind(this), false)
        this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this), false)
        this.domElement.removeEventListener('wheel', this.onMouseWheel.bind(this), false)

        this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this), false)
        this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this), false)
        this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this), false)

        document.removeEventListener('mousemove', this.onMouseMove.bind(this), false)
        document.removeEventListener('mouseup', this.onMouseUp.bind(this), false)

        window.removeEventListener('keydown', this.onKeyDown.bind(this), false)
    };



    //
    // Internals
    //

    protected getAutoRotationAngle() {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed
    }


    protected getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed)
    }


    protected rotateLeft(angle) {
        this.sphericalDelta.theta -= angle
    }


    protected rotateUp(angle) {
        this.sphericalDelta.phi -= angle
    }


    protected panLeft(distance, objectMatrix) {
        const v = new Vector3()
        v.setFromMatrixColumn(objectMatrix, 0) // get X column of objectMatrix
        v.multiplyScalar(-distance)

        this.panOffset.add(v)
    }


    protected panUp(distance, objectMatrix) {
        const v = new Vector3()

        if (this.screenSpacePanning === true) {
            v.setFromMatrixColumn(objectMatrix, 1)
        } else {
            v.setFromMatrixColumn(objectMatrix, 0)
            v.crossVectors(this.object.up, v)
        }

        v.multiplyScalar(distance)
        this.panOffset.add(v)
    };


    // deltaX and deltaY are in pixels; right and down are positive
    protected pan(deltaX, deltaY) {

        const offset = new Vector3()


        const element = this.domElement === document ? this.domElement.body : this.domElement
        const camera = this.object

        if (camera instanceof PerspectiveCamera) {

            // perspective
            const position = this.object.position
            offset.copy(position).sub(this.target)
            let targetDistance = offset.length()

            // half of the fov is center to top of screen
            targetDistance *= Math.tan((camera.fov / 2) * Math.PI / 180.0)

            // we use only clientHeight here so aspect ratio does not distort speed
            this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix)
            this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix)

        } else if (camera instanceof OrthographicCamera) {
            // orthographic
            this.panLeft(deltaX * (camera.right - camera.left) / camera.zoom / element.clientWidth, camera.matrix)
            this.panUp(deltaY * (camera.top - camera.bottom) / camera.zoom / element.clientHeight, camera.matrix)
        } else {
            // camera neither orthographic nor perspective
            console.warn('WARNING: OrbitControls.ts encountered an unknown camera type - pan disabled.')
            this.enablePan = false
        }
    }


    protected dollyIn(dollyScale) {

        if (this.object instanceof PerspectiveCamera) {

            this.scale /= dollyScale
            console.log("scale " + this.scale)
            console.log("distance to target: " + this.object.position.distanceTo(this.target));

        } else if (this.object instanceof OrthographicCamera) {

            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale))
            this.object.updateProjectionMatrix()
            this.zoomChanged = true

        } else {

            console.warn('WARNING: OrbitControls.ts encountered an unknown camera type - dolly/zoom disabled.')
            this.enableZoom = false

        }
    }


    protected dollyOut(dollyScale) {

        if (this.object instanceof PerspectiveCamera) {

            this.scale *= dollyScale

        } else if (this.object instanceof OrthographicCamera) {

            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale))
            this.object.updateProjectionMatrix()
            this.zoomChanged = true

        } else {

            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
            this.enableZoom = false

        }
    }


    protected handleMouseDownRotate(event) {
        this.rotateStart.set(event.clientX, event.clientY)
    }

    protected handleMouseDownDolly(event) {
        this.dollyStart.set(event.clientX, event.clientY)
    }

    protected handleMouseDownPan(event) {
        this.panStart.set(event.clientX, event.clientY)
    }


    protected handleMouseMoveRotate(event) {
        this.rotateEnd.set(event.clientX, event.clientY)
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed)

        const element = this.domElement === document ? this.domElement.body : this.domElement

        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight) // yes, height
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight)
        this.rotateStart.copy(this.rotateEnd)
        this.update()

    }


    protected handleMouseMoveDolly(event) {
        this.dollyEnd.set(event.clientX, event.clientY)
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart)

        if (this.dollyDelta.y > 0) {
            this.dollyIn(this.getZoomScale())
        } else if (this.dollyDelta.y < 0) {
            this.dollyOut(this.getZoomScale())
        }

        this.dollyStart.copy(this.dollyEnd)

        this.update()
    }


    protected handleMouseMovePan(event) {
        this.panEnd.set(event.clientX, event.clientY)
        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed)
        this.pan(this.panDelta.x, this.panDelta.y)
        this.panStart.copy(this.panEnd)
        this.update()
    }


    protected handleMouseUp(event) { }


    protected handleMouseWheel(event) {
        if (event.deltaY < 0) {
            this.dollyOut(this.getZoomScale())
        } else if (event.deltaY > 0) {
            this.dollyIn(this.getZoomScale())
        }

        this.update()
    }


    protected handleKeyDown(event) {

        let needsUpdate = false

        switch (event.keyCode) {

            case this.keys.UP:
                this.pan(0, this.keyPanSpeed)
                needsUpdate = true
                break

            case this.keys.BOTTOM:
                this.pan(0, -this.keyPanSpeed)
                needsUpdate = true
                break

            case this.keys.LEFT:
                this.pan(this.keyPanSpeed, 0)
                needsUpdate = true
                break

            case this.keys.RIGHT:
                this.pan(-this.keyPanSpeed, 0)
                needsUpdate = true
                break
        }

        if (needsUpdate) {
            // prevent the browser from scrolling on cursor keys
            event.preventDefault()
            this.update()
        }
    }


    protected handleTouchStartRotate(event) {

        if (event.touches.length == 1) {
            this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
        } else {
            const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
            const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)

            this.rotateStart.set(x, y)
        }
    }


    protected handleTouchStartPan(event) {
        if (event.touches.length == 1) {
            this.panStart.set(event.touches[0].pageX, event.touches[0].pageY)
        } else {
            const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
            const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)
            this.panStart.set(x, y)
        }
    }

    protected handleTouchStartDolly(event) {
        const dx = event.touches[0].pageX - event.touches[1].pageX
        const dy = event.touches[0].pageY - event.touches[1].pageY
        const distance = Math.sqrt(dx * dx + dy * dy)

        this.dollyStart.set(0, distance)
    }


    protected handleTouchStartDollyPan(event) {
        if (this.enableZoom) this.handleTouchStartDolly(event)
        if (this.enablePan) this.handleTouchStartPan(event)
    }


    protected handleTouchStartDollyRotate(event) {
        if (this.enableZoom) this.handleTouchStartDolly(event)
        if (this.enableRotate) this.handleTouchStartRotate(event)
    }


    protected handleTouchMoveRotate(event) {

        if (event.touches.length == 1) {
            this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY)
        } else {
            const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
            const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)
            this.rotateEnd.set(x, y)
        }

        const element = this.domElement === document ? this.domElement.body : this.domElement

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed)
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight) // yes, height
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight)
        this.rotateStart.copy(this.rotateEnd)
    }


    protected handleTouchMovePan(event) {

        if (event.touches.length == 1) {
            this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY)
        } else {
            const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
            const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)
            this.panEnd.set(x, y)
        }

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed)
        this.pan(this.panDelta.x, this.panDelta.y)
        this.panStart.copy(this.panEnd)

    }


    protected handleTouchMoveDolly(event) {
        const dx = event.touches[0].pageX - event.touches[1].pageX
        const dy = event.touches[0].pageY - event.touches[1].pageY
        const distance = Math.sqrt(dx * dx + dy * dy)

        this.dollyEnd.set(0, distance)
        this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed))
        this.dollyIn(this.dollyDelta.y)
        this.dollyStart.copy(this.dollyEnd)
    }


    protected handleTouchMoveDollyPan(event) {
        if (this.enableZoom) this.handleTouchMoveDolly(event)
        if (this.enablePan) this.handleTouchMovePan(event)
    }


    protected handleTouchMoveDollyRotate(event) {
        if (this.enableZoom) this.handleTouchMoveDolly(event)
        if (this.enableRotate) this.handleTouchMoveRotate(event)
    }


    protected handleTouchEnd(event) { }


    protected onMouseDown(event) {

        if (this.enabled === false) return

        // Prevent the browser from scrolling.
        event.preventDefault()

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        this.domElement.focus ? this.domElement.focus() : window.focus()

        switch (event.button) {
            case 0:

                switch (this.mouseButtons.LEFT) {
                    case MOUSE.ROTATE:
                        if (event.ctrlKey || event.metaKey || event.shiftKey) {
                            if (this.enablePan === false) return
                            this.handleMouseDownPan(event)
                            this.state = CONTROL_STATE.PAN
                        } else {
                            if (this.enableRotate === false) return
                            this.handleMouseDownRotate(event)
                            this.state = CONTROL_STATE.ROTATE
                        }
                        break

                    case MOUSE.PAN:
                        if (event.ctrlKey || event.metaKey || event.shiftKey) {
                            if (this.enableRotate === false) return
                            this.handleMouseDownRotate(event)
                            this.state = CONTROL_STATE.ROTATE
                        } else {
                            if (this.enablePan === false) return
                            this.handleMouseDownPan(event)
                            this.state = CONTROL_STATE.PAN
                        }
                        break

                    default:
                        this.state = CONTROL_STATE.NONE
                }
                break

            case 1:

                if (this.mouseButtons.MIDDLE === MOUSE.DOLLY) {
                    if (this.enableZoom === false) return
                    this.handleMouseDownDolly(event)
                    this.state = CONTROL_STATE.DOLLY
                } else {
                    this.state = CONTROL_STATE.NONE
                }
                break

            case 2:

                switch (this.mouseButtons.RIGHT) {

                    case MOUSE.ROTATE:
                        if (this.enableRotate === false) return
                        this.handleMouseDownRotate(event)
                        this.state = CONTROL_STATE.ROTATE
                        break

                    case MOUSE.PAN:

                        if (this.enablePan === false) return
                        this.handleMouseDownPan(event)
                        this.state = CONTROL_STATE.PAN
                        break

                    default:
                        this.state = CONTROL_STATE.NONE
                }
                break
        }

        if (this.state !== CONTROL_STATE.NONE) {
            document.addEventListener('mousemove', this.onMouseMove.bind(this), false)
            document.addEventListener('mouseup', this.onMouseUp.bind(this), false)
            this.dispatchEvent(this.startEvent)
        }
    }


    protected onMouseMove(event) {

        if (this.enabled === false) return
        event.preventDefault()

        switch (this.state) {

            case CONTROL_STATE.ROTATE:

                if (this.enableRotate === false) return
                this.handleMouseMoveRotate(event)
                break

            case CONTROL_STATE.DOLLY:

                if (this.enableZoom === false) return
                this.handleMouseMoveDolly(event)
                break

            case CONTROL_STATE.PAN:

                if (this.enablePan === false) return
                this.handleMouseMovePan(event)
                break

        }
    }


    protected onMouseUp(event) {

        if (this.enabled === false) return

        this.handleMouseUp(event)

        document.removeEventListener('mousemove', this.onMouseMove.bind(this), false)
        document.removeEventListener('mouseup', this.onMouseUp.bind(this), false)

        this.dispatchEvent(this.endEvent)

        this.state = CONTROL_STATE.NONE

    }


    protected onMouseWheel(event) {
        if (this.enabled === false || this.enableZoom === false || (this.state !== CONTROL_STATE.NONE && this.state !== CONTROL_STATE.ROTATE)) return

        event.preventDefault()
        event.stopPropagation()

        this.dispatchEvent(this.startEvent)
        this.handleMouseWheel(event)
        this.dispatchEvent(this.endEvent)
    }


    protected onKeyDown(event) {
        if (this.enabled === false || this.enableKeys === false || this.enablePan === false) return
        this.handleKeyDown(event)
    }


    protected onTouchStart(event) {

        if (this.enabled === false) return

        event.preventDefault()

        switch (event.touches.length) {

            case 1:

                switch (this.touches.ONE) {

                    case TOUCH.ROTATE:

                        if (this.enableRotate === false) return
                        this.handleTouchStartRotate(event)
                        this.state = CONTROL_STATE.TOUCH_ROTATE
                        break

                    case TOUCH.PAN:

                        if (this.enablePan === false) return
                        this.handleTouchStartPan(event)
                        this.state = CONTROL_STATE.TOUCH_PAN
                        break

                    default:
                        this.state = CONTROL_STATE.NONE
                }
                break

            case 2:

                switch (this.touches.TWO) {

                    case TOUCH.DOLLY_PAN:

                        if (this.enableZoom === false && this.enablePan === false) return
                        this.handleTouchStartDollyPan(event)
                        this.state = CONTROL_STATE.TOUCH_DOLLY_PAN
                        break

                    case TOUCH.DOLLY_ROTATE:

                        if (this.enableZoom === false && this.enableRotate === false) return
                        this.handleTouchStartDollyRotate(event)
                        this.state = CONTROL_STATE.TOUCH_DOLLY_ROTATE
                        break

                    default:
                        this.state = CONTROL_STATE.NONE
                }

                break

            default:

                this.state = CONTROL_STATE.NONE

        }

        if (this.state !== CONTROL_STATE.NONE) {
            this.dispatchEvent(this.startEvent)
        }
    }


    protected onTouchMove(event) {

        if (this.enabled === false) return

        event.preventDefault()
        event.stopPropagation()

        switch (this.state) {

            case CONTROL_STATE.TOUCH_ROTATE:

                if (this.enableRotate === false) return
                this.handleTouchMoveRotate(event)
                this.update()
                break

            case CONTROL_STATE.TOUCH_PAN:

                if (this.enablePan === false) return
                this.handleTouchMovePan(event)
                this.update()
                break

            case CONTROL_STATE.TOUCH_DOLLY_PAN:

                if (this.enableZoom === false && this.enablePan === false) return
                this.handleTouchMoveDollyPan(event)
                this.update()
                break

            case CONTROL_STATE.TOUCH_DOLLY_ROTATE:

                if (this.enableZoom === false && this.enableRotate === false) return
                this.handleTouchMoveDollyRotate(event)
                this.update()
                break

            default:

                this.state = CONTROL_STATE.NONE
        }
    }


    protected onTouchEnd(event) {

        if (this.enabled === false) return
        this.handleTouchEnd(event)
        this.dispatchEvent(this.endEvent)
        this.state = CONTROL_STATE.NONE

    }


    protected onContextMenu(event) {
        if (this.enabled === false) return
        event.preventDefault()
    }


}