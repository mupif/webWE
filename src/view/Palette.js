/**
 * Block palette: the left panel of the editor offering all block kinds and the loaded models.
 *
 * Responsibility
 * --------------
 * ``BlockPalette`` lists the block kinds of ``PALETTE_CATEGORIES`` grouped by category and the model metadata
 * loaded in the editor (``WorkflowEditor.list_of_model_metadata``, which replaces the former "Models" page:
 * metadata files can be loaded, downloaded and removed here). A search field filters the entries.
 *
 * A block is added by dragging its entry onto the canvas: it is created in the innermost container under the
 * mouse pointer (or at the top level) at the drop point; the target container is outlined while dragging.
 * Clicking an entry adds the block to the selected container (or to the workflow), where the automatic layout
 * places it.
 *
 * Model -> view sync
 * ------------------
 * The palette changes the model through ``Block.addBlockByName`` (and ``BlockModel.setMetadataAndUpdate`` for
 * models) and ends with ``WorkflowEditor.generateWorkflowHtml()``, which redraws the canvas and records the
 * step for undo. The list of models is rebuilt by ``renderModels`` whenever the loaded metadata change.
 */

/**
 * Block kinds offered by the palette. ``kind`` is the name passed to ``Block.addBlockByName``; ``color`` is the
 * key of the block color in BLOCK_COLORS (Shapes.js), the same as the class of the block.
 */
const PALETTE_CATEGORIES = [
    {label: 'Data', items: [
        {kind: 'physicalquantity', label: 'Physical quantity', color: 'we_block_data', hint: 'Constant value with units'},
        {kind: 'property', label: 'Property', color: 'we_block_data', hint: 'Constant MuPIF property (value, units, DataID)'},
        {kind: 'file', label: 'Input file', color: 'we_block_input_file', hint: 'Input file of a model'},
        {kind: 'variable', label: 'Variable', color: 'we_block_data', hint: 'Stores a value at its place in the execution order'}
    ]},
    {label: 'Control flow', items: [
        {kind: 'timeloop', label: 'Time loop', color: 'we_block_default', hint: 'Repeats its blocks for each time step'},
        {kind: 'dowhile', label: 'Do-while loop', color: 'we_block_default', hint: 'Repeats its blocks while a condition holds'}
    ]},
    {label: 'Models', items: [
        {kind: 'model', label: 'Model (choose later)', color: 'we_block_model', hint: 'Model block; select the model in the inspector'}
    ]},
    {label: 'Parallel execution', items: [
        {kind: 'run_in_background', label: 'Run in background', color: 'we_block_run_in_background', hint: 'Runs its blocks in background'},
        {kind: 'allocate_model_at_runtime', label: 'Allocate model at runtime', color: 'we_block_allocate_model_at_runtime',
            hint: 'Allocates new model instances during the execution'},
        {kind: 'wait_for_background_processes', label: 'Wait for background processes', color: 'we_block_wait_for_background_processes',
            hint: 'Waits until the background models finish'}
    ]},
    {label: 'Conversions and helpers', items: [
        {kind: 'value_comparison', label: 'Value comparison', color: 'we_block_helper', hint: 'Compares two values (e.g., a loop condition)'},
        {kind: 'property_to_quantity', label: 'Property to quantity', color: 'we_block_helper'},
        {kind: 'quantity_to_property', label: 'Quantity to property', color: 'we_block_helper'},
        {kind: 'number_to_quantity', label: 'Number to quantity', color: 'we_block_helper'},
        {kind: 'number_to_property', label: 'Number to property', color: 'we_block_helper'},
        {kind: 'datalist_length', label: 'DataList length', color: 'we_block_helper'},
        {kind: 'get_item_from_datalist', label: 'Get item from DataList', color: 'we_block_helper'}
    ]}
];

/** Distance (px) the pointer must move before a press on a palette entry becomes a drag. @type {number} */
const PALETTE_DRAG_THRESHOLD = 4;

class BlockPalette{
    /**
     * @param {WorkflowEditor} editor - the edited project (with its canvas)
     * @param {HTMLElement} el - the panel element
     */
    constructor(editor, el){
        this.editor = editor;
        this.el = el;
        /** State of the current press or drag of an entry, or null. @type {Object|null} */
        this.drag = null;
        this.build();
        document.addEventListener('pointermove', evt => this.onPointerMove(evt));
        document.addEventListener('pointerup', evt => this.onPointerUp(evt));
    }

    /**
     * Create the content of the panel.
     */
    build(){
        let html = '<div class="palette_search"><input type="search" placeholder="Search blocks and models…" ' +
            'aria-label="Search blocks and models"></div><div class="palette_scroll">';
        PALETTE_CATEGORIES.forEach(category => {
            html += '<section class="palette_section"><h3>' + category.label + '</h3>';
            category.items.forEach(item => {
                html += '<div class="palette_item" data-kind="' + item.kind + '" title="' + (item.hint || item.label) + '">' +
                    '<span class="palette_swatch" style="background:' + BLOCK_COLORS[item.color] + '"></span>' +
                    '<span class="palette_label">' + item.label + '</span></div>';
            });
            html += '</section>';
        });
        html += '<section class="palette_section palette_models"><h3>Loaded models' +
            '<button class="palette_load" title="Load model metadata (JSON) from a file">Load…</button></h3>' +
            '<div class="palette_model_list"></div></section></div>' +
            '<input type="file" id="form_metadata_file_selector" accept=".json,application/json" style="display:none;" ' +
            'onchange="loadJsonMetaDataFileContent();">';
        this.el.innerHTML = html;

        this.el.querySelector('.palette_search input').addEventListener('input', () => this.filter());
        this.el.querySelector('.palette_load').addEventListener('click', () =>
            document.getElementById('form_metadata_file_selector').click());
        this.el.querySelectorAll('.palette_item[data-kind]').forEach(item_el =>
            item_el.addEventListener('pointerdown', evt => this.onPointerDown(evt, item_el, {kind: item_el.dataset.kind})));
        this.renderModels();
    }

