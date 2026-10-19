/**
 * SVG canvas of the workflow editor, based on JointJS.
 *
 * Responsibility
 * --------------
 * ``CanvasView`` owns the JointJS graph and paper showing the edited workflow: blocks (nested containers
 * become nested elements), external slot terminals and data links. It replaced the former HTML/flexbox
 * rendering of blocks and the div-segment data links.
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
 * Clicking selects a block, a data link or an external slot terminal (stored in ``editor.selected_*``, which the
 * keyboard commands in Main.js use); right-clicking opens the context menu of the clicked object. The block menus
 * are the existing ``VisualMenu`` definitions of the blocks, so all actions still go through
 * ``Block.modificationQuery``. A block added from the menu is placed where the menu was opened.
 *
 * The paper fills the editor area; zooming and panning are provided by ``CanvasZoomPan`` (ZoomPan.js) and a
 * toolbar floating above the canvas (zoom buttons, fit to content, execution flow and order status; the
 * application commands are in the top bar, see AppShell.js). A newly shown or loaded project is fitted to the
 * editor area.
 *
 * The execution order is shown by the badges of the blocks and by flow arrows (FlowOverlay.js), which can be
 * switched off in the toolbar (the choice is remembered by the browser). Execution order problems are marked on
 * the canvas and counted in the toolbar, where "Order by dependencies" reorders the blocks of all containers so
 * that producers are executed before their consumers (``orderChildrenByDependencies``).
 *
 * Undo and redo (EditHistory.js, Ctrl+Z / Ctrl+Y) restore the project and rebuild the canvas with
 * ``render({keepView: true})``, which keeps the zoom and pan.
 *
 * Data links are created by dragging from a slot port to another one. While dragging, the ports accepting the
 * link are highlighted (``validateConnection`` asks ``WorkflowEditor.canLinkSlots``); on connection the data
 * link is added to the model (``onLinkConnect``). Hovering a link shows a remove button.
 *
 * JointJS features used
 * ---------------------
 * ``dia.Graph`` / ``dia.Paper`` (embedding of child elements via the ``parent``/``embeds`` attributes and the
 * paper's ``embeddingMode`` with ``validateEmbedding``),
 * paper pointer events, link creation from magnets (``defaultLink``, ``validateConnection``, ``markAvailable``,
 * ``snapLinks``), link tools (``linkTools.Remove``) and the ``stroke`` highlighter (selection outline).
 */
