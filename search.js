import { VisNetwork, Nodes, Edges } from "./network.js";

export class SubNetwork extends VisNetwork
{
    #edgeHistories
    #visited
    #last
    constructor(container, nodes, edges)
    {
        const options = {
            groups:{
                useDefaultGroups: true,
                visited:{
                    color: {
                        background: '#A8E6A1', 
                        border: '#2E8B57',
                        highlight: {background:'#A8E6A1', border:'#2E8B57'},
                        hover: {background:'#A8E6A1', border:'#2E8B57'}
                    }
                },
                current:{
                    color: {
                        background: '#F6B8B8', 
                        border: '#B22222',
                        highlight: {background:'#F6B8B8', border:'#B22222'},
                        hover: {background:'#F6B8B8', border:'#B22222'}
                    }
                },
                toVisit:{
                    color: {
                        background: '#FFE0B2', 
                        border: '#FB8C00',
                        highlight: {background:'#FFE0B2', border:'#FB8C00'},
                        hover: {background:'#FFE0B2', border:'#FB8C00'}
                    }
                }
            }
        }
        const _nodes = new Nodes(structuredClone(nodes.get()));
        const _edges = new Edges(structuredClone(edges.get()));
        super(container, _nodes, _edges, options);

        this.#edgeHistories = []
        this.#visited = {}
        this.#last = {}
        this.adjacencyDict = this.getAdjacencyDict();

        this.fit();
    }

    mark(current, toVisit, frontiers)
    {
        this.#visited.id && this.nodes.updateOnly(this.#visited);
        this.#last.id && this.nodes.updateOnly(this.#last);

        this.edges.updateOnly(this.#edgeHistories);
        this.#edgeHistories.length = 0;

        toVisit && this.nodes.updateOnly({id: toVisit, group: 'toVisit'});
        this.#visited = {id: toVisit, group: 'visited'};

        if(!current)
            return;

        const group = this.nodes.getProperties(current, ['group'])['group'];
        this.#last = {id: current, group};

        current && this.nodes.updateOnly({id: current, color: undefined, group: 'current'});
    
        toVisit && this.edges.updateOnly({
            id: this.adjacencyDict[current][toVisit], 
            color: '#2E8B57'
        })

        for(const frontier of frontiers)
        {
            const edge = this.adjacencyDict[current][frontier];
            const color = this.edges.getProperties(edge, ['color'])['color'];

            this.#edgeHistories.push({id: edge, color});
            const newColor = frontier === toVisit ? '#FB8C00' : '#B22222';
            
            this.edges.updateOnly({id: edge, color: newColor});
        }
    }
}

export class SearchCache
{
    #container
    #head
    #body
    #queue
    constructor(container)
    {
        this.#container = container;
        this.#head = this.#container.querySelector('thead');
        this.#body = this.#container.querySelector('tbody');
        this.#head.replaceChildren();
        this.#body.replaceChildren();
        this.#queue = [];
    }

    setHead(head)
    {
        const row = document.createElement('tr');
        for (const title of head) 
        {
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = title;
            row.appendChild(th);
        }
        this.#head.replaceChildren(row);
    }

    refresh()
    {
        while(this.#queue.length > 0)
        {
            const op = this.#queue.shift();
            op();
        }
    }

    add(line) 
    {
        this.#queue.push(() => {
            const tr = document.createElement('tr');
    
            for (const text of line) {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            }
    
            this.#body.appendChild(tr);
        });
    }

    update(i, line) 
    {
        this.#queue.push(() => {
            const oldRow = this.#body.children[i];
            if (!oldRow) return;
    
            const tr = document.createElement('tr');
    
            for (const text of line) {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            }
    
            this.#body.replaceChild(tr, oldRow);
        });
    }    

    removeFirst() 
    {
        this.#queue.push(() => this.#body.firstElementChild?.remove());
    }
    
    removeLast() 
    {
        this.#queue.push(() => this.#body.lastElementChild?.remove());
    }
}

