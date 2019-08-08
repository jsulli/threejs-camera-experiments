
import {MOUSE, Vector3} from "three"
import {OrbitControls} from "./OrbitControls"


export class OverlayControls extends OrbitControls {

    private overlayEnabled = false;
    private previousTarget: Vector3
    protected panOffset = new Vector3();

    constructor(camera, element) {
        super(camera, element);
        console.log("creating overlay controls")
    }


    enableOverlay() {
        console.log("enabling overlay")
        this.previousTarget = this.target;
        this.enableRotate = false;
        this.mouseButtons = {
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }
        this.minDistance = 1;
        this.maxDistance = 6;
    }

    disableOverlay() {
        this.target = this.previousTarget;
        this.enableRotate = true;
        this.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }
    }

    // pan(x, y) {
    //     console.log("panning")
    //     return super.pan(x, y)
    // }
    //
    // panUp() {
    //     console.log("panning")
    //     const v = new Vector3();
    //     return (distance, matrix) => {
    //         if(this.screenSpacePanning) {
    //             v.setFromMatrixColumn(matrix, 1);
    //         } else {
    //             v.setFromMatrixColumn(matrix, 0);
    //             v.crossVectors(this.object.up, v);
    //         }
    //         v.multiplyScalar(distance);
    //         this.panOffset.add(v);
    //         this.logOffset()
    //     }
    // }
    //
    // panLeft() {
    //     const v = new Vector3();
    //     return (distance, matrix) => {
    //         v.setFromMatrixColumn(matrix, 0);
    //         v.multiplyScalar(-distance);
    //         this.panOffset.add(v);
    //         this.logOffset()
    //     }
    // }

    logOffset() {
        console.log("panOffset")
        console.log(this.panOffset);
    }
}