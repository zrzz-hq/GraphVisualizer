import { Greedy, Kruskal, MSTNetwork } from "./mst.js";
import { VisNetwork, Nodes, Edges } from "./network.js";
import { PropertyPanel } from "./propertyPanel.js"
import { SearchCache, SearchNetwork, DFS, BFS, Dijkstras} from "./search.js";

// Create nodes and edges

const nodes = new Nodes([]);
const edges = new Edges([]);
const visNetwork = new VisNetwork(document.getElementById('graphCanvas'), nodes, edges);
const propertyPanel = new PropertyPanel();
// const searchPanel = new bootstrap.Modal('#subNetwork');

document.getElementById('mode').addEventListener('change', (e) => {
    visNetwork.setMode(e.target.value);
});

document.getElementById('clear').addEventListener('click', () => {
    visNetwork.unselectAll();
    visNetwork.deleteAll();
});

document.getElementById('delete').addEventListener('click', (e) => {
    visNetwork.deleteSelected();
});

document.getElementById('fit').addEventListener('click', () => {
    visNetwork.fit();
});

const onEdgePropertyChange = (e) => {
    const selectedEdges = visNetwork.getSelectedEdges();
    if(selectedEdges.length == 0)
        return;

    for(const edge of selectedEdges)
    {
        edges.setProperties(edge, e.detail.properties);
    }
};

const onNodePropertyChange = (e) => {

    const selectedNodes = visNetwork.getSelectedNodes();
    if(selectedNodes.length == 0)
        return 0;
    
    console.log('node prop changed')
    for(const node of selectedNodes)
    {
        nodes.setProperties(node, e.detail.properties);
    }
    
};

const onNodeSelectionChange = (e) => {
    const properties = nodes.getProperties(
        e.detail.nodes[e.detail.nodes.length-1],
        ['label', 'shape', 'color', 'size', 'font']
    );
    propertyPanel.refreshNodeProperties(properties);
};

const onEdgeSelectionChange = (e) => {
    const properties = edges.getProperties(
        e.detail.edges[e.detail.edges.length-1],
        ['color', 'font', 'label', 'arrows']
    );
    propertyPanel.refreshEdgeProperties(properties);
};

document.getElementById('properties').addEventListener("show.bs.offcanvas", (e) =>{
    const graphCanvas = document.getElementById('graphCanvas');
    graphCanvas.addEventListener('node.select', onNodeSelectionChange);
    graphCanvas.addEventListener('node.deselect', onNodeSelectionChange);
    graphCanvas.addEventListener('edge.select', onEdgeSelectionChange);
    graphCanvas.addEventListener('edge.deselect', onEdgeSelectionChange);

    onNodeSelectionChange({detail: {nodes : visNetwork.getSelectedNodes()}});
    onEdgeSelectionChange({detail: {edges : visNetwork.getSelectedEdges()}});

    console.log("shown")

    e.target.addEventListener('edgePropertyChange', onEdgePropertyChange);
    e.target.addEventListener('nodePropertyChange', onNodePropertyChange);
});

document.getElementById('properties').addEventListener("hide.bs.offcanvas", (e) =>{
    const graphCanvas = document.getElementById('graphCanvas');
    graphCanvas.removeEventListener('node.select', onNodeSelectionChange);
    graphCanvas.removeEventListener('node.deselect', onNodeSelectionChange);
    graphCanvas.removeEventListener('edge.select', onEdgeSelectionChange);
    graphCanvas.removeEventListener('edge.deselect', onEdgeSelectionChange);

    console.log("hidden")

    e.target.removeEventListener('edgePropertyChange', onEdgePropertyChange);
    e.target.removeEventListener('nodePropertyChange', onNodePropertyChange);
});

document.getElementById('graphCanvas').addEventListener('select', (e) => {
    const nodeSelected = (e.detail.nodes.length != 0);
    const edgeSelected = (e.detail.edges.length != 0);

    const selected = nodeSelected || edgeSelected;

    document.getElementById('delete').disabled = !selected;
});

document.getElementById('open').addEventListener('click', () => {
    const loadDOT = document.createElement('input');
    loadDOT.type = 'file';
    loadDOT.id = 'loadDOT';
    loadDOT.accept = '.dot,.DOT';
    loadDOT.style.display = 'none';

    loadDOT.onchange = (e) => {
        for(const file of e.target.files)
        {
            file.arrayBuffer().then(function(arrayBuffer) {
                const dotString = new TextDecoder().decode(arrayBuffer);
                visNetwork.load(dotString)
            });
        };
    }

    loadDOT.click();
});

