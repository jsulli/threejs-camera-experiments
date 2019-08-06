import {BaseScene} from "./BaseScene"
import {Overlays} from "./Overlays"
import {CSS3DObject, CSS3DRenderer} from "three/examples/jsm/renderers/CSS3DRenderer"
import {DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene, Vector2} from "three"


export class OverlayScene extends BaseScene {

    private overlays: Overlays
    private cssRenderer = new CSS3DRenderer();
    private cssObj: CSS3DObject
    private cssScene = new Scene();

    private plane: Mesh

    constructor() {
        super();

        const material = new MeshBasicMaterial({ color: 0x55ccff, side: DoubleSide })
        this.plane = new Mesh(new PlaneBufferGeometry(5, 5), material)
        this.plane.rotateX(-Math.PI / 4);
        this.scene.add(this.plane);
        this.plane.updateMatrix()
        this.plane.updateMatrixWorld(true)

        this.overlays = new Overlays(document.body);
        this.cssObj = new CSS3DObject(this.overlays.parent)
        this.cssObj.scale.multiplyScalar(0.005);
        console.log("css obj: ")
        console.log(this.cssObj)
        this.cssObj.applyMatrix(this.plane.matrixWorld)
        this.cssScene.add(this.cssObj)

        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = "absolute";
        this.cssRenderer.domElement.style.top = "0";
        this.cssRenderer.domElement.style.pointerEvents = "none";
        document.body.appendChild(this.cssRenderer.domElement);
    }


    render() {
        if(this.overlays) {
            this.overlays.update();
        }
        super.render();
        if(this.cssRenderer) {
            this.cssRenderer.render(this.cssScene, this.camera);
        }



    }
}