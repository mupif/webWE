/**
 * Execution flow overlay of the workflow canvas.
 *
 * Responsibility
 * --------------
 * The execution order of the workflow is shown by
 *
 * - the hierarchical execution labels on the badges of executable blocks (see Shapes.js), and
 * - thick, semi-transparent *flow arrows* drawn behind the blocks and data links: within every container (and
 *   at the top level) a straight arrow leads from each executable block to the next one (between their
 *   nearest sides); loops (Timeloop, DoWhile) additionally get a dashed *loop-back* arrow from the bottom of
 *   their last executable child, below all children, into the bottom of the first one.
 *
 * It also marks order problems found by ``findOrderViolations`` (ExecutionOrder.js): the offending data link
 * is drawn dashed in red (error) or orange (warning, a read of the previous iteration inside a loop) and the
 * badge of the consumer shows the same color, with the explanation as its tooltip.
 *
 * Model -> view sync
 * ------------------
 * The flow arrows are created from the model together with the other cells in ``CanvasView.render``
 * (``createFlowCells``). They connect the cells of the blocks, so JointJS keeps them attached while blocks are
 * dragged. An arrow inside a container is embedded in it and stacked above the container's body but below its
 * children (``z``), so it moves with the container and is never hidden by it. Data links stay on top.
 *
 * JointJS features used
 * ---------------------
 * ``dia.Link.define`` with JSON markup and a marker, ``midSide``/``bottom`` anchors, ``boundary`` connection
 * points, the ``normal`` and ``rounded`` connectors and link vertices.
 */

/** Width of the flow arrows. @type {number} */
const FLOW_ARROW_WIDTH = 10;
/** Distance of the loop-back arrow below the lowest child of the loop. @type {number} */
const FLOW_LOOP_OFFSET = 14;
/** Colors of order problems on data links and badges. */
const ORDER_ERROR_COLOR = '#e03131';
const ORDER_WARNING_COLOR = '#f08c00';

if(typeof joint !== 'undefined'){
    joint.dia.Link.define('mupif.FlowArrow', {
        attrs: {
            line: {
                connection: true,
                fill: 'none',
                stroke: EXECUTION_FLOW_COLOR,
                strokeWidth: FLOW_ARROW_WIDTH,
                strokeOpacity: 0.22,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                pointerEvents: 'none',
                targetMarker: {type: 'path', d: 'M 18 -11 L 0 0 L 18 11 z', fill: EXECUTION_FLOW_COLOR,
                    fillOpacity: 0.35, stroke: 'none'}
            }
        }
    }, {
        markup: [{tagName: 'path', selector: 'line'}]
    });
}

/**
 * Description of one flow arrow (before it becomes a canvas cell).
 *
 * @typedef {Object} FlowArrow
 * @property {Block} from - block executed first
 * @property {Block} to - block executed next
 * @property {Block} container - container of both blocks (the workflow at the top level)
 * @property {boolean} loop - true for the loop-back arrow of a loop
 */

/**
 * Flow arrows of the whole workflow (headless; the canvas cells are created by ``createFlowCells``).
 *
 * @param {BlockWorkflow} workflow
 * @returns {FlowArrow[]}
 */
function collectFlowArrows(workflow){
    let arrows = [];
    let visit = container => {
        let executed = container.blocks.filter(b => b.isExecutable());
        for(let i = 0; i + 1 < executed.length; i++)
            arrows.push({from: executed[i], to: executed[i + 1], container: container, loop: false});
        if(container.isLoop() && executed.length > 0)
            arrows.push({from: executed[executed.length - 1], to: executed[0], container: container, loop: true});
        container.blocks.forEach(b => {
            if(b.isContainer())
                visit(b);
        });
    };
    visit(workflow);
    return arrows;
}