class CanvasView{
    /**
     * @param {WorkflowEditor} editor - the edited project
     * @param {HTMLElement} el - element hosting the paper (it fills #workflowContainer)
     */
    constructor(editor, el){
        this.editor = editor;
        this.el = el;
        /** Model object (Block, SlotExt or Datalink) for every cell id. @type {Map<string, Object>} */
        this.cell_models = new Map();

        /** State of the element being dragged (see ``onPointerDown``), or null. @type {Object|null} */
        this.drag = null;

        /**
         * Where the context menu was opened: the container block (or the workflow), the point in canvas
         * coordinates and the number of its children at that time. A block added by the menu to that container is
         * placed at the point (see ``placeBlockAddedByMenu``).
         * @type {{container: Block, x: number, y: number, n_children: number}|null}
         */
        this.menu_point = null;

        /** Floating element hosting the context menus. @type {HTMLElement} */
        this.menu_el = document.createElement('div');
        this.menu_el.className = 'block_menu_base canvas_context_menu';
        document.body.appendChild(this.menu_el);
        // a click outside of the menu and of the paper closes the menu; presses on the paper are handled by the
        // paper events (JointJS opens context menus already on the right-button mousedown, which then bubbles here)
        document.addEventListener('mousedown', evt => {
            if(!this.menu_el.contains(evt.target) && !this.el.contains(evt.target))
                this.hideMenu();
        });

        this.graph = new joint.dia.Graph({}, {cellNamespace: joint.shapes});
        this.paper = new joint.dia.Paper({
            el: el,
            model: this.graph,
            cellViewNamespace: joint.shapes,
            width: '100%',
            height: '100%',
            gridSize: SHAPE_GEOMETRY.GRID,
            drawGrid: {name: 'dot', args: {color: '#c9ced6'}},
            background: {color: '#f7f8fa'},
            async: false,
            sorting: joint.dia.Paper.sorting.APPROX,
            interactive: {elementMove: true, linkMove: false, labelMove: false, addLinkFromMagnet: true},
            // links end at the edge of the port circle, so that the port itself stays clickable for new links
            defaultConnectionPoint: {name: 'boundary', args: {offset: 1}},
            // data links: dragged from a slot port, dropped on a compatible one
            defaultLink: () => new joint.shapes.mupif.DataLink({attrs: {line: {stroke: DATA_TYPE_DEFAULT_COLOR}}}),
            validateConnection: (view_s, magnet_s, view_t, magnet_t) =>
                this.canConnect(view_s, magnet_s, view_t, magnet_t),
            linkPinning: false,
            markAvailable: true,
            snapLinks: {radius: 20},
            // nesting by drag and drop: a dropped block is embedded in the container under the pointer
            embeddingMode: true,
            frontParentOnly: false,
            findParentBy: 'pointer',
            validateEmbedding: (child_view, parent_view) => this.canEmbed(child_view.model, parent_view.model)
        });

        /**
         * Workflow block shown at the last render; a different one means a newly loaded project, which is fitted
         * to the editor area. @type {BlockWorkflow|null}
         */
        this.shown_workflow = null;

        /** Whether the flow arrows are shown (remembered in the browser's local storage). @type {boolean} */
        this.show_flow = true;
        try{
            this.show_flow = window.localStorage.getItem('mupif_we_show_flow') !== 'false';
        }catch(e){
            // storage not available (e.g., disabled); the default is used
        }
        this.zoom = new CanvasZoomPan(this.paper, scale => this.updateToolbar());
        this.createToolbar();

        this.paper.on('element:pointerdown', (view, evt, x, y) => this.onPointerDown(view));
        this.paper.on('element:pointerup', (view, evt, x, y) => this.onPointerUp(view));
        this.paper.on('link:pointerclick', (link_view) => this.select(this.getModelOfCell(link_view.model)));
        this.paper.on('blank:pointerdown', () => this.select(null));
        this.paper.on('element:contextmenu', (view, evt, x, y) => this.onContextMenu(this.getModelOfCell(view.model), evt, x, y));
        this.paper.on('link:contextmenu', (view, evt, x, y) => this.onContextMenu(this.getModelOfCell(view.model), evt, x, y));
        this.paper.on('blank:contextmenu', (evt, x, y) => this.onContextMenu(this.editor.workflowblock, evt, x, y));
        this.paper.on('link:connect', (link_view) => this.onLinkConnect(link_view.model));
        // hovering a block emphasizes its incoming and outgoing flow arrows
        this.paper.on('element:mouseenter', view => this.highlightFlow(view.model, true));
        this.paper.on('element:mouseleave', view => this.highlightFlow(view.model, false));
        this.paper.on('link:mouseenter', (link_view) => this.showLinkTools(link_view));
        this.paper.on('link:mouseleave', (link_view) => link_view.removeTools());
    }

