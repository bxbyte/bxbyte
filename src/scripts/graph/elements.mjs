import { Particule } from "./geometry.mjs";
import { GraphSimulation } from "./handlers.mjs";
const SVG_URI = "http://www.w3.org/2000/svg", PARTICULE_RADIUS = 1;
class GraphElement extends HTMLElement {
    #pt;
    convMatrix;
    bbox;
    svgEl;
    grpNodeEl;
    grpLinkEl;
    nodes;
    links;
    handler;
    selectedNode = undefined;
    static tagName = "graph-wrapper";
    connectedCallback() {
        this.svgEl = document.createElementNS(SVG_URI, "svg");
        this.svgEl.appendChild(this.grpLinkEl = document.createElementNS(SVG_URI, "g"));
        this.svgEl.appendChild(this.grpNodeEl = document.createElementNS(SVG_URI, "g"));
        this.appendChild(this.svgEl);
        this.svgEl.setAttribute("viewBox", `0 0 100 100`);
        this.#pt = this.svgEl.createSVGPoint();
        this.convMatrix = this.svgEl.getScreenCTM()?.inverse();
        this.bbox = this.svgEl.viewBox.baseVal;
        this.bbox.width -= PARTICULE_RADIUS;
        this.bbox.height -= PARTICULE_RADIUS;
        this.nodes = new Set();
        this.links = new Set();
        let nGraph = 10, minNode = 5, maxNode = 25 - minNode;
        for (let i = 0; i < nGraph; i++) {
            let nodes = Array.from({ length: ~~(maxNode * Math.random()) + minNode }, () => (this.newNode(new Particule()))), p = ~~(nodes.length + ~~(nodes.length * Math.random()));
            while (p > 0) {
                let node1 = nodes[~~(Math.random() * nodes.length)], node2 = nodes[~~(Math.random() * nodes.length)];
                if (node1 == node2 || node1.nodes.has(node2))
                    continue;
                this.bindNode(node1, node2);
                p -= 1;
            }
        }
        this.handler = new GraphSimulation();
        this.handler.setup(this);
        this.setEvents();
        setInterval(() => {
            this.handler.update(this);
        }, 10);
    }
    projectPt(x, y) {
        this.#pt.x = x;
        this.#pt.y = y;
        return this.#pt.matrixTransform(this.convMatrix);
    }
    setEvents() {
        window.addEventListener("resize", () => this.convMatrix = this.svgEl.getScreenCTM().inverse());
        let stopMoveNode = () => {
            if (!this.selectedNode)
                return;
            this.selectedNode = null;
            this.classList.remove("edit");
        };
        this.addEventListener("mouseup", stopMoveNode);
        this.addEventListener("mouseleave", stopMoveNode);
        this.addEventListener("mousemove", ({ pageX, pageY }) => {
            if (!this.selectedNode)
                return;
            this.selectedNode.p.from(this.projectPt(pageX, pageY));
            this.selectedNode.upd();
        });
    }
    setNodeControl(node) {
        node.svgEl.addEventListener("mousedown", () => {
            this.selectedNode = node;
            this.classList.add("edit");
        });
    }
    newNode(p) {
        let node = new GraphNode(p);
        this.grpNodeEl.appendChild(node.svgEl);
        this.setNodeControl(node);
        this.nodes.add(node);
        return node;
    }
    bindNode(nodeStart, nodeEnd) {
        let link = nodeStart.nodes.get(nodeEnd);
        if (link)
            return link;
        link = new GraphLink(nodeStart, nodeEnd);
        this.grpLinkEl.appendChild(link.svgEl);
        nodeStart.nodes.set(nodeEnd, link);
        nodeEnd.nodes.set(nodeStart, link);
        this.links.add(link);
        return link;
    }
    unBindNode(nodeStart, nodeEnd) {
        let link = nodeStart.nodes.get(nodeEnd);
        if (!link)
            return;
        this.links.delete(link);
        this.grpLinkEl.removeChild(link.svgEl);
        nodeStart.nodes.delete(nodeEnd);
        nodeEnd.nodes.delete(nodeStart);
    }
    growNode(nodeA) {
        let nodeB = this.newNode(new Particule());
        this.bindNode(nodeA, nodeB);
        return nodeB;
    }
}
class SVGWrapper {
    svgEl;
    constructor(svgEl) {
        this.svgEl = svgEl;
    }
}
class GraphNode extends SVGWrapper {
    nodes;
    p;
    constructor(p) {
        super(document.createElementNS(SVG_URI, "circle"));
        this.nodes = new Map();
        this.p = p;
    }
    upd() {
        this.svgEl.setAttribute('cx', `${this.p.x}`);
        this.svgEl.setAttribute('cy', `${this.p.y}`);
    }
}
class GraphLink extends SVGWrapper {
    nodeStart;
    nodeEnd;
    constructor(nodeStart, nodeEnd) {
        super(document.createElementNS(SVG_URI, "path"));
        this.nodeStart = nodeStart;
        this.nodeEnd = nodeEnd;
    }
    upd() {
        this.svgEl.setAttribute('d', `M${this.nodeStart.p} L${this.nodeEnd.p}`);
    }
}
customElements.define(GraphElement.tagName, GraphElement);
