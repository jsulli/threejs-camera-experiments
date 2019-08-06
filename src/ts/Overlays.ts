

export class Overlays {

    public parent;
    private child;
    private child2;

    constructor(container) {
        this.parent = document.createElement('div');
        this.parent.style.position = "absolute";
        //this.parent.style.top = "0";
        //this.parent.style.left = "0";
        //this.parent.style.background = "#ccff33";
        this.parent.style.width = "100%";
        this.parent.style.height = "100%";
        this.parent.style.pointerEvents = "none";

        this.child = document.createElement('div');
        this.child.style.position = "absolute";
        this.child.style.width = "25%";
        this.child.style.height = "25%";
        this.child.style.background = "#ffaa33";
        this.child.style.top = "50%";
        this.child.style.left = "50%";
        this.parent.appendChild(this.child);
        //container.appendChild(this.parent);

        this.child2 = document.createElement('div');
        this.child2.style.position = "absolute";
        this.child2.style.width = "10%";
        this.child2.style.height = "25%";
        this.child2.style.background = "#33aaff";
        this.child2.style.top = "10%";
        this.child2.style.left = "10%";
        this.parent.appendChild(this.child2);
    }


    public update() {
        let timer = 0.001 * Date.now()
        let timer2 = 0.0015 * Date.now();
        const scale = 10
        const height = scale + (scale * Math.sin(timer));
        //console.log("height = " + height)
        this.child.style.height = height + "%";
        this.child2.style.width = scale + (scale * Math.sin(timer2)) + "%";
    }

}