    /**
     * Create the toolbar shown above the canvas (in the top-left corner of the editor area).
     */
    createToolbar(){
        this.toolbar_el = document.createElement('div');
        this.toolbar_el.className = 'canvas_toolbar';
        this.toolbar_el.innerHTML =
            '<span class="canvas_toolbar_group">' +
            '<button data-cmd="zoom-out" title="Zoom out (mouse wheel)">&minus;</button>' +
            '<span class="canvas_zoom"></span>' +
            '<button data-cmd="zoom-in" title="Zoom in (mouse wheel)">+</button>' +
            '<button data-cmd="fit" title="Show the whole workflow">Fit</button>' +
            '<button data-cmd="reset" title="Actual size">1:1</button>' +
            '</span>' +
            '<span class="canvas_toolbar_group">' +
            '<label title="Show arrows following the execution order"><input type="checkbox" class="canvas_show_flow"> Execution flow</label>' +
            '<span class="canvas_order_status"></span>' +
            '<button data-cmd="order" title="Reorder the blocks so that every block is executed after the blocks it reads data from">' +
            'Order by dependencies</button>' +
            '</span>';
        let commands = {
            'zoom-out': () => this.zoom.zoomBy(1 / ZOOM_STEP),
            'zoom-in': () => this.zoom.zoomBy(ZOOM_STEP),
            'fit': () => this.zoom.fit(),
            'reset': () => this.zoom.zoomTo(1),
            'order': () => this.orderByDependencies()
        };
        let checkbox = this.toolbar_el.querySelector('.canvas_show_flow');
        checkbox.checked = this.show_flow;
        checkbox.addEventListener('change', () => this.setShowFlow(checkbox.checked));
        this.toolbar_el.querySelectorAll('button[data-cmd]').forEach(button => {
            button.addEventListener('click', () => commands[button.dataset.cmd]());
        });
        this.el.parentElement.insertBefore(this.toolbar_el, this.el);
    }

    /**
     * Show or hide the flow arrows.
     *
     * @param {boolean} show
     */
    setShowFlow(show){
        this.show_flow = show;
        try{
            window.localStorage.setItem('mupif_we_show_flow', show ? 'true' : 'false');
        }catch(e){
            // storage not available; the choice holds for this session only
        }
        this.render();
    }

    /**
     * Reorder the children of all containers by their data dependencies (see orderChildrenByDependencies) and
     * redraw. Blocks which cannot be ordered because of a dependency cycle are reported.
     */
    orderByDependencies(){
        let result = orderChildrenByDependencies(this.editor.workflowblock, this.editor, true);
        this.editor.generateWorkflowHtml();
        if(result.unordered.length)
            myQuery_show_error('The following blocks depend on each other in a cycle (or on such blocks) and keep ' +
                'their order:<br>' + result.unordered.map(b => b.getCodeName()).join(', '));
    }

    /**
     * Emphasize (or restore) the flow arrows entering and leaving an element.
     *
     * @param {joint.dia.Element} cell
     * @param {boolean} on
     */
    highlightFlow(cell, on){
        this.graph.getConnectedLinks(cell).forEach(link => {
            if(link.get('type') !== 'mupif.FlowArrow')
                return;
            let view = this.paper.findViewByModel(link);
            if(view)
                view.el.classList.toggle('flow_highlight', on);
        });
    }

    /**
     * Show the number of execution order problems in the toolbar.
     *
     * @param {OrderViolation[]} violations
     */
    updateOrderStatus(violations){
        let el = this.toolbar_el.querySelector('.canvas_order_status');
        let errors = violations.filter(v => v.severity === 'error').length;
        let warnings = violations.length - errors;
        el.className = 'canvas_order_status' + (errors ? ' order_error' : warnings ? ' order_warning' : ' order_ok');
        if(violations.length === 0){
            el.textContent = '\u2713 order OK';
            el.title = 'Every block is executed after the blocks it reads data from.';
        }else{
            let parts = [];
            if(errors)
                parts.push(errors + (errors > 1 ? ' errors' : ' error'));
            if(warnings)
                parts.push(warnings + (warnings > 1 ? ' warnings' : ' warning'));
            el.textContent = '\u26a0 ' + parts.join(', ');
            el.title = violations.map(v => v.message).join('\n');
        }
    }

    /**
     * Show the current zoom factor and the state of the flow arrows in the toolbar.
     */
    updateToolbar(){
        this.toolbar_el.querySelector('.canvas_show_flow').checked = this.show_flow;
        this.toolbar_el.querySelector('.canvas_zoom').textContent = Math.round(this.zoom.getScale() * 100) + ' %';
    }

