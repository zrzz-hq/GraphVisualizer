import { VisNetwork, Nodes, Edges } from "./network.js";

export class SearchNetwork extends VisNetwork
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

    destroy() 
    {
        this.#head.replaceChildren();
        this.#body.replaceChildren();
        this.#queue.length = 0;
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

class Search
{
    constructor(network, cache, start, end)
    {
        this._network = network;
        this._cache = cache;
        this._adjacencyDict = this._network.getAdjacencyDict();
        this._visited = new Set([start]);
        this._current = start;
        this._end = end;
        this._network.mark(null, start, []);
    }

    next()
    {
        if(this._current === this._end)
            return false;

        this._cache.refresh();
        
        const neighbors = Object.keys(this._adjacencyDict[this._current]);
        const frontiers = neighbors.filter(node => !this._visited.has(node));

        const [next, toVisit] = this._nextStep(this._current, frontiers);

        this._visited.add(toVisit);
        this._current = next;
        return true;
    }
}

export class DFS extends Search
{
    #stack
    constructor(network, cache, start, end)
    {
        super(network, cache, start, end);
        this.#stack = [];
        this._cache.setHead(['Stack']);
    }
    _nextStep(current, frontiers)
    {
        let next;
        let toVisit = null;
        if (frontiers.length > 0) 
        {
            this.#stack.push(current);
            this._cache.add([this._network.nodes.getProperties(current, ['label'])['label']]);
            toVisit = frontiers[0];
            next = toVisit;
        } 
        else
        {
            next = this.#stack.pop();
            this._cache.removeLast();
        }
        
        this._network.mark(current, toVisit, frontiers);

        return [next, toVisit];
    }
}

export class BFS extends Search
{
    #queue
    constructor(network, cache, start, end)
    {
        super(network, cache, start, end);
        this.#queue = [];
        this._cache.setHead(['Queue']);
    }

    _nextStep(current, frontiers)
    {
        let next;
        let toVisit = null;
        if(frontiers.length > 0)
        {
            toVisit = frontiers[0];
            this.#queue.push(toVisit);
            this._cache.add([this._network.nodes.getProperties(toVisit, ['label'])['label']]);
            next = current;
        }
        else
        {
            next = this.#queue.shift();
            this._cache.removeFirst();
        }

        this._network.mark(current, toVisit, frontiers);

        return [next, toVisit];
    }

}

export class Dijkstras extends Search
{
    #minDistance;
    #table;
    #unvisited;
    constructor(network, cache, start, end)
    {
        super(network, cache, start, end);
        this.#minDistance = 0;
        this.#table = {};
        this.#unvisited = new Set();

        for(const [index, node] of Object.keys(this._adjacencyDict).entries())
        {
            const distance = node === start ? 0 : Infinity
            this.#table[node] = {distance, prev: null, index};
            this.#unvisited.add(node);
            this._cache.add(this.#createCacheLine(node, distance, null));
        }

        this.#unvisited.delete(start);
        this._cache.setHead(['Node', 'Distance', 'Previous']);
    }

    _nextStep(current, frontiers)
    {
        for(const frontier of frontiers)
        {
            const edge = this._adjacencyDict[current][frontier];
            const label = this._network.edges.getProperties(edge, ['label'])['label'];
            const weight = isFinite(Number(label)) ? Number(label) : Infinity;
            const distance = this.#minDistance + weight;
            if(distance < this.#table[frontier].distance)
            {
                this.#table[frontier].distance = distance;
                this.#table[frontier].prev = current;
                this._cache.update(this.#table[frontier].index, this.#createCacheLine(frontier, distance, current));
            }
        }

        let next;
        let minDistance = Infinity;

        for (const node of this.#unvisited) {
            if(this.#table[node].distance < minDistance) {
                minDistance = this.#table[node].distance;
                if(this.#table[node].prev)
                    current = this.#table[node].prev;
                next = node;
            }
        }

        next && this.#unvisited.delete(next);
        console.log(next);

        this.#minDistance = minDistance;

        this._network.mark(current, next, []);
        
        return [next, next];
    }

    #createCacheLine(node, distance, prev) 
    {
        const first = this._network.nodes.getProperties(node, ['label'])['label'];
        const second = distance === Infinity ? '∞' : distance;
        const third = prev ?? '-';

        return [first, second, third];
    }
}

