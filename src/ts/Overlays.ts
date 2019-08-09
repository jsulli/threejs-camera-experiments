

export class Overlays {

    public parent;
    private child;
    private child2;

    constructor() {
        this.parent = document.createElement('div');
        this.parent.style.position = "absolute";
        this.parent.style.width = "1000px";
        this.parent.style.height = "1000px";
        this.parent.style.pointerEvents = "none";

        this.child = document.createElement('div');
        this.child.style.position = "absolute";
        this.child.style.width = "25%";
        this.child.style.height = "25%";
        this.child.style.background = "#ffaa33";
        this.child.style.bottom = "0";
        this.child.style.right = "0";
        this.parent.appendChild(this.child);

        this.child2 = document.createElement('div');
        this.child2.style.position = "absolute";
        this.child2.style.width = "10%";
        this.child2.style.height = "25%";
        this.child2.style.background = "#33aaff";
        this.child2.style.top = "0";
        this.child2.style.left = "0";
        this.parent.appendChild(this.child2);
    }


    public update() {
        let timer = 0.001 * Date.now()
        let timer2 = 0.0015 * Date.now();
        const scale = 10
        const height = scale + (scale * Math.sin(timer));
        this.child.style.height = height + "%";
        this.child2.style.width = scale + (scale * Math.sin(timer2)) + "%";
    }

    public moveElement(x, y) {
        this.child.style.left = x + "px";
        this.child.style.top = y + "px";
    }
}