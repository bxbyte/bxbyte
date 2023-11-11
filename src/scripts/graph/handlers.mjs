import { Vector } from "./geometry.mjs";
export class GraphSimulation {
    centerForce = 1;
    nodeForce = -.1;
    linkForce = .05;
    linkLength = 4;
    ignoredForceStep = .01;
    setup(graph) {
        graph.nodes.forEach(node => {
            node.p.randomize(graph.bbox);
            node.upd();
        });
    }
    update(graph) {
        graph.nodes.forEach(async (nodeStart) => {
            if (graph.selectedNode == nodeStart)
                return;
            graph.nodes.forEach(async (nodeEnd) => {
                if (nodeStart == nodeEnd)
                    return;
                let v = Vector.dist(nodeStart.p, nodeEnd.p), d = v.length();
                if (d < 1)
                    return;
                let f = nodeStart.nodes.has(nodeEnd) ?
                    this.linkForce * (d - this.linkLength) :
                    this.nodeForce * nodeStart.nodes.size * nodeEnd.nodes.size / (d ** 2);
                if (f < this.ignoredForceStep && f > -this.ignoredForceStep)
                    return;
                v.div(d);
                v.mult(f);
                nodeStart.p.addForce(v);
            });
            nodeStart.p.upd();
            nodeStart.upd();
        });
        graph.links.forEach(async (link) => {
            link.upd();
        });
    }
}
