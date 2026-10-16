/**
 * Canvas shapes of the workflow editor (JointJS element and link types) and their geometry.
 *
 * Responsibility
 * --------------
 * - defines the JointJS cell types ``mupif.Block`` (any block, containers included), ``mupif.ExtSlot``
 *   (terminal of an external workflow input/output) and ``mupif.DataLink`` (data link between two slots);
 * - extracts what a block shows from the model (``describeBlock``) and measures its natural size
 *   (``measureBlock``), which ``AutoLayout.js`` uses to place and size blocks;
 * - creates the cells for given model objects (``createBlockCell``, ``createExtSlotCell``,
 *   ``createDataLinkCell``).
 *
 * Model -> view sync
 * ------------------
 * Cells are always created from the model (see ``CanvasView.render``) and carry no state of their own except
 * their geometry, which the view writes back to the model after the user moves them. The cell ids are derived
 * from identifiers which are stable within an editing session: ``Block.view_id``, ``Slot.id`` and
 * ``Datalink.id`` (block UIDs are not stable, as they equal the code names regenerated on reordering).
 *
 * JointJS features used
 * ---------------------
 * ``dia.Element.define`` with JSON markup and ``calc()`` attribute expressions, port groups with the
 * ``absolute`` port layout and side labels (one port per data slot, the port id is the slot id), and
 * ``shapes.standard.Link`` with the ``curve`` connector.
 */

/** Font family used for all texts on the canvas (also used to measure them). @type {string} */
const CANVAS_FONT_FAMILY = 'Helvetica, Arial, sans-serif';

/** Geometry constants of the block shape (canvas units). */
const SHAPE_GEOMETRY = {
    HEADER_H: 22,         // height of the dark header with the block name
    PARAM_LINE_H: 13,     // line height of the parameter text
    PORT_ROW_H: 17,       // vertical distance of two slot ports
    PAD: 8,               // inner padding
    PORT_R: 5,            // radius of a slot port
    PORT_LABEL_OFFSET: 9, // distance between a port and its label
    MIN_W: 140,           // minimal block width
    EMPTY_CONTAINER_H: 50,// height of the (empty) children area of a container
    BADGE_H: 20,          // height of the execution label badge
    EXT_SLOT_H: 26,       // height of an external slot terminal
    GRID: 10              // sizes are rounded up to multiples of the grid size
};

/** Fill colors of blocks, keyed by the CSS class returned by Block.getBlockHtmlClass(). */
const BLOCK_COLORS = {
    'we_block_model': '#99ebff',
    'we_block_default': '#cccccc',
    'we_block_allocate_model_at_runtime': '#95b14a',
    'we_block_run_in_background': '#eee04f',
    'we_block_wait_for_background_processes': '#eee04f',
    'we_block_data': '#ff80b3',
    'we_block_helper': '#bea7e8',
    'we_block_input_file': '#ffc77d'
};

/** Colors of data links and ports, keyed by the slot data type (Slot.getDataType()). */
const DATA_TYPE_COLORS = {
    'mupif.Property': '#8e44ad',
    'mupif.PhysicalQuantity': '#c0392b',
    'mupif.Field': '#138d75',
    'mupif.PyroFile': '#d35400',
    'number': '#27ae60'
};
/** Color of data links and ports of other data types. @type {string} */
const DATA_TYPE_DEFAULT_COLOR = '#555555';

/** Accent color of the execution flow (badges and flow arrows). @type {string} */
const EXECUTION_FLOW_COLOR = '#1e66f5';

/** Canvas 2D context used to measure texts (created lazily). @type {CanvasRenderingContext2D|null} */
let shape_measure_context = null;

/**
 * Width of a text rendered in the canvas font.
 *
 * @param {string} text
 * @param {number} size - font size in px
 * @param {boolean} [bold=false]
 * @returns {number} text width in canvas units
 */
