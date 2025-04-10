export class PropertyPanel extends bootstrap.Offcanvas
{
    #nodePropertyPanel;
    #edgePropertyPanel;
    constructor()
    {
        super('#properties');
        this.#nodePropertyPanel = new bootstrap.Collapse('#nodeProperties');
        this.#edgePropertyPanel = new bootstrap.Collapse('#edgeProperties');

        document.getElementById('nodeProperties').addEventListener('change', (e) => {
            const properties = {}

            switch (e.target.id) 
            {
                case 'nodeShape':
                    properties['shape'] = e.target.value;
                    break;
                case 'nodeLabel':
                    properties['label'] = e.target.value === '' ? undefined : e.target.value; 
                    break;
                case 'nodeBackgroundColor':
                    const background = e.target.value;
                    properties['color'] = {
                        background,
                        highlight: {background},
                        hover: {background}
                    }
                    break;
                case 'nodeBorderColor':
                    const border = e.target.value;
                    properties['color'] = {
                        border,
                        highlight: {border},
                        hover: {border}
                    }
                    break;
                case 'nodeSize':
                    properties['size'] = Number(e.target.value);
                    break;
                case 'nodeFontColor':
                    properties['font'] = {color : e.target.value};
                    break;
                default:
                    return;
            }

            const event = new CustomEvent('nodePropertyChange', {detail: {properties}})
            document.getElementById('properties').dispatchEvent(event);
        });

        document.getElementById('edgeProperties').addEventListener('change', (e) => {
            const properties = {}

            switch (e.target.id)
            {
                case 'edgeLabel':
                    properties['label'] = e.target.value == '' ? '\0' : e.target.value;
                    break;
                case 'edgeColor':
                    properties['color'] = e.target.value;
                    break;
                case 'edgeFontColor':
                    properties['font'] = {color: e.target.value};
                    break;
                case 'directedEdge':
                    properties['arrows'] = e.target.checked ? 'to' : '';
                    break;
                default:
                    return;
            }

            const event = new CustomEvent('edgePropertyChange', {detail: {properties}})
            document.getElementById('properties').dispatchEvent(event);
        });

        const disableSize = new Set(['ellipse', 'circle', 'database', 'box', 'text']);

        document.getElementById('nodeShape').addEventListener('change', (e) => {
            document.getElementById('nodeSize').disabled = disableSize.has(e.target.value);
        })
    }

    refreshNodeProperties(properties)
    {
        if(!properties)
        {
            this.disableNodeProperties(true);
            return;
        }
        else
        {
            this.disableNodeProperties(false);
        }

        document.getElementById('nodeBackgroundColor').value = properties.color.background;
        document.getElementById('nodeBorderColor').value = properties.color.border;
        document.getElementById('nodeSize').value = properties.size;
        document.getElementById('nodeShape').value = properties.shape;
        document.getElementById('nodeLabel').value = properties.label ?? '';
        document.getElementById('nodeFontColor').value = properties.font.color;
    }
    
    refreshEdgeProperties(properties)
    {
        if(!properties)
        {
            this.disableEdgeProperties(true);
            return;
        }
        else
        {
            this.disableEdgeProperties(false);
        }

        document.getElementById('edgeColor').value = properties.color;
        document.getElementById('edgeLabel').value = properties.label ?? '';
        document.getElementById('edgeFontColor').value = properties.font.color;
        document.getElementById('directedEdge').checked = properties.arrows?.includes('to') ?? false;
    }

    disableNodeProperties(disabled)
    {
        if(!disabled)
            this.#nodePropertyPanel.show();
        else
            this.#nodePropertyPanel.hide();

        document.getElementById('nodePropertiesTrigger').disabled = disabled;
    }

    disableEdgeProperties(disabled)
    {
        if(!disabled)
            this.#edgePropertyPanel.show();
        else
            this.#edgePropertyPanel.hide();

        document.getElementById('edgePropertiesTrigger').disabled = disabled;
    }
}