    /**
     * Rebuild the list of loaded models (after loading or removing model metadata).
     */
    renderModels(){
        let list = this.el.querySelector('.palette_model_list');
        let md_list = this.editor.list_of_model_metadata;
        list.innerHTML = md_list.length ? '' : '<p class="palette_empty">No model metadata loaded.</p>';
        md_list.forEach((md, i) => {
            let item_el = document.createElement('div');
            item_el.className = 'palette_item palette_model';
            item_el.title = md['Name'] + ' (' + md['ID'] + '); drag onto the canvas to add the model';
            item_el.innerHTML = '<span class="palette_swatch" style="background:' + BLOCK_COLORS['we_block_model'] + '"></span>' +
                '<span class="palette_label">' + md['Name'] + '<small>' + md['ID'] + '</small></span>' +
                '<button class="palette_icon" data-cmd="download" title="Download the metadata">&#x2913;</button>' +
                '<button class="palette_icon" data-cmd="remove" title="Remove from the editor">&times;</button>';
            item_el.querySelector('[data-cmd="download"]').addEventListener('click', () => this.editor.download_ith_metadata(i));
            item_el.querySelector('[data-cmd="remove"]').addEventListener('click', () => deleteMetaDataByListID(i));
            item_el.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', evt => evt.stopPropagation()));
            item_el.addEventListener('pointerdown', evt => this.onPointerDown(evt, item_el, {kind: 'model', metadata: md}));
            list.appendChild(item_el);
        });
        this.filter();
    }

    /**
     * Show only the entries matching the search text (case-insensitive) and the sections containing them.
     */
    filter(){
        let text = this.el.querySelector('.palette_search input').value.trim().toLowerCase();
        this.el.querySelectorAll('.palette_section').forEach(section => {
            let visible = 0;
            section.querySelectorAll('.palette_item').forEach(item_el => {
                let match = text === '' || item_el.textContent.toLowerCase().includes(text);
                item_el.style.display = match ? '' : 'none';
                visible += match ? 1 : 0;
            });
            let is_models = section.classList.contains('palette_models');
            section.style.display = visible || text === '' || is_models ? '' : 'none';
        });
    }

    /**
     * Start pressing an entry (it becomes a drag once the pointer moves).
     *
     * @param {PointerEvent} evt
     * @param {HTMLElement} item_el - the entry
     * @param {{kind: string, metadata: (Object|undefined)}} payload - what the entry creates
     */
    onPointerDown(evt, item_el, payload){
        if(evt.button !== 0)
            return;
        evt.preventDefault();
        this.drag = {payload: payload, item_el: item_el, x: evt.clientX, y: evt.clientY, ghost: null};
    }

    /**
     * Move the ghost of the dragged entry and outline the target container.
     *
     * @param {PointerEvent} evt
     */
    onPointerMove(evt){
        let drag = this.drag;
        if(drag === null)
            return;
        if(drag.ghost === null){
            if(Math.hypot(evt.clientX - drag.x, evt.clientY - drag.y) < PALETTE_DRAG_THRESHOLD)
                return;
            drag.ghost = drag.item_el.cloneNode(true);
            drag.ghost.classList.add('palette_ghost');
            document.body.appendChild(drag.ghost);
        }
        drag.ghost.style.left = (evt.clientX + 8) + 'px';
        drag.ghost.style.top = (evt.clientY + 8) + 'px';
        let target = this.editor.canvas.dropTargetAt(evt.clientX, evt.clientY);
        this.editor.canvas.highlightDropTarget(target ? target.container : null);
    }

    /**
     * Finish a press (adds the block to the selected container) or a drag (adds it at the drop point).
     *
     * @param {PointerEvent} evt
     */
    onPointerUp(evt){
        let drag = this.drag;
        if(drag === null)
            return;
        this.drag = null;
        let canvas = this.editor.canvas;
        canvas.highlightDropTarget(null);
        if(drag.ghost === null){
            let selected = this.editor.selected_block;
            this.addBlock(drag.payload, selected && selected.isContainer() ? selected : this.editor.workflowblock, null);
            return;
        }
        drag.ghost.remove();
        let target = canvas.dropTargetAt(evt.clientX, evt.clientY);
        if(target !== null)
            this.addBlock(drag.payload, target.container, {x: target.x, y: target.y});
    }

    /**
     * Create a block from a palette entry, select it and redraw.
     *
     * @param {{kind: string, metadata: (Object|undefined)}} payload - block kind (and model metadata)
     * @param {Block} container - the workflow or a container block
     * @param {{x: number, y: number}|null} position - position in the container, or null for automatic placement
     * @returns {Block|null} the new block
     */
    addBlock(payload, container, position){
        let block = container.addBlockByName(payload.kind);
        if(block === null)
            return null;
        if(payload.metadata)
            block.setMetadataAndUpdate(payload.metadata);
        if(position !== null)
            block.setLayout(position);
        this.editor.generateWorkflowHtml();
        this.editor.canvas.select(block);
        return block;
    }
}