function measureTextWidth(text, size, bold=false){
    if(shape_measure_context === null)
        shape_measure_context = document.createElement('canvas').getContext('2d');
    shape_measure_context.font = (bold ? 'bold ' : '') + size + 'px ' + CANVAS_FONT_FAMILY;
    return shape_measure_context.measureText(text).width;
}

/**
 * Convert the HTML produced by Block.getBlockHtml_params() into plain text lines (``<br>`` separates lines).
 *
 * @param {string} html
 * @returns {string[]} non-empty text lines
 */
function htmlToTextLines(html){
    if(!html)
        return [];
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    let doc = new DOMParser().parseFromString('<body>' + text + '</body>', 'text/html');
    return doc.body.textContent.split('\n').map(l => l.replace(/ /g, ' ').trim()).filter(l => l !== '');
}

/**
 * @param {string} type - slot data type
 * @returns {string} color of ports and links of the given data type
 */
function dataTypeColor(type){
    return DATA_TYPE_COLORS[type] || DATA_TYPE_DEFAULT_COLOR;
}

/**
 * @param {number} v
 * @returns {number} ``v`` rounded up to a multiple of the grid size
 */
function roundUpToGrid(v){
    return Math.ceil(v / SHAPE_GEOMETRY.GRID) * SHAPE_GEOMETRY.GRID;
}

/**
 * What a block shows on the canvas, extracted from the model.
 *
 * @typedef {Object} BlockDescription
 * @property {string} title - block type name (e.g., 'Time Loop')
 * @property {string} codeName - name of the block in the generated code
 * @property {string} color - fill color
 * @property {string[]} params - parameter lines (e.g., 'Value = 1.0')
 * @property {Slot[]} inputs - input slots (ports on the left)
 * @property {Slot[]} outputs - output slots (ports on the right)
 * @property {boolean} container - whether the block contains child blocks
 */

/**
 * @param {Block} block
 * @returns {BlockDescription}
 */
function describeBlock(block){
    let css = block.getBlockHtmlClass().split(' ').find(c => c in BLOCK_COLORS);
    return {
        title: block.getBlockHtmlName(),
        codeName: block.getCodeName(),
        color: BLOCK_COLORS[css] || BLOCK_COLORS['we_block_default'],
        params: htmlToTextLines(block.getBlockHtml_params()),
        inputs: block.getSlots('in'),
        outputs: block.getSlots('out'),
        container: block.isContainer()
    };
}

/**
 * Width of the execution label badge.
 *
 * @param {string} label - e.g., '2.1'; empty for blocks which are not executed (data and helper blocks), which
 *        have no badge
 * @returns {number} badge width (0 for no badge)
 */
function badgeWidth(label){
    if(label === '')
        return 0;
    return Math.max(SHAPE_GEOMETRY.BADGE_H, measureTextWidth(label, 11, true) + 12);
}

/**
 * @param {string} label - execution label of the block
 * @returns {number} x coordinate of the block title (right of the badge, which overlaps the top-left corner)
 */
function titleX(label){
    return label === '' ? SHAPE_GEOMETRY.PAD : badgeWidth(label) - 8 + SHAPE_GEOMETRY.PAD;
}

/**
 * Vertical position of the first port row (relative to the top of the block).
 *
 * @param {BlockDescription} d
 * @returns {number}
 */
function portsTop(d){
    let g = SHAPE_GEOMETRY;
    return g.HEADER_H + (d.params.length ? g.PAD + d.params.length * g.PARAM_LINE_H : 0) + g.PAD;
}

/**
 * Natural geometry of a block (see {@link BlockMetrics} in AutoLayout.js).
 *
 * @param {Block} block
 * @returns {BlockMetrics}
 */
