import {
    AxesHelper, BoxGeometry,
    DirectionalLight, Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer
} from "three"


export class BaseScene {

    public scene = new Scene()
    public camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    public renderer = new WebGLRenderer()

    private light1 = new DirectionalLight(0xffffff, 1.0)
    private light2 = new DirectionalLight(0xffffff, 1.0)

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

        this.box.position.set(0.5, 0.5, 0)
        this.camera.position.set(5, 5, 5)
        this.light1.position.set(100, 100, 100)
        this.light2.position.set(-100, 100, -100)

        this.camera.lookAt(this.scene.position)

        this.scene.add(this.light1)
        this.scene.add(this.light2)
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

        let timer = 0.0015 * Date.now()
        this.box.position.y = 0.5 + 0.5 * Math.sin(timer)
        this.box.rotation.x += 0.03
        this.renderer.render(this.scene, this.camera)
    }
}



