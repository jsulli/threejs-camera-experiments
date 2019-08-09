import {BaseScene} from "./BaseScene"
import {Overlays} from "./Overlays"
import {CSS3DObject, CSS3DRenderer} from "three/examples/jsm/renderers/CSS3DRenderer"
import {
    DoubleSide, Intersection, Matrix4,
    Mesh,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    Raycaster,
    Scene, SphereBufferGeometry, TextureLoader,
    Vector2, Vector3
} from "three"
import * as TWEEN from '@tweenjs/tween.js'


export class OverlayScene extends BaseScene {

    private initialized = false;

    private overlays: Overlays
    private cssRenderer = new CSS3DRenderer();
    private cssObj: CSS3DObject
    private cssScene = new Scene();
    private matrix = new Matrix4();
    private mark = new Mesh(new SphereBufferGeometry(0.1));

    private raycaster = new Raycaster()

    private plane: Mesh

    constructor() {
        super();

        const material = new MeshBasicMaterial({ side: DoubleSide })
        this.plane = new Mesh(new PlaneBufferGeometry(1, 1), material)

        new TextureLoader().load("./assets/1a437cf032f9de7f0b117b13b007d8ff-small.jpg", (texture) => {
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            material.map = texture;
            material.needsUpdate = true;
        })

        this.plane.rotateX(-Math.PI / 4);
        this.plane.translateX(1.0)
        this.plane.translateY(0.5)
        this.plane.translateZ(0.8)
        this.plane.rotateY(Math.PI / 8)
        this.plane.scale.multiplyScalar(8);
        this.plane.geometry.computeBoundingBox();
        this.scene.add(this.plane);
        this.plane.updateMatrixWorld()


        // Align css overlay with plane object
        this.overlays = new Overlays();
        this.cssObj = new CSS3DObject(this.overlays.parent)
        this.cssObj.scale.multiplyScalar(0.001); // divide size by pixel width of the element. Why? Who knows.
        this.cssObj.applyMatrix(this.plane.matrixWorld)
        this.cssScene.add(this.cssObj)

        this.matrix.getInverse(this.plane.matrixWorld);
        const posMatrix = new Matrix4();
        posMatrix.setPosition(0.5, -0.5, 0);
        this.matrix.multiply(posMatrix);
        this.matrix.copyPosition(posMatrix);

        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = "absolute";
        this.cssRenderer.domElement.style.top = "0";
        this.cssRenderer.domElement.style.pointerEvents = "none";
        document.body.appendChild(this.cssRenderer.domElement);

        window.addEventListener('click', this.handleClick.bind(this))
        this.initialized = true;
    }


    public onViewResize() {
        super.onViewResize()
        this.cssRenderer.setSize( window.innerWidth, window.innerHeight );
    }


    private handleClick(e) {
        const mouse = new Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.camera.updateMatrixWorld(true)
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObject(this.plane);
        this.handleIntersect(intersects);
    }


    private handleIntersect(intersects: Intersection[]) {
        if(intersects && intersects.length > 0) {
            const intersect = intersects[0];
            const point = intersect.point;
            point.sub(this.plane.position)
            const normalized = point.applyMatrix4(this.matrix);

            if(this.controls.overlayActive) {
                normalized.multiply(new Vector3(1, -1, 1));
                this.mark.position.copy(normalized);
                this.moveElement(normalized.x, normalized.y)
            } else {
                this.controls.enableOverlay(this.plane);
            }
        }
    }


    private moveElement(x: number, y: number) {
        this.overlays.moveElement(x * 1000, y * 1000);
    }


    render() {
        TWEEN.update();
        super.render();
        if(this.initialized) {
            this.overlays.update();
            this.cssRenderer.render(this.cssScene, this.camera);
        }
    }
}