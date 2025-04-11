import { Network, parseDOTNetwork } from 'https://cdn.jsdelivr.net/npm/vis-network@9.1.2/+esm';
import { DataSet } from 'https://cdn.jsdelivr.net/npm/vis-data@7.1.4/+esm';

class VisDataSet extends DataSet
{
    #defaults
    constructor(data, defaults)
    {
        super(data);
        this.#defaults = defaults;
    }

    setProperties(id, properties) 
    {
        if(!id || !properties)
            return;
        
        this.updateOnly({id, ...properties});
    }

    getProperties(id, properties)
    {
        if(!id || !properties)
            return null;

        const data = this.get(id);

        if(!data)
            return null;


        const result = {};
        for (const prop of properties) 
        {
            const value = data[prop];
            result[prop] = value ?? this.#defaults[prop];
        }

        return result;
    }
}

export class Nodes extends VisDataSet
{
    static defaults = {
        shape: 'dot',
        size: 10,
        color: {
            background: '#D2E5FF', 
            border: '#2B7CE9',
            highlight: {background:'#D2E5FF', border:'#2B7CE9'},
            hover: {background:'#D2E5FF', border:'#2B7CE9'}
        },
        font: {
            color: '#000000'
        }
    };

    constructor(data, options = {})
    {
        const newOptions = {...Nodes.defaults, ...options}
        super(data, newOptions);
        this.options = newOptions;
    }
}

export class Edges extends VisDataSet
{
    static defaults = {
        color: '#848484',
        font: {color: '#000000'}
    };
    constructor(data, options = {})
    {
        const newOptions = {...Edges.defaults, ...options}
        super(data, newOptions);
        this.options = newOptions;
    }
}

export class VisNetwork extends Network
{
    #directed;
    #options;
    #container;
    #mode;
    constructor(container, nodes, edges, options = {})
    {
        super(container, 
            {nodes, edges});
        
        this.#directed = false;
        this.#options = {
            nodes: nodes.options,
            edges: edges.options,
            ...options,
            interaction: { 
                hover: true,
                selectConnectedEdges: false,
                selectable: true,
                multiselect: true
            },
            physics: true,
            manipulation: {
                enabled: false,
        
                addNode: (data, callback) => {
                    data.label = `${this.nodes.length}`;
                    callback(data);
                    this.addNodeMode();
                },
        
                addEdge: (data, callback) => {
                    data.arrows = this.#directed ? 'to' : undefined;
                    callback(data);
                    this.addEdgeMode();
                }
            }
        }