    /**
     * @param {joint.dia.CellView} view - view of a block or of an external slot terminal
     * @param {SVGElement} magnet - port element
     * @returns {Slot|null} the data slot represented by the port
     */
    slotOfMagnet(view, magnet){
        if(!view || !magnet)
            return null;
        let port_id = view.findAttribute('port', magnet);
        return port_id ? this.editor.getSlotByUID(port_id) : null;
    }

    /**
     * Connection rule used while a link is dragged: the link may end at a port when the editor allows linking
     * the two slots (see WorkflowEditor.canLinkSlots).
     *
     * @returns {boolean}
     */
    canConnect(view_s, magnet_s, view_t, magnet_t){
        let s = this.slotOfMagnet(view_s, magnet_s);
        let t = this.slotOfMagnet(view_t, magnet_t);
        return s !== null && t !== null && this.editor.canLinkSlots(s, t).ok;
    }

    /**
     * Add the data link drawn by the user to the model and rebuild the canvas. The data link is oriented from
     * the output to the input slot, regardless of the direction in which it was drawn.
     *
     * @param {joint.dia.Link} link - the link connected by the user
     */
    onLinkConnect(link){
        let slot_of_end = end => {
            let cell = end.id ? this.graph.getCell(end.id) : null;
            let model = cell ? this.getModelOfCell(cell) : null;
            return model && end.port ? this.editor.getSlotByUID(end.port) : null;
        };
        let a = slot_of_end(link.source());
        let b = slot_of_end(link.target());
        link.remove();
        if(a !== null && b !== null){
            if(a.inout === 'in')
                [a, b] = [b, a];
            this.editor.addDatalink(a, b);
        }
        this.editor.generateWorkflowHtml();
    }

    /**
     * Show the remove button on a hovered data link.
     *
     * @param {joint.dia.LinkView} link_view
     */
    showLinkTools(link_view){
        let datalink = this.getModelOfCell(link_view.model);
        if(!(datalink instanceof Datalink))
            return;
        link_view.addTools(new joint.dia.ToolsView({
            tools: [new joint.linkTools.Remove({
                distance: '50%',
                action: () => {
                    this.editor.removeDatalink(datalink);
                    this.editor.generateWorkflowHtml();
                }
            })]
        }));
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
        this.select(this.getModelOfCell(cell));
        this.drag = {id: cell.id, position: cell.position(), parent: cell.get('parent') || null};
    }

    /**
     * Select a model object (or clear the selection) and outline it on the canvas. The selection is stored in
     * the editor (``selected_block``, ``selected_datalink``, ``selected_slot_ext``), where the keyboard commands
     * (Delete, arrow keys, see Main.js) find it. Any open context menu is closed.
     *
     * @param {Block|Datalink|SlotExt|null} model
     */
    select(model){
        this.hideMenu();
        this.editor.selected_block = model instanceof Block ? model : null;
        this.editor.selected_datalink = model instanceof Datalink ? model : null;
        this.editor.selected_slot_ext = model instanceof SlotExt ? model : null;
        this.showSelection();
        this.editor.emit('selection');
    }

    /**
     * Outline the selected object (after a selection change or a re-render). A selection whose object no longer
     * exists (e.g., a deleted block) is cleared.
     */
    showSelection(){
        joint.highlighters.stroke.removeAll(this.paper, 'selection');
        let selected = this.editor.selected_block || this.editor.selected_datalink || this.editor.selected_slot_ext;
        if(!selected || selected === this.editor.workflowblock)
            return;
        let id = selected instanceof Block ? this.blockCellId(selected) :
            selected instanceof Datalink ? this.datalinkCellId(selected) : this.slotCellId(selected);
        let view = this.graph.getCell(id) ? this.paper.findViewByModel(id) : null;
        if(!view){
            this.editor.selected_block = this.editor.selected_datalink = this.editor.selected_slot_ext = null;
            return;
        }
        let is_link = selected instanceof Datalink;
        let highlighter = joint.highlighters.stroke.add(view, is_link ? 'line' : 'body', 'selection', {
            padding: is_link ? 0 : 4,
            rx: 10,
            ry: 10,
            attrs: {'stroke': '#ff3b30', 'stroke-width': is_link ? 5 : 3, 'stroke-opacity': is_link ? 0.6 : 1}
        });
        // the outline is appended to the cell; keep the execution label badge in front of it
        let badge = is_link ? null : view.findNode('badgeBody');
        if(badge && highlighter.el)
            badge.parentNode.insertBefore(highlighter.el, badge);
    }

