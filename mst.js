import { VisNetwork, Nodes, Edges } from "./network.js";

export class MSTNetwork extends VisNetwork
{
    #groupColors;
    constructor(container, nodes, edges)
    {
        const _nodes = new Nodes(structuredClone(nodes.get()));
        const _edges = new Edges(structuredClone(edges.get()));
        
        super(container, _nodes, _edges);


        this.#groupColors = [
            { background: '#A8E6A1', border: '#2E8B57' }, // 0
            { background: '#F6B8B8', border: '#B22222' }, // 1
            { background: '#FFE0B2', border: '#FB8C00' }, // 2
            { background: '#D1C4E9', border: '#673AB7' }, // 3
            { background: '#B2EBF2', border: '#00ACC1' }  // 4
          ];

        const options = {
            groups: this.#generateGroup()
        };

        this.setOptions(options);
    }

    mark(toVisit, add)
    {
        const color = add ? '#2E8B57' : '#B22222';
        this.edges.setProperties(toVisit, {color});
    }

    #generateGroup()
    {
          
        const groups = {};
        
        this.#groupColors.forEach((color, index) => {
        const name = `${index}`;
        groups[name] = {
            color: {
                background: color.background,
                border: color.border,
                highlight: {
                        background: color.background,
                        border: color.border
                    },
                hover: {
                        background: color.background,
                        border: color.border
                    }
                }
            };
        });
        return groups;          
    }

    colorNode(node, class1)
    {
        this.nodes.setProperties(node, {group:`${class1 % this.#groupColors.length}`});
    }
}

class EdgeBased
{
    #network
    #current;

    #nodeClass;
    #classMap;

    #classNum;
    #visited;

    constructor(network)
    {
        this.#network = network;
        this.#current = 0;

        this.#nodeClass = new Map();
        this.#classMap = new Map();
        this.#visited = new Set();

        this.#classNum = 0;
    }

    #mergeClass(class1, class2)
    {
        const class1Nodes = this.#classMap.get(class1);
        const class2Nodes = this.#classMap.get(class2);

        const [fromClass, toClass] = class1Nodes.size > class2Nodes.size ? [class2, class1] : [class1, class2];

        const fromClassNodes = this.#classMap.get(fromClass);
        for(const node of fromClassNodes)
        {
            this.#classMap.get(toClass).add(node);
            this.#nodeClass.set(node, toClass);
            this.#network.colorNode(node, toClass);
        }

        this.#classMap.delete(fromClass);
    }

    #addToClass(class1, node)
    {
        this.#nodeClass.set(node, class1);
        this.#classMap.get(class1).add(node);
        this.#network.colorNode(node, class1);
    }

    #createClass(node)
    {
        this.#nodeClass.set(node, this.#classNum);
        this.#classMap.set(this.#classNum, new Set([node]));

        this.#network.colorNode(node, this.#classNum);
        this.#classNum += 1;

        return this.#classNum - 1;
    }

    next()
    {
        if(this.sortedEdges.length === 0)
            return false;

        if(this.#visited.size === this.#network.nodes.length - 1)
            return false;

        const edge = this.sortedEdges[this.#current]
        const from = edge.from;
        const to = edge.to;

        const class1 = this.#nodeClass.get(from);
        const class2 = this.#nodeClass.get(to);

        let add = false;
        
        if(class1 === undefined && class2 !== undefined)
        {
            this.#addToClass(class2, from);
            add = true;
        }
        else if(class1 !== undefined && class2 === undefined)
        {
            this.#addToClass(class1, to);
            add = true;
        }
        else if(class1 === undefined && class2 === undefined)
        {
            const newClass1 = this.#createClass(from);
            this.#addToClass(newClass1, to);
            add = true;
        }
        else if(class1 !== class2)
        {
            this.#mergeClass(class1, class2);
            add = true;
        }

        if(add === true)
            this.#visited.add(edge.id);

        this.#network.mark(edge.id, add);

        this.#current += 1;

        return true;
    }
}

export class Kruskal extends EdgeBased
{
    constructor(network)
    {
        super(network);
        this.sortedEdges = network.edges.get()
        .filter(edge => !isNaN(Number(edge.label)))
        .sort((a, b) => {
            return Number(a.label) - Number(b.label);
        });
    }
}

export class Greedy extends EdgeBased
{
    constructor(network)
    {
        super(network);
        this.sortedEdges = network.edges.get()
        .filter(edge => !isNaN(Number(edge.label)))
        .sort((a, b) => {
            return Number(b.label) - Number(a.label);
        });
    }
}
