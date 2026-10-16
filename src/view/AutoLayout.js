/**
 * Automatic placement and sizing of blocks on the editor canvas.
 *
 * Responsibility
 * --------------
 * The project model stores an optional position for every block (``Block.layout``, relative to the parent
 * container) and for every external workflow slot (``SlotExt.layout``). Projects created by older versions of
 * the editor have no positions at all, and newly added blocks are not placed yet. ``computeCanvasLayout``
 *
 * 1. places every unplaced element:
 *    - when no element of the workflow has a position yet (e.g., a project saved by an older version of the
 *      editor), the children of every container are arranged in columns following the data flow: producers
 *      left of their consumers (see ``dataflowRanks`` in ExecutionOrder.js), each column ordered by execution;
 *    - otherwise unplaced children (e.g., newly added blocks) continue the arrangement after the placed ones,
 *      stacked vertically or horizontally according to ``Block.child_block_sort`` ('dataflow' appends a new
 *      column);
 *    - external inputs form a column left of the blocks and external outputs a column right of them;
 * 2. sizes every container so that it encloses its children (never smaller than its natural size given by
 *    its header, parameters and slots, nor than a size stored in its layout);
 * 3. returns the absolute canvas boxes of all elements, which the view uses to create the canvas cells.
 *
 * Model -> view sync
 * ------------------
 * The model is the source of truth: the view calls ``computeCanvasLayout`` before every (re)render. The
 * function writes the positions it assigns, and the sizes of containers, back to the model, so they are
 * saved with the project and stay stable. The geometry of individual blocks (their natural size) is
 * provided by the caller through ``measureBlock``, so this module does not depend on JointJS or on the DOM
 * and can be tested headless.
 */

/** Gap between automatically placed sibling blocks. @type {number} */
const LAYOUT_GAP = 30;
/** Horizontal gap between the columns of the data flow arrangement (leaves room for data links). @type {number} */
const LAYOUT_COLUMN_GAP = 70;
/** Inner padding between a container's border (or header) and its children. @type {number} */
const LAYOUT_PADDING = 20;
/** Horizontal gap between the columns of external slots and the top-level blocks. @type {number} */
const LAYOUT_EXT_GAP = 80;
/** Vertical gap between automatically placed external slot terminals. @type {number} */
const LAYOUT_EXT_ROW_GAP = 12;

/**
 * Natural geometry of a block, i.e., the size needed to show its header, parameters and slots.
 *
 * @typedef {Object} BlockMetrics
 * @property {number} w - natural width
 * @property {number} h - natural height (for a container: height of the empty container)
 * @property {number} contentTop - distance from the top edge of the block to the area where children start
 *           (for a container the height of its header zone; for other blocks equal to ``h``)
 */

/**
 * Absolute box of an element on the canvas.
 *
 * @typedef {Object} CanvasBox
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * Result of {@link computeCanvasLayout}.
 *
 * @typedef {Object} CanvasLayout
 * @property {Map<Block, CanvasBox>} blocks - absolute boxes of all blocks except the workflow
 * @property {Map<Block, BlockMetrics>} metrics - natural metrics of all blocks except the workflow
 * @property {Map<SlotExt, CanvasBox>} extSlots - absolute boxes of the external slot terminals
 */

/**
 * Bounding box of the given child blocks in the coordinates of their parent.
 *
 * @param {Block[]} children - placed children (``layout`` is not null)
 * @param {Map<Block, {w: number, h: number}>} sizes - sizes of the children
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null} null for no children
 */
function childrenExtent(children, sizes){
    if(children.length === 0)
        return null;
    let ext = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};
    children.forEach(c => {
        let s = sizes.get(c);
        ext.minX = Math.min(ext.minX, c.layout.x);
        ext.minY = Math.min(ext.minY, c.layout.y);
        ext.maxX = Math.max(ext.maxX, c.layout.x + s.w);
        ext.maxY = Math.max(ext.maxY, c.layout.y + s.h);
    });
    return ext;
}