        this.nodes = nodes;
        this.edges = edges;
        this.#container = container;
        this.#mode = 'drag';
        this.setOptions(this.#options);

        this.on('selectNode', (e) => this.#selectNodeEvent(e.nodes));
        this.on('selectEdge', (e) => this.#selectEdgeEvent(e.edges));
        this.on('deselectNode', (e) => this.#deselectNodeEvent(e.nodes, e.previousSelection.nodes));
        this.on('deselectEdge', (e) => this.#deselectEdgeEvent(e.edges, e.previousSelection.edges));
        this.on('select', (e) => this.#selectEvent(e.nodes, e.edges));
    }

    #selectNodeEvent(nodes)
    {
        const event = new CustomEvent('node.select', {detail:{nodes}});
        this.#container.dispatchEvent(event);
    }

    #selectEdgeEvent(edges)
    {
        const event = new CustomEvent('edge.select', {detail: {edges}});
        this.#container.dispatchEvent(event);
    }

    #deselectNodeEvent(nodes, prevNodes)
    {
        const event = new CustomEvent('node.deselect', {detail:{nodes, prevNodes}});
        this.#container.dispatchEvent(event);
    }

    #deselectEdgeEvent(edges, prevEdges)
    {
        const event = new CustomEvent('edge.deselect', {detail:{edges, prevEdges}});
        this.#container.dispatchEvent(event);
    }

    #selectEvent(nodes, edges)
    {
        const event = new CustomEvent('select', {detail:{nodes, edges}});
        this.#container.dispatchEvent(event);
    }

    setMode(mode)
    {
        this.#mode = mode;
        this.#setMode();
    }

    #setMode()
    {
        switch(this.#mode)
        {
            case 'drag':
                this.#options.interaction.selectable =true;
                this.setOptions(this.#options);
                this.disableEditMode();
                break;
            case 'addDEdge':
                this.#directed = true;
                this.#options.interaction.selectable =false;
                this.setOptions(this.#options);
                this.addEdgeMode();
                break;
            case 'addEdge':
                this.#directed = false;
                this.#options.interaction.selectable =false;
                this.setOptions(this.#options);
                this.addEdgeMode();
                break;
            case 'addNode':
                this.#options.interaction.selectable =false;
                this.setOptions(this.#options);
                this.addNodeMode();
                break;
            default:
                break;
        }
    }

    redraw()
    {
        super.redraw();
        this.#setMode();
    }

    load(dotString)
    {
        const graph = graphlibDot.read(dotString);

        const nodes = graph.nodes().map(nodeId => {
            const props = graph.node(nodeId) || {};
            return {
              id: nodeId,
              label: props.label || nodeId
            };
        });

        const edges = graph.edges().map(({ v, w }) => {
            const props = graph.edge(v, w) || {};
            return {
                from: v,
                to: w,
                label: props.label
            };
        });

        this.nodes.update(nodes);
        this.edges.update(edges);
        this.redraw();
    }

    dump()
    {
        const graph = new graphlib.Graph({ directed: true });

        this.nodes.forEach(node => {
            graph.setNode(node.id, {label: node.label});
        });
      
        this.edges.forEach(edge => {
            graph.setEdge(edge.from, edge.to, {label: edge.label});
        });

        const dotString = graphlibDot.write(graph);
        return dotString;
    }

    generate(type, nNodes, args)
    {
        const nodesId = [];
        let iterator = null;

        switch(type)
        {
            case 'fullyConnected':
                iterator = (i) => {
                    for(let j=0;j<i;j++)
                        this.edges.add({from: nodesId[i], to: nodesId[j]})
                }
                break;
            case 'cycle':
                iterator = (i) => {
                    if(i === nodeNumber-1)
                        this.edges.add({from: nodesId[i], to: nodesId[0]});
                    this.edges.add({from: nodesId[i], to: nodesId[i-1]});
                }
                break;
            case 'path':
                iterator = (i) => {this.edges.add({from: nodesId[i], to: nodesId[i-1]})};
                break;
            case 'erdosRenyi':
                iterator = (i) => {
                    for(let j=0;j<i;j++)
                    {
                        if(Math.random() < args.probability)
                            this.edges.add({from: nodesId[i], to: nodesId[j]});
                    }
                };
                break;
            case 'binaryTree':
                iterator = (i) => {
                    if(i !== 0)
                    {
                        parent = Math.floor((i - 1) / 2);
                        this.edges.add({from: nodesId[i], to: nodesId[parent]});
                    }
                };
                break;
            default:
                break;
        }

        for(let i=0;i<nNodes;i++)
        {
            const nodeId = crypto.randomUUID()
            this.nodes.add({id: nodeId, label: `${this.nodes.length}`});
            nodesId.push(nodeId);

            iterator(i);
        }

        this.redraw();
    }

    selectNodes(nodes)
    {
        const selectedSet = new Set(this.getSelectedNodes());

        for (const node of nodes) 
        {
            selectedSet.add(node); // Set handles uniqueness
        }

        const selectedNodes = Array.from(selectedSet);
        super.selectNodes(selectedNodes);
        this.#selectNodeEvent(selectedNodes);
        this.#selectEvent(selectedNodes, this.getSelectedEdges());
    }

    selectEdges(edges) 
    {
        const selectedSet = new Set(this.getSelectedEdges());
    
        for (const edge of edges) 
        {
            selectedSet.add(edge); // Set ensures uniqueness
        }
    
        const selectedEdges = Array.from(selectedSet);
        super.selectEdges(selectedEdges);
        this.#selectEdgeEvent(selectedEdges);
        this.#selectEvent(this.getSelectedNodes(), selectedEdges); // optional if you want both node & edge
    }

    deselectNodes(nodes)
    {
        const prevSelectedNodes = this.getSelectedNodes()
        const selectedSet = new Set(prevSelectedNodes);

        for (const node of nodes)
        {
            selectedSet.delete(node);
        }

        const selectedNodes = Array.from(selectedSet);
        super.selectNodes(selectedNodes);
        this.#deselectNodeEvent(selectedNodes, prevSelectedNodes);
        this.#selectEvent(selectedNodes, this.getSelectedEdges());
    }

    deselectEdges(edges)
    {
        const prevSelectedEdges = this.getSelectedEdges();
        const selectedSet = new Set([prevSelectedEdges]);

        for (const edge of edges)
        {
            selectedSet.delete(edge);
        }

        const selectedEdges = Array.from(selectedSet);
        super.selectEdges(selectedEdges);
        this.#deselectEdgeEvent(selectedEdges, prevSelectedEdges);
        this.#selectEdgeEvent(this.getSelectedNodes(), selectedEdges);
    }

    deleteSelected()
    {
        const selectedEdges = this.getSelectedEdges();
        const selectedNodes = this.getSelectedNodes();

        super.deleteSelected();
        selectedNodes.length > 0 && this.#deselectNodeEvent([], selectedNodes);
        selectedEdges.length > 0 && this.#deselectEdgeEvent([], selectedEdges);
        (selectedNodes.length > 0 || selectedEdges.length > 0) && this.#selectEvent([], []);
    }

    unselectAll()
    {
        this.#deselectNodeEvent([], this.getSelectedNodes());
        this.#deselectEdgeEvent([], this.getSelectedEdges());
        this.#selectEvent([], []);
        super.unselectAll();
    }

    deleteAll()
    {
        this.nodes.clear();
        this.edges.clear();
        this.redraw();
    }

    getAdjacencyDict()
    {
        const adjacencyDict = {}

        this.nodes.forEach(node => {
            adjacencyDict[node.id] = {};
        });
        
        this.edges.forEach(edge => {
            if(edge.arrows == undefined || edge.arrows === '')
            {
                adjacencyDict[edge.from][edge.to] = edge.id;
                adjacencyDict[edge.to][edge.from] = edge.id;
            }
            else if(edge.arrows.includes('to'))
            {
                adjacencyDict[edge.from][edge.to] = edge.id;
            }

        });

        return adjacencyDict;
    }
}