export class Search
{
    constructor(network, cache, start, end)
    {
        this.network = network;
        this.cache = cache;
        this.network.mark(null, start, []);

        this.end = end;
        this.current = start;
        this.visited = new Set([start]);
        this.adjacencyDict = this.network.getAdjacencyDict();
    }

    next()
    {
        if(this.current === this.end)
            return;

        this.cache.refresh();
        
        const [next, toVisit, frontiers] = this.nextStep(this.current);
        this.visited.add(toVisit);
        this.network.mark(this.current, toVisit, frontiers);
        this.current = next;
    }
}

export class DFS extends Search
{
    #stack

    constructor(nextwork, cache, start, end)
    {
        super(nextwork, cache, start, end);
        this.cache.setHead(['Stack']);
        this.#stack = [];
    }

    nextStep(current)
    {
        const neighbors = Object.keys(this.adjacencyDict[current]);
        const frontiers = neighbors.filter(node => !this.visited.has(node));

        let next;
        let toVisit = null;
        if (frontiers.length > 0) 
        {
            this.#stack.push(current);
            this.cache.add([this.network.nodes.getProperties(current, ['label'])['label']]);
            toVisit = frontiers[0];
            next = toVisit;
        } 
        else
        {
            next = this.#stack.pop();
            this.cache.removeLast();
        }
        
        return [next, toVisit, frontiers];
    }

}

export class BFS extends Search
{
    #queue
    constructor(nextwork, cache, start, end)
    {
        super(nextwork, cache, start, end);
        this.cache.setHead(['Queue']);
        this.#queue = [];
    }

    nextStep(current)
    {
        const neighbors = Object.keys(this.adjacencyDict[current]);
        const frontiers = neighbors.filter(node => !this.visited.has(node));

        let next;
        let toVisit = null;
        if(frontiers.length > 0)
        {
            toVisit = frontiers[0];
            this.#queue.push(toVisit);
            this.cache.add([this.network.nodes.getProperties(toVisit, ['label'])['label']]);
            next = current;
        }
        else
        {
            next = this.#queue.shift();
            this.cache.removeFirst();
        }

        return [next, toVisit, frontiers];
    }
}

export class Dijkstras extends Search
{
    #table
    #minDistance
    #map
    constructor(network, cache, start, end)
    {
        super(network, cache, start, end);
        this.cache.setHead(['node', 'distance', 'previous']);
        this.#table = {};
        for(const [index, node] of Object.keys(this.adjacencyDict).entries())
        {
            const distance = index === 0 ? 0 : Infinity
            this.#table[node] = {distance, prev: null, index};
            this.cache.add(this.#createCacheLine(node, distance, null));
        }

        this.#minDistance = 0;
    }

    #createCacheLine(node, distance, prev) 
    {
        const first = this.network.nodes.getProperties(node, ['label'])['label'];
        const second = distance === Infinity ? '∞' : distance;
        const third = prev ?? '-';

        return [first, second, third];
    }

    nextStep(current)
    {
        const neighbors = Object.keys(this.adjacencyDict[current]);
        const frontiers = neighbors.filter(node => !this.visited.has(node));

        for(const frontier of frontiers)
        {
            const edge = this.adjacencyDict[current][frontier];
            const label = this.network.edges.getProperties(edge, ['label'])['label'];
            const weight = isFinite(Number(label)) ? Number(label) : Infinity;
            const distance = this.#minDistance + weight;
            if(distance < this.#table[frontier].distance)
            {
                this.#table[frontier].distance = distance;
                this.#table[frontier].prev = current;
                this.cache.update(this.#table[frontier].index, this.#createCacheLine(frontier, distance, current));
            }
        }

        let next;
        let minDistance = Infinity;

        for (const node of frontiers) {
            if(this.#table[node].distance < minDistance) {
                minDistance = this.#table[node].distance;
                next = node;
            }
        }

        this.#minDistance = minDistance;

        return [next, next, frontiers];
    }
}