document.getElementById('save').addEventListener('click', () => {
    const dotString = visNetwork.dump();
    const blob = new Blob([dotString], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'graph.dot';
    link.click();
});

document.getElementById('graphType').addEventListener('change', (e) => {
    if(e.target.value == 'erdosRenyi')
        document.getElementById('probability').disabled = false;
    else
        document.getElementById('probability').disabled = true;
})

document.getElementById('generate').addEventListener('click', () => {
    const type = document.getElementById('graphType').value;
    const nNodes = Number(document.getElementById('nodeNumber').value);
    const probability = Number(document.getElementById('probability').value);

    visNetwork.generate(type, nNodes, {probability});
});


const onSearchShow = (e) => {
    const nextSearch = document.getElementById('nextSearch');
    const startSearch = document.getElementById('startSearch');
    const searchCanvas = document.getElementById('searchCanvas');

    let started = true;
    let searchNetwork;
    let searchCache;
    let search;

    const onSelect = (e) => {
        nextSearch.disabled = (e.detail.nodes.length > 2 || e.detail.nodes.length === 0);
    };

    const onStartSearch = () => {
        if(started)
        {
            searchNetwork = new SearchNetwork(searchCanvas, nodes, edges);
            searchCache = new SearchCache(document.getElementById('searchCache'));
            started = false;
        }

        searchCanvas.addEventListener('select', onSelect);
        searchNetwork.unselectAll();
    };

    const onNextSearch = () => {
        if(!started)
        {
            started = true;

            const selectedNodes = searchNetwork.getSelectedNodes();
            const algorithm = document.getElementById("searchAlgorithm").value;
            search = algorithm === 'DFS' ? new DFS(searchNetwork, searchCache, selectedNodes[0], selectedNodes[1]) :
                     algorithm === 'BFS' ? new BFS(searchNetwork, searchCache, selectedNodes[0], selectedNodes[1]) :
                     new Dijkstras(searchNetwork, searchCache, selectedNodes[0], selectedNodes[1]);
            searchCanvas.removeEventListener('select', onSelect);
        }
        else
        {
            if(!search.next())
            {
                nextSearch.disabled = true;
            }
        }
    };

    nextSearch.addEventListener('click', onNextSearch);
    startSearch.addEventListener('click', onStartSearch);
    
    const onSearchHide = (e) => {
        searchNetwork?.destroy();
        searchCache?.destroy();

        nextSearch.removeEventListener('click', onNextSearch);
        startSearch.removeEventListener('click', onStartSearch);
        document.getElementById('search').removeEventListener('hidden.bs.model', onSearchHide);
    }
    
    document.getElementById('search').addEventListener('hidden.bs.modal', onSearchHide);
}


document.getElementById('search').addEventListener('shown.bs.modal', onSearchShow);

const onMSTShow = (e) => {
    const nextMST = document.getElementById('nextMST');
    const startMST = document.getElementById('startMST');
    const mstCanvas = document.getElementById('mstCanvas');

    let started = false;
    let mstNetwork = new MSTNetwork(mstCanvas, nodes, edges);
    let mst;

    const onNextMST = () => {
        started = true;
        if(!mst.next())
            nextMST.disabled = true;
    }

    const onStartMST = () => {
        if(started) 
        {
            mstNetwork = new MSTNetwork(mstCanvas, nodes, edges);
            started = false;
        }
        mst = document.getElementById('mstAlgorithm').value === 'Greedy' ? new Greedy(mstNetwork) : new Kruskal(mstNetwork);
        mst.next();
        nextMST.disabled = false;
    }

    nextMST.addEventListener('click', onNextMST);
    startMST.addEventListener('click', onStartMST);

    const onMSTHide = () => {
        mstNetwork?.destroy();
        nextMST.removeEventListener('click', onNextMST);
        nextMST.disabled = true;
        startMST.removeEventListener('click', onStartMST);
        document.getElementById('MST').removeEventListener('hidden.bs.modal', onMSTHide);
    };

    document.getElementById('MST').addEventListener('hidden.bs.modal', onMSTHide);
};

document.getElementById('MST').addEventListener('shown.bs.modal', onMSTShow);