/**
 * Create the canvas cells of the flow arrows.
 *
 * @param {CanvasView} view - the canvas (cell ids and z-order of the blocks)
 * @param {CanvasLayout} layout - geometry of the blocks (for the route of loop-back arrows)
 * @param {Map<string, joint.dia.Element>} block_cells - block cells by id (to embed arrows in containers)
 * @returns {joint.dia.Link[]}
 */
function createFlowCells(view, layout, block_cells){
    let workflow = view.editor.workflowblock;
    return collectFlowArrows(workflow).map((arrow, i) => {
        let container_cell = arrow.container === workflow ? null : block_cells.get(view.blockCellId(arrow.container));
        let attrs = {
            id: 'flow-' + i,
            // above the body of the container, below its children (see CanvasView.render)
            z: container_cell ? container_cell.get('z') + 5 : 5
        };
        let cp = {name: 'boundary', args: {offset: 6}};
        if(arrow.loop){
            // from the bottom of the last block down below all children and back up into the bottom of the
            // first block; a single child loops from the right to the left part of its bottom edge
            let boxes = arrow.container.blocks.map(b => layout.blocks.get(b));
            let y = Math.max(...boxes.map(b => b.y + b.h)) + FLOW_LOOP_OFFSET;
            let from = layout.blocks.get(arrow.from);
            let to = layout.blocks.get(arrow.to);
            let dx_from = arrow.from === arrow.to ? from.w / 4 : 0;
            let dx_to = arrow.from === arrow.to ? -to.w / 4 : 0;
            Object.assign(attrs, {
                source: {id: view.blockCellId(arrow.from), anchor: {name: 'bottom', args: {dx: dx_from}}, connectionPoint: cp},
                target: {id: view.blockCellId(arrow.to), anchor: {name: 'bottom', args: {dx: dx_to}}, connectionPoint: cp},
                vertices: [{x: from.x + from.w / 2 + dx_from, y: y}, {x: to.x + to.w / 2 + dx_to, y: y}],
                connector: {name: 'rounded', args: {radius: 12}}
            });
        }else{
            Object.assign(attrs, {
                source: {id: view.blockCellId(arrow.from), anchor: {name: 'midSide'}, connectionPoint: cp},
                target: {id: view.blockCellId(arrow.to), anchor: {name: 'midSide'}, connectionPoint: cp},
                connector: {name: 'normal'}
            });
        }
        let cell = new joint.shapes.mupif.FlowArrow(attrs);
        if(arrow.loop)
            cell.attr('line', {strokeDasharray: '14 10', strokeWidth: FLOW_ARROW_WIDTH * 0.7});
        if(container_cell){
            cell.set('parent', container_cell.id);
            container_cell.set('embeds', (container_cell.get('embeds') || []).concat([cell.id]));
        }
        return cell;
    });
}

/**
 * Mark execution order problems on the canvas cells: the data link is drawn dashed in the severity color and
 * the badge of the consumer is colored, with the explanations as its tooltip.
 *
 * @param {CanvasView} view
 * @param {OrderViolation[]} violations
 */
function markOrderViolations(view, violations){
    let messages = new Map();
    violations.forEach(v => {
        let color = v.severity === 'error' ? ORDER_ERROR_COLOR : ORDER_WARNING_COLOR;
        let link = view.graph.getCell(view.datalinkCellId(v.datalink));
        if(link)
            link.attr('line', {stroke: color, strokeDasharray: '7 4', strokeWidth: 2.5});
        let id = view.blockCellId(v.consumer);
        let entry = messages.get(id) || {error: false, texts: []};
        entry.error = entry.error || v.severity === 'error';
        entry.texts.push((v.severity === 'error' ? 'Error: ' : 'Warning: ') + v.message);
        messages.set(id, entry);
    });
    messages.forEach((entry, id) => {
        let cell = view.graph.getCell(id);
        if(!cell)
            return;
        cell.attr('badgeBody/fill', entry.error ? ORDER_ERROR_COLOR : ORDER_WARNING_COLOR);
        cell.attr('badgeTitle/text', entry.texts.join('\n'));
    });
}