function measureBlock(block){
    let g = SHAPE_GEOMETRY;
    let d = describeBlock(block);
    let label_w = s => measureTextWidth(s.name, 10);
    let max_in = d.inputs.reduce((m, s) => Math.max(m, label_w(s)), 0);
    let max_out = d.outputs.reduce((m, s) => Math.max(m, label_w(s)), 0);

    let title_w = titleX(block.getExecutionLabel()) + measureTextWidth(d.title, 12, true) +
        measureTextWidth(d.codeName, 10) + 2 * g.PAD;
    let params_w = d.params.reduce((m, l) => Math.max(m, measureTextWidth(l, 10)), 0) + 2 * g.PAD;
    let ports_w = max_in + max_out + 2 * (g.PORT_LABEL_OFFSET + g.PAD) + 3 * g.PAD;

    let rows = Math.max(d.inputs.length, d.outputs.length);
    let h = portsTop(d) + rows * g.PORT_ROW_H;
    let w = roundUpToGrid(Math.max(g.MIN_W, title_w, params_w, ports_w));
    h = roundUpToGrid(h);
    if(d.container)
        return {w: w, h: h + g.EMPTY_CONTAINER_H, contentTop: h};
    return {w: w, h: h, contentTop: h};
}

/**
 * Size of the terminal of an external workflow slot.
 *
 * @param {SlotExt} slot
 * @returns {{w: number, h: number}}
 */
function measureExtSlot(slot){
    return {w: roundUpToGrid(measureTextWidth(slot.name, 11, true) + 40), h: SHAPE_GEOMETRY.EXT_SLOT_H};
}

/**
 * Port group definition shared by blocks and external slot terminals.
 *
 * @param {string} side - 'left' (inputs) or 'right' (outputs)
 * @returns {Object} JointJS port group
 */
function slotPortGroup(side){
    let g = SHAPE_GEOMETRY;
    return {
        position: {name: 'absolute'},
        // the <title> child shows the slot details as a tooltip
        markup: [{tagName: 'circle', selector: 'portBody', children: [{tagName: 'title', selector: 'portTitle'}]}],
        attrs: {
            portBody: {r: g.PORT_R, magnet: true, stroke: '#222', strokeWidth: 1.5, fill: '#ffffff', cursor: 'crosshair'}
        },
        label: {
            position: {name: side === 'left' ? 'right' : 'left', args: {x: side === 'left' ? g.PORT_LABEL_OFFSET : -g.PORT_LABEL_OFFSET, y: 0}},
            markup: [{tagName: 'text', selector: 'label'}]
        }
    };
}

