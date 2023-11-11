import { Particule } from "./geometry.mjs";
import { GraphHandler, GraphSimulation } from "./handlers.mjs";

export type { GraphElement, GraphNode };

const SVG_URI = "http://www.w3.org/2000/svg",
    PARTICULE_RADIUS = 1;

class GraphElement extends HTMLElement {
    #pt: DOMPoint
    convMatrix: DOMMatrix
    bbox: DOMRect
    svgEl: SVGSVGElement
    grpNodeEl: SVGGElement
    grpLinkEl: SVGGElement
    nodes: Set<GraphNode>
    links: Set<GraphLink>
    handler: GraphHandler
    selectedNode: GraphNode | undefined = undefined
    static tagName = "graph-wrapper"

    connectedCallback() {
        this.svgEl = document.createElementNS(SVG_URI, "svg");
        this.svgEl.appendChild(this.grpLinkEl = document.createElementNS(SVG_URI, "g"));
        this.svgEl.appendChild(this.grpNodeEl = document.createElementNS(SVG_URI, "g"));
        this.appendChild(this.svgEl);

        this.svgEl.setAttribute("viewBox", `0 0 100 100`);

        this.#pt = this.svgEl.createSVGPoint(); // Need to be updated when resize
        this.convMatrix = this.svgEl.getScreenCTM()?.inverse() as DOMMatrix;
        this.bbox = this.svgEl.viewBox.baseVal;
        this.bbox.width -= PARTICULE_RADIUS;
        this.bbox.height -= PARTICULE_RADIUS;

        this.nodes = new Set();
        this.links = new Set();
        
        // let firstNode = this.newNode(new Particule()),
        //     prevNode = firstNode;
        // Array.from({length: 1 << 5}, () => (prevNode = this.growNode(prevNode)));
        // this.bindNode(prevNode, firstNode);

        // firstNode = this.newNode(new Particule()),
        //     prevNode = firstNode;
        // Array.from({length: 1 << 4}, () => (prevNode = this.growNode(prevNode)));
        // this.bindNode(prevNode, firstNode);
        let nGraph = 10,
            minNode = 5,
            maxNode = 25 - minNode;
        for (let i = 0; i < nGraph; i++) {
            // let prevNode = this.newNode(new Particule()),
            //     graph = [prevNode];
            // graph = graph.concat(Array.from({length: maxNode}, () => (prevNode = this.growNode(prevNode))));
            let nodes = Array.from({length: ~~(maxNode * Math.random()) + minNode}, () => (this.newNode(new Particule()))),
                p = ~~(nodes.length + ~~(nodes.length * Math.random()));
            while (p > 0) {
                let node1 = nodes[~~(Math.random() * nodes.length)],
                    node2 = nodes[~~(Math.random() * nodes.length)];
                if (node1 == node2 ||  node1.nodes.has(node2))
                    continue;
                this.bindNode(node1, node2);
                p -= 1;
            }
        }

        // let nodes = Array.from({length: 1 << 7}, () => (this.newNode(new Particule()))),
        //     p = ~~(nodes.length * 2);
        // while (p > 0) {
        //     let node1 = nodes[~~(Math.random() * nodes.length)],
        //         node2 = nodes[~~(Math.random() * nodes.length)];
        //     if (node1 == node2 ||  node1.nodes.has(node2))
        //         continue;
        //     this.bindNode(node1, node2);
        //     p -= 1;
        // }
        // for(let nodeStart of this.nodes)
        //     for(let nodeEnd of this.nodes)
        //         this.bindNode(nodeStart, nodeEnd)

        this.handler = new GraphSimulation();
        this.handler.setup(this);

        this.setEvents()


        // let a = .25;
        // this.nodes.forEach(node => {
        //     this.randomizeNode(node);
        //     // node.dy += .981
        //     // node.dx += .981
        //     node.dx += (2 * Math.random() - 1) * a;
        //     node.dy += (2 * Math.random() - 1) * a;
        // });
        // this.links.forEach(async link => link.upd());
        setInterval(() => {
            // this.nodes.forEach(async node => this.randomizeNode(node));
            // this.nodes.forEach(async node => this.velocityNode(node));
            // this.nodes.forEach(async node => this.gravityNode(node));
            // this.links.forEach(async link => link.upd())
            this.handler.update(this);
        }, 10);
    }
    
    projectPt(x: number, y: number): DOMPoint {
        this.#pt.x = x;
        this.#pt.y = y;
        return this.#pt.matrixTransform(this.convMatrix);
    }

    setEvents() {
        window.addEventListener("resize", () => this.convMatrix = this.svgEl.getScreenCTM().inverse());
        let stopMoveNode = () => {
            if (!this.selectedNode)
                return
            this.selectedNode = null;
            this.classList.remove("edit");
        };
        this.addEventListener("mouseup", stopMoveNode);
        this.addEventListener("mouseleave", stopMoveNode);
        this.addEventListener("mousemove", ({pageX, pageY}) => {
            if (!this.selectedNode)
                return
            this.selectedNode.p.from(this.projectPt(pageX, pageY));
            this.selectedNode.upd();
        });
    }

    setNodeControl(node: GraphNode) {
        node.svgEl.addEventListener("mousedown", () => {
            this.selectedNode = node;
            this.classList.add("edit");
        });
    }

    newNode(p: Particule): GraphNode {
        let node = new GraphNode(p);
        this.grpNodeEl.appendChild(node.svgEl);
        this.setNodeControl(node);
        this.nodes.add(node);
        return node;
    }

    bindNode(nodeStart: GraphNode, nodeEnd: GraphNode): GraphLink {
        let link = nodeStart.nodes.get(nodeEnd)
        if (link) return link;
        link = new GraphLink(nodeStart, nodeEnd);
        this.grpLinkEl.appendChild(link.svgEl);
        nodeStart.nodes.set(nodeEnd, link);
        nodeEnd.nodes.set(nodeStart, link);
        this.links.add(link);
        return link;
    }

    unBindNode(nodeStart: GraphNode, nodeEnd: GraphNode) {
        let link = nodeStart.nodes.get(nodeEnd);
        if (!link) return;
        this.links.delete(link);
        this.grpLinkEl.removeChild(link.svgEl);
        nodeStart.nodes.delete(nodeEnd);
        nodeEnd.nodes.delete(nodeStart);
    }

    growNode(nodeA: GraphNode) {
        let nodeB = this.newNode(new Particule());
        this.bindNode(nodeA, nodeB);
        return nodeB;
    }
}

class SVGWrapper<T extends SVGElement> {
    svgEl: T

    constructor(svgEl: T) {
        this.svgEl = svgEl;
    }
}

class GraphNode extends SVGWrapper<SVGCircleElement> {
    nodes: Map<GraphNode, GraphLink>
    p: Particule

    constructor(p: Particule) {
        super(document.createElementNS(SVG_URI, "circle"));
        this.nodes = new Map();
        this.p = p;
    }

    upd() {
        this.svgEl.setAttribute('cx', `${this.p.x}`);
        this.svgEl.setAttribute('cy', `${this.p.y}`);
    }
}

class GraphLink extends SVGWrapper<SVGPathElement> {
    nodeStart: GraphNode
    nodeEnd: GraphNode

    constructor(nodeStart: GraphNode, nodeEnd: GraphNode) {
        super(document.createElementNS(SVG_URI, "path"));
        this.nodeStart = nodeStart;
        this.nodeEnd = nodeEnd;
    }

    upd() {
        this.svgEl.setAttribute('d', `M${this.nodeStart.p} L${this.nodeEnd.p}`);
    }
}

customElements.define(GraphElement.tagName, GraphElement);