/**
 * Arrange all children of a container in columns following the data flow: the column of a child is its data
 * flow rank (producers are left of their consumers); within a column the children are stacked in execution
 * order.
 *
 * @param {Block} container
 * @param {{x: number, y: number}} origin - top-left corner of the content area, relative to the container
 * @param {Map<Block, {w: number, h: number}>} sizes - sizes of the children
 */
function placeChildrenByDataflow(container, origin, sizes){
    let children = container.blocks;
    let ranks = dataflowRanks(container, container.editor);
    let x = origin.x;
    for(let rank = 0; rank <= Math.max(...ranks); rank++){
        let column = children.filter((c, i) => ranks[i] === rank);
        let y = origin.y;
        let width = 0;
        column.forEach(c => {
            let s = sizes.get(c);
            c.layout = {x: x, y: y};
            y += s.h + LAYOUT_GAP;
            width = Math.max(width, s.w);
        });
        if(column.length)
            x += width + LAYOUT_COLUMN_GAP;
    }
}

/**
 * Place the unplaced children of a container. With ``normalize``, it also makes sure that no child lies
 * above or left of the content origin (e.g., because the container's header became taller); in that case
 * all children are shifted together, which preserves their arrangement.
 *
 * @param {Block} container
 * @param {{x: number, y: number}} origin - top-left corner of the content area, relative to the container
 * @param {Map<Block, {w: number, h: number}>} sizes - sizes of the children (already computed)
 * @param {boolean} [normalize=true] - shift children lying outside of the content area into it
 * @param {boolean} [initial=false] - true when the whole workflow is being laid out for the first time; all
 *        children are then arranged by the data flow
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null} extent of all children
 */
function placeChildren(container, origin, sizes, normalize=true, initial=false){
    let children = container.blocks;
    // all children unplaced: the whole content is arranged, by the data flow on the first layout of a project
    // or when requested by the container's arrangement (see Block.arrangeChildren)
    if((initial || container.child_block_sort === 'dataflow') && children.length > 0 && children.every(c => c.layout === null))
        placeChildrenByDataflow(container, origin, sizes);
    let placed = children.filter(c => c.layout !== null);

    let ext = childrenExtent(placed, sizes);
    if(normalize && ext !== null && (ext.minX < origin.x || ext.minY < origin.y)){
        let dx = Math.max(0, origin.x - ext.minX);
        let dy = Math.max(0, origin.y - ext.minY);
        placed.forEach(c => { c.layout.x += dx; c.layout.y += dy; });
        ext = childrenExtent(placed, sizes);
    }

    // unplaced children continue the flow after the placed ones ('dataflow' appends a new column)
    let vertical = container.child_block_sort === 'vertical';
    let cursor;
    if(vertical)
        cursor = {x: origin.x, y: ext === null ? origin.y : ext.maxY + LAYOUT_GAP};
    else
        cursor = {x: ext === null ? origin.x : ext.maxX + LAYOUT_GAP, y: origin.y};
    children.forEach(c => {
        if(c.layout !== null)
            return;
        let s = sizes.get(c);
        c.layout = {x: cursor.x, y: cursor.y};
        if(vertical)
            cursor.y += s.h + LAYOUT_GAP;
        else
            cursor.x += s.w + LAYOUT_GAP;
    });
    return childrenExtent(children, sizes);
}

/**
 * Compute the size of a block (recursively laying out the content of containers).
 *
 * @param {Block} block
 * @param {function(Block): BlockMetrics} measureBlock
 * @param {Map<Block, {w: number, h: number}>} sizes - output: sizes of all processed blocks
 * @param {Map<Block, BlockMetrics>} metrics - output: natural metrics of all processed blocks
 * @param {boolean} initial - the workflow is laid out for the first time (see ``placeChildren``)
 * @returns {{w: number, h: number}} size of the block
 */
