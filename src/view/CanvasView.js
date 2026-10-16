/**
 * SVG canvas of the workflow editor, based on JointJS.
 *
 * Responsibility
 * --------------
 * ``CanvasView`` owns the JointJS graph and paper showing the edited workflow: blocks (nested containers
 * become nested elements), external slot terminals and data links. It replaces the former HTML/flexbox
 * rendering (``Block.getBlockHtml``), which remains available with the ``?view=legacy`` URL parameter.
 *
 * Model -> view sync
 * ------------------
 * The editor model (``WorkflowEditor.workflowblock`` and ``WorkflowEditor.datalinks``) is the single source of
 * truth. Every modification of the model is followed by ``WorkflowEditor.generateWorkflowHtml()``, which calls
 * ``render()``: the canvas cells are rebuilt from the model in one ``graph.resetCells`` call. The geometry is
 * computed by ``computeCanvasLayout`` (AutoLayout.js), which also places blocks that have no position yet.
 *
 * Cell ids are derived from session-stable identifiers (see Shapes.js); ``getModelOfCell`` maps a cell back to
 * the model object it represents.
 *
 * JointJS features used
 * ---------------------
 * ``dia.Graph`` / ``dia.Paper`` (embedding of child elements via the ``parent``/``embeds`` attributes,
 * ``fitToContent`` for the scrollable drawing area).
 */
class CanvasView{
    /**
     * @param {WorkflowEditor} editor - the edited project
     * @param {HTMLElement} el - element hosting the paper (inside the scrollable #workflowContainer)
     */
    constructor(editor, el){
        this.editor = editor;
        this.el = el;
        /** Model object (Block, SlotExt or Datalink) for every cell id. @type {Map<string, Object>} */
        this.cell_models = new Map();

        this.graph = new joint.dia.Graph({}, {cellNamespace: joint.shapes});
        this.paper = new joint.dia.Paper({
            el: el,
            model: this.graph,
            cellViewNamespace: joint.shapes,
            width: 800,
            height: 600,
            gridSize: SHAPE_GEOMETRY.GRID,
            drawGrid: {name: 'dot', args: {color: '#c9ced6'}},
            background: {color: '#f7f8fa'},
            async: false,
            sorting: joint.dia.Paper.sorting.APPROX,
            interactive: false,
            defaultConnectionPoint: {name: 'anchor'}
        });
    }

    /**
     * @param {Block} block
     * @returns {string} id of the cell of the block
     */
    blockCellId(block){
        return 'block-' + block.view_id;
    }

    /**
     * @param {Slot} slot
     * @returns {string} id of the cell owning the port of the slot (a block or an external slot terminal)
     */
    slotCellId(slot){
        if(slot.external)
            return 'ext-' + slot.getUID();
        return this.blockCellId(slot.getParentBlock());
    }

    /**
     * @param {Datalink} datalink
     * @returns {string} id of the link cell of the data link
     */
    datalinkCellId(datalink){
        return 'link-' + datalink.id;
    }

    /**
     * @param {joint.dia.Cell|string} cell - cell or cell id
     * @returns {Block|SlotExt|Datalink|null} the model object represented by the cell
     */
    getModelOfCell(cell){
        let id = typeof cell === 'string' ? cell : cell.id;
        return this.cell_models.get(id) || null;
    }

    /**
     * Rebuild all canvas cells from the model.
     */
    render(){
        let workflow = this.editor.workflowblock;
        workflow.generateAllElementCodeNames();
        let layout = computeCanvasLayout(workflow, measureBlock, measureExtSlot);

        let cells = [];
        this.cell_models = new Map();

        // blocks; nested blocks are embedded in their container and stacked above it
        let add_block = (block, parent_cell, depth) => {
            let cell = createBlockCell(block, layout.blocks.get(block), this.blockCellId(block), 10 * (depth + 1));
            if(parent_cell !== null){
                cell.set('parent', parent_cell.id);
                parent_cell.set('embeds', (parent_cell.get('embeds') || []).concat([cell.id]));
            }
            cells.push(cell);
            this.cell_models.set(cell.id, block);
            block.blocks.forEach(child => add_block(child, cell, depth + 1));
        };
        workflow.blocks.forEach(block => add_block(block, null, 0));

        layout.extSlots.forEach((box, slot) => {
            let cell = createExtSlotCell(slot, box, this.slotCellId(slot));
            cells.push(cell);
            this.cell_models.set(cell.id, slot);
        });

        this.editor.datalinks.forEach(dl => {
            let cell = createDataLinkCell(dl, this.datalinkCellId(dl), slot => this.slotCellId(slot));
            if(cell !== null){
                cells.push(cell);
                this.cell_models.set(cell.id, dl);
            }
        });

        this.graph.resetCells(cells);
        this.fitPaper();
    }

    /**
     * Resize the paper to its content (with a margin), but at least to the visible area of the container.
     */
    fitPaper(){
        let host = this.el.parentElement;
        this.paper.fitToContent({
            padding: 60,
            allowNewOrigin: 'any',
            minWidth: host ? host.clientWidth : 0,
            minHeight: host ? host.clientHeight : 0
        });
    }
}