    /**
     * Open the context menu of a block, data link or external slot at the mouse position.
     *
     * @param {Block|Datalink|SlotExt|null} model - the clicked object (the workflow for the blank canvas)
     * @param {Event} evt
     * @param {number} x - mouse position in canvas coordinates
     * @param {number} y
     */
    onContextMenu(model, evt, x, y){
        evt.preventDefault();
        if(model === null)
            return;
        this.select(model === this.editor.workflowblock ? null : model);
        let html = '';
        if(model instanceof Block){
            html = model.getMenuHtml();
            // the containing block for blocks added through the menu; they are placed at the clicked point
            this.menu_point = model.isContainer() ? {container: model, x: x, y: y, n_children: model.blocks.length} : null;
        }else if(model instanceof Datalink){
            html = this.menuItemHtml('editor.removeDatalink(editor.selected_datalink);editor.generateWorkflowHtml();', 'Delete&nbsp;data&nbsp;link');
        }else if(model instanceof SlotExt){
            html = this.menuItemHtml('editor.deleteExtSlot(editor.selected_slot_ext);editor.generateWorkflowHtml();', 'Delete&nbsp;external&nbsp;slot');
        }
        if(html === '')
            return;
        this.menu_el.innerHTML = '<div class="block_menu block_menu_0" style="display:block;">' + html + '</div>';
        this.menu_el.style.left = evt.clientX + 'px';
        this.menu_el.style.top = evt.clientY + 'px';
        this.menu_el.style.display = 'block';
    }

    /**
     * @param {string} onclick - JavaScript code executed by the item
     * @param {string} text - item text (HTML)
     * @returns {string} HTML of a context menu item styled as the block menu items
     */
    menuItemHtml(onclick, text){
        return '<div class="block_menu_item" onclick="' + onclick + '">' + text + '</div>';
    }

