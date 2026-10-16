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
 * View -> model sync
 * ------------------
 * When the user drops a dragged element, ``commitMove`` writes its new position (relative to its container) to
 * the model. With JointJS' embedding mode, the dragged block is detached from its container during the drag and
 * attached to the container under the mouse pointer on drop; when that container differs from the original
 * one, the block is moved to it in the model as well (appended as its last child, i.e., executed last).
 * The canvas is then rebuilt from the model, which also grows containers around their (new) children.
 *
 * JointJS features used
 * ---------------------
 * ``dia.Graph`` / ``dia.Paper`` (embedding of child elements via the ``parent``/``embeds`` attributes and the
 * paper's ``embeddingMode`` with ``validateEmbedding``, ``fitToContent`` for the scrollable drawing area),
 * paper pointer events.
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

        /** State of the element being dragged (see ``onPointerDown``), or null. @type {Object|null} */
        this.drag = null;

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
            interactive: {elementMove: true, linkMove: false, labelMove: false, addLinkFromMagnet: false},
            defaultConnectionPoint: {name: 'anchor'},
            // nesting by drag and drop: a dropped block is embedded in the container under the pointer
            embeddingMode: true,
            frontParentOnly: false,
            findParentBy: 'pointer',
            validateEmbedding: (child_view, parent_view) => this.canEmbed(child_view.model, parent_view.model)
        });

        this.paper.on('element:pointerdown', (view, evt, x, y) => this.onPointerDown(view));
        this.paper.on('element:pointerup', (view, evt, x, y) => this.onPointerUp(view));
    }

    /**
     * Embedding rule: only blocks can be nested, and only in container blocks.
     *
     * @param {joint.dia.Element} child_cell
     * @param {joint.dia.Element} parent_cell
     * @returns {boolean} true when the child cell may be dropped into the parent cell
     */
    canEmbed(child_cell, parent_cell){
        let child = this.getModelOfCell(child_cell);
        let parent = this.getModelOfCell(parent_cell);
        return child instanceof Block && parent instanceof Block && parent.isContainer();
    }

    /**
     * Remember the position and container of an element before it is dragged.
     *
     * @param {joint.dia.ElementView} view
     */
    onPointerDown(view){
        let cell = view.model;
        this.drag = {id: cell.id, position: cell.position(), parent: cell.get('parent') || null};
    }

    /**
     * Commit the move of an element when the user drops it (clicks without movement are ignored).
     *
     * @param {joint.dia.ElementView} view
     */
    onPointerUp(view){
        let drag = this.drag;
        this.drag = null;
        let cell = view.model;
        if(drag === null || drag.id !== cell.id)
            return;
        let p = cell.position();
        if(p.x === drag.position.x && p.y === drag.position.y && (cell.get('parent') || null) === drag.parent)
            return;
        this.commitMove(cell);
    }

    /**
     * Write the position (and the container) of a dropped element to the model and rebuild the canvas.
     *
     * @param {joint.dia.Element} cell - block or external slot terminal
     */
    commitMove(cell){
        let model = this.getModelOfCell(cell);
        let p = cell.position();
        if(model instanceof SlotExt){
            model.setLayout({x: p.x, y: p.y});
        }else if(model instanceof Block){
            let parent_cell = cell.getParentCell();
            let new_parent = parent_cell ? this.getModelOfCell(parent_cell) : this.editor.workflowblock;
            if(new_parent !== model.getParentBlock())
                model.moveToContainer(new_parent);
            // layouts are relative to the container (see BlockLayout)
            let origin = parent_cell ? parent_cell.position() : {x: 0, y: 0};
            let layout = Object.assign({}, model.getLayout() || {}, {x: p.x - origin.x, y: p.y - origin.y});
            model.setLayout(layout);
        }
        this.editor.generateWorkflowHtml();
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
