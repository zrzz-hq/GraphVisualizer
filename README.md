# Graph Visualizer

## Introduction
Graph Visualizer is a web application powered by vis.js that allows users to draw graphs and visualize how different graph search algorithms work in real time.

## Layout
![UI Layout](./images/layout.png)

## Features
![Features](./images/features.png)
### Load Graph 
Loads a graph from a `.dot` file, supporting only label properties for nodes and edges. Other styling attributes are not currently supported.

Click the 

### Save Graph
Saves the current graph to a .dot file, including only label properties for nodes and edges. Styling attributes are not included in the exported file.

### Edit Modes
You can switch between four edit modes:

- **Move & Drag**: Allows you to drag individual nodes or move the entire graph.
- **Add Nodes**: Click anywhere on the canvas to add a new node.
- **Add Edges**: Click on a start node, then drag to another node to create an undirected edge.
![Add Edge](./images/addEdge.gif)
- **Add Directed Edges**: Same as "Add Edges", but the edge will have a direction (arrow) from the start node to the end node.

### Properties
Clicking this will open the Properties sidebar, where you can view and edit the attributes of the selected nodes and edges.
![Properties](./images/properties.png)

### Delete Selected
Delete selected nodes and edges.

### Delete All
Delete all elements in the graph.

### Fit Zoom
Adjusts the view to fit the entire graph within the canvas.

### Generate Graph
Clicking this will open a dialog where you can select options for graph generation, including the graph type and the number of nodes. 
![Generate](./images/generate.png)
Currently, five graph types are supported:
- **Fully Connected Graph**
- **Cycle Graph**
- **Path Graph**
- **Binary Tree**
- **Erdos Renyi Graph**

### Search Graph
Clicking this will open a dialog that allows for interactive search. Support DFS, BFS and Dijkstra's algorithm.
![Search1](./images/search1.png)
The graph will be display in the canvas.
![Search2](./images/search2.png)
Then, continue clicking `Next` until the entire search process is complete.
You can click `Start` again to start a new search.

### Find MST
Clicking this will open a dialog for interactively generating a Minimum/Maximum Spanning Tree (MST). Support Greedy and Kruskal's alogrithm.
![MST1](./images/mst1.png)
The graph will be display in the canvas.
![MST2](./images/mst2.png)
Then, continue clicking `Next` until the whole process is complete.
You can click `Start` again to restart.