if(typeof joint !== 'undefined'){
    joint.dia.Element.define('mupif.Block', {
        attrs: {
            body: {width: 'calc(w)', height: 'calc(h)', rx: 7, ry: 7, strokeWidth: 1.5, stroke: '#222'},
            header: {width: 'calc(w)', height: SHAPE_GEOMETRY.HEADER_H, rx: 7, ry: 7, fill: '#2d3436'},
            // squares the bottom corners of the rounded header
            headerBase: {y: SHAPE_GEOMETRY.HEADER_H - 8, width: 'calc(w)', height: 8, fill: '#2d3436'},
            title: {y: SHAPE_GEOMETRY.HEADER_H / 2, textVerticalAnchor: 'middle', fontSize: 12, fontWeight: 'bold',
                fontFamily: CANVAS_FONT_FAMILY, fill: '#ffffff'},
            codeName: {x: 'calc(w-8)', y: SHAPE_GEOMETRY.HEADER_H / 2, textAnchor: 'end', textVerticalAnchor: 'middle',
                fontSize: 10, fontFamily: CANVAS_FONT_FAMILY, fill: '#c8d0d4'},
            params: {x: SHAPE_GEOMETRY.PAD, y: SHAPE_GEOMETRY.HEADER_H + SHAPE_GEOMETRY.PAD, textVerticalAnchor: 'top',
                fontSize: 10, lineHeight: SHAPE_GEOMETRY.PARAM_LINE_H, fontFamily: CANVAS_FONT_FAMILY, fill: '#111'},
            badgeBody: {x: -8, y: -SHAPE_GEOMETRY.BADGE_H / 2 - 2, height: SHAPE_GEOMETRY.BADGE_H, rx: SHAPE_GEOMETRY.BADGE_H / 2,
                ry: SHAPE_GEOMETRY.BADGE_H / 2, fill: EXECUTION_FLOW_COLOR, stroke: '#ffffff', strokeWidth: 1.5},
            badgeLabel: {y: -2, textAnchor: 'middle', textVerticalAnchor: 'middle', fontSize: 11, fontWeight: 'bold',
                fontFamily: CANVAS_FONT_FAMILY, fill: '#ffffff', pointerEvents: 'none'}
        },
        ports: {groups: {in: slotPortGroup('left'), out: slotPortGroup('right')}}
    }, {
        markup: [
            {tagName: 'rect', selector: 'body'},
            {tagName: 'rect', selector: 'header'},
            {tagName: 'rect', selector: 'headerBase'},
            {tagName: 'text', selector: 'title'},
            {tagName: 'text', selector: 'codeName'},
            {tagName: 'text', selector: 'params'},
            // the <title> of the badge explains the execution label (or order problems, see FlowOverlay.js)
            {tagName: 'rect', selector: 'badgeBody', children: [{tagName: 'title', selector: 'badgeTitle'}]},
            {tagName: 'text', selector: 'badgeLabel'}
        ]
    });

    joint.dia.Element.define('mupif.ExtSlot', {
        attrs: {
            body: {width: 'calc(w)', height: 'calc(h)', rx: 13, ry: 13, strokeWidth: 1.5, stroke: '#222'},
            label: {x: 'calc(0.5*w)', y: 'calc(0.5*h)', textAnchor: 'middle', textVerticalAnchor: 'middle', fontSize: 11,
                fontWeight: 'bold', fontFamily: CANVAS_FONT_FAMILY, fill: '#111'}
        },
        ports: {groups: {in: slotPortGroup('left'), out: slotPortGroup('right')}}
    }, {
        markup: [
            {tagName: 'rect', selector: 'body'},
            {tagName: 'text', selector: 'label'}
        ]
    });

    joint.shapes.standard.Link.define('mupif.DataLink', {
        attrs: {
            line: {strokeWidth: 2, strokeLinecap: 'butt', targetMarker: {type: 'path', d: 'M 8 -4 0 0 8 4 z'}},
            // wide transparent hit area; butt caps do not reach over the ports at the link ends
            wrapper: {strokeWidth: 10, strokeLinecap: 'butt'}
        },
        connector: {name: 'curve', args: {sourceDirection: 'right', targetDirection: 'left'}}
    });
}

/**
 * Tooltip text of a slot port.
 *
 * @param {Slot} slot
 * @returns {string} name, data type, DataID, units and the time of setting of the slot (when defined)
 */
function slotTooltip(slot){
    let lines = [slot.name + (slot.external ? ' (external ' + (slot.inout === 'out' ? 'input' : 'output') + ')' : '')];
    let add = (label, value) => {
        if(value !== null && value !== undefined && value !== '' && value !== 'None')
            lines.push(label + ': ' + value);
    };
    add('Type', slot.getDataType());
    add('DataID', slot.getDataID());
    add('Units', slot.getUnits());
    add('Set at', slot.getSetAt());
    if(slot.inout === 'in' && !slot.external)
        lines.push(slot.connected() ? 'connected' : (slot.required ? 'required, not connected' : 'optional'));
    return lines.join('\n');
}

/**
 * Port items of a block for the given slots.
 *
 * @param {Slot[]} slots
 * @param {string} group - 'in' or 'out'
 * @param {number} x - x coordinate of the ports (0 for the left edge, width for the right edge)
 * @param {number} top - y coordinate of the first port row
 * @returns {Object[]} JointJS port items (the port id is the slot id)
 */