function sizeBlock(block, measureBlock, sizes, metrics, initial){
    let m = measureBlock(block);
    metrics.set(block, m);
    let size = {w: m.w, h: m.h};
    if(block.isContainer() && block.blocks.length > 0){
        block.blocks.forEach(c => sizeBlock(c, measureBlock, sizes, metrics, initial));
        let ext = placeChildren(block, {x: LAYOUT_PADDING, y: m.contentTop + LAYOUT_PADDING}, sizes, true, initial);
        size.w = Math.max(size.w, ext.maxX + LAYOUT_PADDING);
        size.h = Math.max(size.h, ext.maxY + LAYOUT_PADDING);
    }
    if(block.isContainer() && block.layout !== null){
        // a size stored in the layout (e.g., a container enlarged by the user) is kept
        size.w = Math.max(size.w, block.layout.w || 0);
        size.h = Math.max(size.h, block.layout.h || 0);
    }
    sizes.set(block, size);
    return size;
}

/**
 * Place the external slot terminals of one direction in a column.
 *
 * @param {SlotExt[]} slots
 * @param {number} x - x coordinate of the column (for unplaced slots)
 * @param {function(SlotExt): {w: number, h: number}} measureExtSlot
 * @param {Map<SlotExt, CanvasBox>} boxes - output
 */
function placeExtSlotColumn(slots, x, measureExtSlot, boxes){
    let y = 0;
    slots.forEach(s => {
        if(s.layout !== null)
            y = Math.max(y, s.layout.y + measureExtSlot(s).h + LAYOUT_EXT_ROW_GAP);
    });
    slots.forEach(s => {
        let size = measureExtSlot(s);
        if(s.layout === null){
            s.layout = {x: x, y: y};
            y += size.h + LAYOUT_EXT_ROW_GAP;
        }
        boxes.set(s, {x: s.layout.x, y: s.layout.y, w: size.w, h: size.h});
    });
}

/**
 * Lay out the whole workflow: place unplaced blocks and external slots, size containers and compute the
 * absolute canvas boxes. Positions and container sizes are written back to the model (``layout``).
 *
 * The workflow block itself is the canvas; its children are positioned relative to the canvas origin.
 *
 * @param {BlockWorkflow} workflow
 * @param {function(Block): BlockMetrics} measureBlock - natural metrics of a block
 * @param {function(SlotExt): {w: number, h: number}} measureExtSlot - size of an external slot terminal
 * @returns {CanvasLayout}
 */
function computeCanvasLayout(workflow, measureBlock, measureExtSlot){
    let sizes = new Map();
    let metrics = new Map();
    let initial = workflow.getBlocksRecursive().every(b => b.layout === null) &&
        workflow.getSlots().every(s => s.layout === null);
    workflow.blocks.forEach(c => sizeBlock(c, measureBlock, sizes, metrics, initial));

    // external inputs of the workflow are stored as its output slots (see Block.addExternalDataSlot)
    let ext_inputs = workflow.getSlots('out');
    let ext_outputs = workflow.getSlots('in');
    let inputs_width = 0;
    ext_inputs.forEach(s => { inputs_width = Math.max(inputs_width, measureExtSlot(s).w); });
    let origin_x = ext_inputs.length ? inputs_width + LAYOUT_EXT_GAP : 0;

    // the canvas is unbounded, so top-level blocks are never shifted (normalize = false)
    let ext = placeChildren(workflow, {x: origin_x, y: 0}, sizes, false, initial);
    let ext_slots = new Map();
    placeExtSlotColumn(ext_inputs, 0, measureExtSlot, ext_slots);
    placeExtSlotColumn(ext_outputs, (ext === null ? origin_x : ext.maxX) + LAYOUT_EXT_GAP, measureExtSlot, ext_slots);

    // absolute boxes; containers remember their size so that it is saved with the project
    let boxes = new Map();
    let visit = (block, ox, oy) => {
        let s = sizes.get(block);
        let box = {x: ox + block.layout.x, y: oy + block.layout.y, w: s.w, h: s.h};
        boxes.set(block, box);
        if(block.isContainer())
            block.layout = {x: block.layout.x, y: block.layout.y, w: s.w, h: s.h};
        block.blocks.forEach(c => visit(c, box.x, box.y));
    };
    workflow.blocks.forEach(c => visit(c, 0, 0));

    return {blocks: boxes, metrics: metrics, extSlots: ext_slots};
}
