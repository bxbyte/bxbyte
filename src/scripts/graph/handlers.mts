import type { GraphElement } from "./elements.mjs";
import { Particule, Vector } from "./geometry.mjs";

export type { GraphHandler };

interface GraphHandler {
    setup(graph: GraphElement): void
    update(graph: GraphElement): void
}

export class GraphSimulation implements GraphHandler {
    centerForce = 1
    nodeForce = -.1
    linkForce = .05
    linkLength = 4
    ignoredForceStep = .01

    setup(graph: GraphElement) {
        graph.nodes.forEach(node => {
            node.p.randomize(graph.bbox);
            node.upd();
        })
    }

    update(graph: GraphElement) {
        graph.nodes.forEach(async nodeStart => {
            if (graph.selectedNode == nodeStart)
                return;

            graph.nodes.forEach(async nodeEnd => {
                if (nodeStart == nodeEnd) 
                    return;

                let v = Vector.dist(nodeStart.p, nodeEnd.p),
                    d = v.length();

                if (d < 1)
                    return;

                let f = nodeStart.nodes.has(nodeEnd) ?
                    this.linkForce * (d - this.linkLength) : // Link force
                    this.nodeForce * nodeStart.nodes.size * nodeEnd.nodes.size / (d ** 2); // Node forces
                
                if (f < this.ignoredForceStep && f > -this.ignoredForceStep)
                    return;
                
                v.div(d);
                v.mult(f);
                nodeStart.p.addForce(v);
                // v.mult(-1);
                // nodeEnd.p.addForce(v);
            })
            // let v = Vector.dist(nodeStart.p, new Particule(50, 50)),
            //     d = v.length();

            // if (true) {
            //     let f = this.centerForce * nodeStart.nodes.size / (d ** 2); // Node forces
            
            //     if (f > this.ignoredForceStep || f < -this.ignoredForceStep) {
            //         v.div(d);
            //         v.mult(f);
            //         nodeStart.p.addForce(v);
            //     }
            // }

            nodeStart.p.upd();
            nodeStart.upd();
        })

        // Links forces
        graph.links.forEach(async link => {
            link.upd()
        })
    }
}

// randomizeNode(node: GraphNode) {
//     node.x = (this.svgEl.viewBox.baseVal.width - this.svgEl.viewBox.baseVal.x) * Math.random() + this.svgEl.viewBox.baseVal.x;
//     node.y = (this.svgEl.viewBox.baseVal.height - this.svgEl.viewBox.baseVal.y) * Math.random() + this.svgEl.viewBox.baseVal.y;
//     node.upd();
// }

// gravityNode(node: GraphNode) {
//     // node.dx = 0;
//     // node.dy = 0;
//     this.nodes.forEach(nodeEnd => {
//         let dx = node.x - nodeEnd.x,
//             dy = node.y - nodeEnd.y,
//             // d = Math.sqrt(dx ** 2 + dy ** 2);
//             d = Math.hypot(dx, dy);
//         if (d > 10 || d <= 0) {
//             this.unBindNode(node, nodeEnd);
//             return;
//         };
//         this.bindNode(node, nodeEnd)
//         let a = Math.atan2(dy, dx),
//             f = 1 / (d ** 2);
//         node.x += Math.cos(a) * f;
//         node.y += Math.sin(a) * f;
//         // node.dx *= Math.cos(a);
//         // node.dy *= Math.sin(a);
//     });
//     // (node.nodes.keys() as unknown as GraphNode[]).forEach(nodeEnd => {

//     // let dx = node.x - (this.svgEl.viewBox.baseVal.width + this.svgEl.viewBox.baseVal.x) / 2,
//     //     dy = node.y - (this.svgEl.viewBox.baseVal.height + this.svgEl.viewBox.baseVal.y) / 2,
//     //     d = Math.hypot(dx, dy),
//     //     a = Math.atan2(dy, dx),
//     //     f = 100 / (d ** 2);
//     // if (f < 1) {
//     //     node.x -= Math.cos(a) * f;
//     //     node.y -= Math.sin(a) * f;
//     // }

//     node.x += node.dx;
//     node.y += node.dy;   
    
//     if (this.svgEl.viewBox.baseVal.x > node.x) {
//         node.dx *= -1;
//         node.x = this.svgEl.viewBox.baseVal.x;
//     }
//     if (this.svgEl.viewBox.baseVal.width - 1 < node.x){
//         node.dx *= -1;
//         node.x = this.svgEl.viewBox.baseVal.width - 1;
//     }
//     if (this.svgEl.viewBox.baseVal.y > node.y) {
//         node.dy *= -1;
//         node.y = this.svgEl.viewBox.baseVal.y;
//     }
//     if (this.svgEl.viewBox.baseVal.height - 1 < node.y){
//         node.dy *= -1;
//         node.y = this.svgEl.viewBox.baseVal.height - 1;
//     }

//     // node.dx *= .999;
//     // node.dy *= .999;

//     node.upd();
// }
