import {
    AxesHelper, BoxGeometry,
    DirectionalLight, Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer
} from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"


export class BaseScene {

    public scene = new Scene()
    public camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    public renderer = new WebGLRenderer()
    public controls = new OrbitControls(this.camera, this.renderer.domElement)

    private light = new DirectionalLight(0xffffff, 1.0)
    private axis = new AxesHelper(5)
    private box: Mesh


    constructor() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        document.body.appendChild(this.renderer.domElement)

        let material = new MeshBasicMaterial({
            color: 0xaaaaaa,
            wireframe: true
        })

        this.box = new Mesh(new BoxGeometry(2, 2, 2), material)

        this.box.position.set(1.5, 0, 1.5)
        this.camera.position.set(6, 3, 6)
        this.light.position.set(100, 100, 100)

        this.camera.lookAt(this.scene.position)

        this.scene.add(this.light)
        this.scene.add(this.axis)
        this.scene.add(this.box)

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

        let timer = 0.0015 * Date.now()
        this.box.position.y = 1.5 + (0.5 * Math.sin(timer))
        this.box.rotation.x += 0.02
        this.renderer.render(this.scene, this.camera)
    }
}



