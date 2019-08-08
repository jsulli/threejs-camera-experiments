import {
    AxesHelper,
    BoxBufferGeometry,
    DirectionalLight,
    Mesh,
    MeshBasicMaterial,
    MOUSE,
    PerspectiveCamera,
    Scene,
    SphereBufferGeometry,
    Vector3,
    WebGLRenderer
} from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import {OverlayControls} from "./OverlayControls"


export class BaseScene {

    public scene = new Scene()
    public camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    public renderer = new WebGLRenderer()
    public controls = new OverlayControls(this.camera, this.renderer.domElement)

    private light = new DirectionalLight(0xffffff, 1.0)
    private axis = new AxesHelper(1)


    constructor() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.controls.screenSpacePanning = true;


        document.body.appendChild(this.renderer.domElement)

        let material = new MeshBasicMaterial({
            color: 0xaaaaaa,
            wireframe: true
        })

        const geo = new BoxBufferGeometry(3, 3, 3);
        const mesh = new Mesh(geo, material);
        this.scene.add(mesh)
        mesh.translateX(5)
        mesh.updateMatrixWorld(true)

        mesh.geometry.computeBoundingBox();
        const center = mesh.geometry.boundingBox.getCenter(new Vector3());
        center.applyMatrix4(mesh.matrixWorld)
        const mark = new Mesh(new SphereBufferGeometry(0.2));
        mark.position.copy(center)
        this.scene.add(mark)


        this.camera.position.set(6, 3, 6)
        this.light.position.set(100, 100, 100)

        this.camera.lookAt(this.scene.position)

        this.scene.add(this.light)
        this.scene.add(this.axis)

        window.addEventListener('resize', this.onViewResize.bind(this), false)

        this.render()
    }


    public onViewResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }


    public render() {
        requestAnimationFrame(this.render.bind(this))

        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
}



