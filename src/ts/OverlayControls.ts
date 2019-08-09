
import { MOUSE, Object3D, Vector3 } from "three"
import { FineOrbitControls } from "./FineOrbitControls"
import * as TWEEN from "@tweenjs/tween.js"


/*
 * Another extension of camera controls. This one has code tailored for "snapping" to an image
 * plane, including animations. Special mouse, pan, and zoom controls are included. Everything works,
 * but there is definitely room for fine tuning and refinement.
 */

export class OverlayControls extends FineOrbitControls {

    public overlayActive = false;

    protected panOffset = new Vector3();
    protected distanceFromPlane = 8;
    protected overlayObj: Object3D

    private previousTarget: Vector3

    constructor(camera, element) {
        super(camera, element);
        this.minDistance = 1;
    }


    enableOverlay(overlayObj: Object3D) {
        this.overlayObj = overlayObj;

        this.overlayActive = true;

        const forward = new Vector3(0, 0, 1);
        const normal = forward.applyMatrix4(this.overlayObj.matrixWorld).normalize()

        this.previousTarget = this.target;
        this.enableRotate = false;
        this.mouseButtons = {
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }

        // camera.lookAt in orbitControls forces the camera's look vector to always be orthogonal to its up vector.
        // basically the camera stays horizontal when it needs to roll.
        // For jumping back to the previous pos/rot after "leaving" the photo view we should be doing tween's
        // back to the original pos/rot, so that should be saved here. This is particularly important for restoring normal roll
        this.forceUp = false;
        // handle camera roll
        new TWEEN.Tween(this.object.quaternion)
            .to(this.overlayObj.quaternion.clone(), 1000)
            .start()


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
            .to(overlayObj.position.clone(), 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }


    public updatePan() {
        if(this.overlayActive) {
            // a million failed experiments died here
            const home = this.overlayObj.up.clone();
            home.applyMatrix4(this.overlayObj.matrixWorld).normalize();
            home.multiplyScalar(this.distanceFromPlane);
            super.updatePan()
        } else {
            super.updatePan()
        }
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