function slotPortItems(slots, group, x, top){
    let g = SHAPE_GEOMETRY;
    return slots.map((s, i) => ({
        id: s.getUID(),
        group: group,
        args: {x: x, y: top + i * g.PORT_ROW_H + g.PORT_ROW_H / 2},
        attrs: {
            portBody: {fill: dataTypeColor(s.getDataType())},
            portTitle: {text: slotTooltip(s)},
            label: {text: s.name, fontSize: 10, fontFamily: CANVAS_FONT_FAMILY, fill: '#111'}
        }
    }));
}

/**
 * Create the canvas element of a block.
 *
 * @param {Block} block
 * @param {CanvasBox} box - absolute box of the block
 * @param {string} id - cell id
 * @param {number} z - stacking order (nested blocks must be above their container)
 * @returns {joint.dia.Element}
 */
function createBlockCell(block, box, id, z){
    let g = SHAPE_GEOMETRY;
    let d = describeBlock(block);
    let label = block.getExecutionLabel();
    let badge_w = badgeWidth(label);
    let top = portsTop(d);
    return new joint.shapes.mupif.Block({
        id: id,
        z: z,
        position: {x: box.x, y: box.y},
        size: {width: box.w, height: box.h},
        attrs: {
            body: {fill: d.color, fillOpacity: d.container ? 0.35 : 1},
            title: {x: titleX(label), text: d.title},
            codeName: {text: d.codeName},
            params: {text: d.params.join('\n')},
            // only executed blocks have an execution label
            badgeBody: {width: badge_w, display: label === '' ? 'none' : null},
            badgeTitle: {text: 'Execution order: ' + label},
            badgeLabel: {x: badge_w / 2 - 8, text: label, display: label === '' ? 'none' : null}
        },
        ports: {items: slotPortItems(d.inputs, 'in', 0, top).concat(slotPortItems(d.outputs, 'out', box.w, top))}
    });
}

/**
 * Create the canvas terminal of an external workflow slot. An external *input* of the workflow (stored as an
 * output slot of the workflow block) provides data, so its port is on the right; an external output has its
 * port on the left.
 *
 * @param {SlotExt} slot
 * @param {CanvasBox} box - absolute box of the terminal
 * @param {string} id - cell id
 * @returns {joint.dia.Element}
 */
function createExtSlotCell(slot, box, id){
    let provides = slot.inout === 'out';
    let port = {
        id: slot.getUID(),
        group: provides ? 'out' : 'in',
        args: {x: provides ? box.w : 0, y: box.h / 2},
        attrs: {portBody: {fill: dataTypeColor(slot.getDataType())}, portTitle: {text: slotTooltip(slot)}}
    };
    return new joint.shapes.mupif.ExtSlot({
        id: id,
        z: 1,
        position: {x: box.x, y: box.y},
        size: {width: box.w, height: box.h},
        attrs: {
            body: {fill: provides ? '#d5f5d0' : '#fde2c8'},
            label: {text: slot.name}
        },
        ports: {items: [port]}
    });
}

/**
 * Create the canvas link of a data link, oriented from the producing (output) to the consuming (input) slot.
 *
 * @param {Datalink} datalink
 * @param {string} id - cell id
 * @param {function(Slot): string} slotCellId - id of the cell owning the port of a slot
 * @returns {joint.dia.Link|null} null when the data link does not connect an output with an input
 */
function createDataLinkCell(datalink, id, slotCellId){
    let dir = getDatalinkDirection(datalink);
    if(dir === null)
        return null;
    return new joint.shapes.mupif.DataLink({
        id: id,
        z: 100000,
        source: {id: slotCellId(dir.producer), port: dir.producer.getUID()},
        target: {id: slotCellId(dir.consumer), port: dir.consumer.getUID()},
        attrs: {line: {stroke: dataTypeColor(dir.producer.getDataType())}}
    });
}
