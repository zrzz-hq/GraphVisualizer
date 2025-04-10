import { VisNetwork, Nodes, Edges } from "./network.js";
import { PropertyPanel } from "./propertyPanel.js"
import { SubNetwork, SearchCache, BFS, DFS, Dijkstras } from "./search.js";

// Create nodes and edges

const nodes = new Nodes([]);
const edges = new Edges([]);
const visNetwork = new VisNetwork(document.getElementById('graphCanvas'), nodes, edges);
const propertyPanel = new PropertyPanel();
const searchPanel = new bootstrap.Modal('#subNetwork');

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
    document.getElementById('searchGraph').disabled = (e.detail.nodes.length > 2 || e.detail.nodes.length === 0);
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

const subCanvas = document.getElementById('subNetwork');
const nextSearch = document.getElementById('nextSearch');

const onSearchShow = (e) => {
    const subNetwork = new SubNetwork(subCanvas, nodes, edges);
    const searchCache = new SearchCache(document.getElementById('searchCache'));
    const algorithm = document.getElementById("searchAlgorithm").value;
    const selectedNodes = visNetwork.getSelectedNodes();
    const search =  algorithm === 'DFS' ? new DFS(subNetwork, searchCache, selectedNodes[0], selectedNodes[1]) :
                    algorithm === 'BFS' ? new BFS(subNetwork, searchCache, selectedNodes[0], selectedNodes[1]) :
                    algorithm === 'Dijkstra' ? new Dijkstras(subNetwork, searchCache, selectedNodes[0], selectedNodes[1]) :
                    null;

    const onNextSearch = () => search.next();
    const onSearchDone = () => nextSearch.innerHTML = 'Done';
    const onTreeDone = () => nextSearch.disabled = true;

    nextSearch.addEventListener('click', onNextSearch);
    subCanvas.addEventListener('searchDone', onSearchDone);
    subCanvas.addEventListener('treeDone', onTreeDone);
    

    const onSearchHide = (e) => {
        nextSearch.removeEventListener('click', onNextSearch);
        subCanvas.removeEventListener('searchDone', onSearchDone);
        subCanvas.removeEventListener('treeDone', onTreeDone);
        nextSearch.disabled = false;
        nextSearch.innerHTML = 'Next';
        document.getElementById('search').removeEventListener('hidden.bs.model', onSearchHide);
        subNetwork.destroy();
    }
    
    document.getElementById('search').addEventListener('hidden.bs.modal', onSearchHide);
}


document.getElementById('search').addEventListener('shown.bs.modal', onSearchShow);