    /**
     * Close the context menu.
     */
    hideMenu(){
        this.menu_el.style.display = 'none';
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
     * Find where a block dropped at a point of the screen would be placed: the innermost container block under
     * the point (or the workflow) and the position of the dropped block in it. The position is snapped to the
     * grid and moved into the content area of the container (below its header), so that it does not shift the
     * other children.
     *
     * @param {number} client_x - point in client (screen) coordinates
     * @param {number} client_y
     * @returns {{container: Block, x: number, y: number}|null} the container and the position relative to it;
     *          null when the point is not on the canvas
     */
    dropTargetAt(client_x, client_y){
        let rect = this.el.getBoundingClientRect();
        if(client_x < rect.left || client_x > rect.right || client_y < rect.top || client_y > rect.bottom)
            return null;
        let point = this.paper.clientToLocalPoint(client_x, client_y);
        let grid = SHAPE_GEOMETRY.GRID;
        point = {x: Math.round(point.x / grid) * grid, y: Math.round(point.y / grid) * grid};
        let cell = null;
        this.graph.findElementsAtPoint(point).forEach(el => {
            let model = this.getModelOfCell(el);
            if(model instanceof Block && model.isContainer() && (cell === null || el.get('z') > cell.get('z')))
                cell = el;
        });
        if(cell === null)
            return {container: this.editor.workflowblock, x: point.x, y: point.y};
        let container = this.getModelOfCell(cell);
        let origin = cell.position();
        return {
            container: container,
            x: Math.max(point.x - origin.x, LAYOUT_PADDING),
            y: Math.max(point.y - origin.y, measureBlock(container).contentTop + LAYOUT_PADDING)
        };
    }

    /**
     * Outline the container receiving a dragged block (or remove the outline).
     *
     * @param {Block|null} container - container block, or null (the workflow has no outline)
     */
    highlightDropTarget(container){
        joint.highlighters.stroke.removeAll(this.paper, 'drop');
        if(container === null || container === this.editor.workflowblock)
            return;
        let view = this.paper.findViewByModel(this.blockCellId(container));
        if(view)
            joint.highlighters.stroke.add(view, 'body', 'drop', {
                padding: 6, rx: 10, ry: 10,
                attrs: {'stroke': EXECUTION_FLOW_COLOR, 'stroke-width': 3, 'stroke-dasharray': '8 5'}
            });
    }

    /**
     * Rebuild all canvas cells from the model.
     *
     * A newly loaded project (a different workflow block) is fitted to the editor area, unless ``keepView`` is
     * set: undo and redo also load a new workflow block, but the user's zoom and pan are kept.
     *
     * @param {Object} [options]
     * @param {boolean} [options.keepView=false] - keep the zoom and pan
     */
    render(options={}){
        let workflow = this.editor.workflowblock;
        workflow.generateAllElementCodeNames();
        this.hideMenu();
        this.placeBlockAddedByMenu();
        let layout = computeCanvasLayout(workflow, measureBlock, measureExtSlot);

        let cells = [];
        this.cell_models = new Map();
        let block_cells = new Map();

        // blocks; nested blocks are embedded in their container and stacked above it (z: 10 per nesting level,
        // the flow arrows of a container lie in between, see FlowOverlay.js)
        let add_block = (block, parent_cell, depth) => {
            let cell = createBlockCell(block, layout.blocks.get(block), this.blockCellId(block), 10 * (depth + 1));
            if(parent_cell !== null){
                cell.set('parent', parent_cell.id);
                parent_cell.set('embeds', (parent_cell.get('embeds') || []).concat([cell.id]));
            }
            cells.push(cell);
            block_cells.set(cell.id, cell);
            this.cell_models.set(cell.id, block);
            block.blocks.forEach(child => add_block(child, cell, depth + 1));
        };
        workflow.blocks.forEach(block => add_block(block, null, 0));

        if(this.show_flow)
            cells = cells.concat(createFlowCells(this, layout, block_cells));

        layout.extSlots.forEach((box, slot) => {
            let cell = createExtSlotCell(slot, box, this.slotCellId(slot));
            cells.push(cell);
            this.cell_models.set(cell.id, slot);
        });

        // a data link is drawn only when both of its slots are shown (it cannot refer to a missing cell)
        let shown = new Set(cells.map(c => c.id));
        this.editor.datalinks.forEach(dl => {
            let cell = createDataLinkCell(dl, this.datalinkCellId(dl), slot => this.slotCellId(slot));
            if(cell !== null && shown.has(cell.source().id) && shown.has(cell.target().id)){
                cells.push(cell);
                this.cell_models.set(cell.id, dl);
            }
        });

        this.graph.resetCells(cells);
        let violations = findOrderViolations(this.editor);
        markOrderViolations(this, violations);
        this.updateOrderStatus(violations);
        this.showSelection();
        if(this.shown_workflow !== workflow){
            this.shown_workflow = workflow;
            if(!options.keepView)
                this.zoom.fit();
        }
        this.updateToolbar();
    }

    /**
     * Place a block added through the context menu at the point where the menu was opened. Added blocks are
     * appended to the container, so the block is recognized as a new, unplaced last child (other menu actions,
     * e.g., arranging the children, do not add a child). The point is used only once.
     */
    placeBlockAddedByMenu(){
        let point = this.menu_point;
        this.menu_point = null;
        if(point === null || point.container.blocks.length !== point.n_children + 1)
            return;
        let block = point.container.blocks[point.n_children];
        if(block.layout !== null)
            return;
        let origin = {x: 0, y: 0};
        if(point.container !== this.editor.workflowblock){
            let cell = this.graph.getCell(this.blockCellId(point.container));
            if(!cell)
                return;
            origin = cell.position();
        }
        block.setLayout({x: point.x - origin.x, y: point.y - origin.y});
    }

}
