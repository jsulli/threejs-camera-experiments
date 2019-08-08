
import {Mesh, MOUSE, Object3D, Vector3} from "three"
import {FineOrbitControls} from "./FineOrbitControls"
import * as TWEEN from "@tweenjs/tween.js"


export class OverlayControls extends FineOrbitControls {

    public overlayActive = false;

    protected panOffset = new Vector3();
    protected distanceFromPlane = 6;
    protected overlayObj: Object3D

    private previousTarget: Vector3

    constructor(camera, element) {
        super(camera, element);
        this.minDistance = 1;
    }


    enableOverlay(overlayObj: Object3D) {
        this.overlayObj = overlayObj;

        this.overlayActive = true;

        const normal = overlayObj.up.clone();
        // tbh i don't know why this matrix needs to be transposed. Something has weird axis'
        normal.applyMatrix4(overlayObj.matrixWorld.transpose()).normalize();

        this.previousTarget = this.target;
        this.enableRotate = false;
        this.mouseButtons = {
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }

        //
        normal.multiplyScalar(this.distanceFromPlane);
        const newPos = overlayObj.position.clone().add(normal);

        new TWEEN.Tween(this.object.position)
            .to(newPos, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => {
                this.enableRotate = false;
                this.maxDistance = this.distanceFromPlane;
            })
            .start()

        new TWEEN.Tween(this.target)
            .to(overlayObj.position, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }


    public updatePan() {
        if(this.overlayActive) {
            const home = this.overlayObj.up.clone();
            home.applyMatrix4(this.overlayObj.matrixWorld).normalize();
            home.multiplyScalar(this.distanceFromPlane);
        } else {
            super.updatePan()
        }

        // // move target to panned location
        // if (this.enableDamping === true) {
        //     this.target.addScaledVector(this.panOffset, this.dampingFactor)
        //     this.panOffset.multiplyScalar(1 - this.dampingFactor)
        // } else {
        //     this.target.add(this.panOffset)
        //     this.panOffset.set(0, 0, 0)
        // }
    }


    disableOverlay() {
        this.target.copy(this.previousTarget);
        this.enableRotate = true;
        this.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }
        this.maxDistance = Infinity;
        this.update();
    }
}