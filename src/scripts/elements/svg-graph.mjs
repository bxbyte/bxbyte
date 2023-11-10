const SVG_URI = "http://www.w3.org/2000/svg";

class GraphElement extends HTMLElement {
    #pt
    svgEl
    grpNodeEl
    grpLinkEl
    nodes
    selectedNode = null
    selectedInitPos = null
    static tagName = "graph-wrapper"

    connectedCallback() {
        this.svgEl = document.createElementNS(SVG_URI, "svg");
        this.svgEl.appendChild(this.grpLinkEl = document.createElementNS(SVG_URI, "g"));
        this.svgEl.appendChild(this.grpNodeEl = document.createElementNS(SVG_URI, "g"));
        this.appendChild(this.svgEl);

        // this.svgEl.setAttribute("width", document.body.clientWidth);
        // this.svgEl.setAttribute("height", document.body.clientHeight);
        // this.svgEl.setAttribute("viewBox", `0 0 ${document.body.clientWidth} ${document.body.clientHeight}`);
        this.svgEl.setAttribute("viewBox", `0 0 100 100`);

        this.#pt = this.svgEl.createSVGPoint(); // Need to be updated when resize
        this.convMatrix = this.svgEl.getScreenCTM().inverse();

        this.setEvents()

        // let firstNode = this.newNode(),
        //     prevNode = firstNode;
        // this.nodes = Array.from({length: 100}, () => (prevNode = this.growNode(prevNode)));
        // this.bindNode(this.nodes[this.nodes.length - 1], firstNode);
        // this.nodes.push(firstNode);

        this.nodes = Array.from({length: 20}, () => (this.newNode()));
        for(let i = 0; i < this.nodes.length; i++)
            for(let j = i; j < this.nodes.length; j++)
                this.bindNode(this.nodes[i], this.nodes[j])

        this.nodes.forEach(node => this.randomizeNode(node));
        // setInterval(() => {
        //     this.nodes.forEach(node => this.randomizeNode(node));
        // }, 1000);

        this.nodes.forEach(node => {
            node.dy += .981
            // node.dx += .981
        });
        setInterval(() => {
            this.nodes.forEach(async node => this.velocityNode(node));
        }, 10);
    }

    projectPt(px, py) {
        this.#pt.x = px;
        this.#pt.y = py;
        let {x, y} = this.#pt.matrixTransform(this.convMatrix);
        return [x, y];
    }

    setEvents() {
        window.addEventListener("resize", () => this.convMatrix = this.svgEl.getScreenCTM().inverse());
        this.addEventListener("mouseup", ({clientX, clientY}) => {
            if (!this.selectedNode)
                return
            let [dx, dy] = this.projectPt(clientX, clientY);
            this.selectedNode.dx = (dx - this.selectedInitPos[0]) / this.selectedInitPos[0];
            this.selectedNode.dy = (dy - this.selectedInitPos[1]) / this.selectedInitPos[1];
            this.selectedNode = null;
            this.selectedInitPos = null;
            this.classList.remove("edit");
        });
        this.addEventListener("mousemove", ({clientX, clientY}) => {
            if (!this.selectedNode)
                return
            [this.selectedNode.x, this.selectedNode.y] = this.projectPt(clientX, clientY)
            this.selectedNode.upd();
        });
    }

    setNodeControl(node) {
        node.svgEl.addEventListener("mousedown", ({clientX, clientY}) => {
            this.selectedNode = node;
            this.selectedInitPos = this.projectPt(clientX, clientY);
            this.classList.add("edit");
        });
    }

    randomizeNode(node) {
        node.x = (this.svgEl.viewBox.baseVal.width - this.svgEl.viewBox.baseVal.x) * Math.random() + this.svgEl.viewBox.baseVal.x;
        node.y = (this.svgEl.viewBox.baseVal.height - this.svgEl.viewBox.baseVal.y) * Math.random() + this.svgEl.viewBox.baseVal.y;
        node.upd();
    }

    velocityNode(node) {
        node.x += node.dx;
        node.y += node.dy;

        node.dx *= .99;
        node.dy *= .99;

        let [cx, cy] = this.collision(node);
        if (cx) node.dx *= -1;
        if (cy) node.dy *= -1;

        node.nodes.keys().forEach(nodeB => {
            
        })

        node.upd();
    }

    collision(node) {
        return [
            this.svgEl.viewBox.baseVal.x > node.x ? true : this.svgEl.viewBox.baseVal.width < node.x,
            this.svgEl.viewBox.baseVal.y > node.y ? true : this.svgEl.viewBox.baseVal.height < node.y
        ]
    }    

    newNode() {
        let svgCircleEl = document.createElementNS(SVG_URI, "circle"),
            node = new Node(svgCircleEl);
        this.grpNodeEl.appendChild(svgCircleEl);
        this.setNodeControl(node);
        return node;
    }

    bindNode(nodeA, nodeB) {
        let svgPathEl = document.createElementNS(SVG_URI, "path");
        svgPathEl.setAttribute('d', "M0,0 L0,0")
        this.grpLinkEl.appendChild(svgPathEl);
        nodeA.nodes.set(nodeB, new SideLinkStart(svgPathEl));
        nodeB.nodes.set(nodeA, new SideLinkEnd(svgPathEl));
    }

    growNode(nodeA) {
        let nodeB = this.newNode();
        this.bindNode(nodeA, nodeB);
        return nodeB;
    }
}

class Node {
    svgEl
    nodes
    x = 0
    y = 0
    dx = 0
    dy = 0


    constructor(svgEl) {
        this.svgEl = svgEl;
        this.nodes =  new Map();
    }

    upd() {
        this.svgEl.setAttribute('cx', this.x);
        this.svgEl.setAttribute('cy', this.y);
        this.nodes.entries().forEach(([node, link]) => link.upd(this, node))
    }
}

class SideLinkStart {
    svgEl

    constructor(svgEl) {
        this.svgEl = svgEl;
    }

    upd(ptA, ptB) {
        this.svgEl.setAttribute('d', `M${ptA.x},${ptA.y} L${ptB.x},${ptB.y}`)
    }
}

class SideLinkEnd {
    svgEl

    constructor(svgEl) {
        this.svgEl = svgEl;
    }

    upd(ptA, ptB) {
        this.svgEl.setAttribute('d', `M${ptB.x},${ptB.y} L${ptA.x},${ptA.y}`)
    }
}

customElements.define(GraphElement.tagName, GraphElement);