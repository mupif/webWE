/**
 * Counter used to assign {@link Block#view_id} values. It is only incremented, so view ids are unique
 * within one editor session (they are never persisted).
 * @type {number}
 */
let block_view_id_counter = 0;

/**
 * Geometry of a block on the editor canvas.
 *
 * Coordinates are expressed in canvas units and are **relative to the top-left corner of the parent
 * container block** (for top-level blocks the parent is the workflow, i.e. the canvas origin). Storing
 * relative coordinates keeps the layout of a container's content intact when the container is moved.
 *
 * The layout is purely presentational: it is saved to and loaded from the project JSON, but it never
 * influences the generated code. Execution order is defined by the order of {@link Block#blocks}.
 *
 * @typedef {Object} BlockLayout
 * @property {number} x - left edge relative to the parent container
 * @property {number} y - top edge relative to the parent container
 * @property {number} [w] - width (optional; when missing the view computes it from the content)
 * @property {number} [h] - height (optional; when missing the view computes it from the content)
 */

/**
 * Validate and normalize a layout record (e.g., read from a JSON file).
 *
 * @param {*} data - candidate layout object
 * @param {boolean} [with_size=true] - when false, the size fields ``w`` and ``h`` are dropped
 * @returns {BlockLayout|null} normalized copy, or null when ``data`` does not contain numeric ``x`` and ``y``
 */
function normalizeLayout(data, with_size=true){
    if(data === null || typeof data !== 'object')
        return null;
    if(!Number.isFinite(data['x']) || !Number.isFinite(data['y']))
        return null;
    let layout = {'x': data['x'], 'y': data['y']};
    if(with_size){
        if(Number.isFinite(data['w']) && data['w'] > 0)
            layout['w'] = data['w'];
        if(Number.isFinite(data['h']) && data['h'] > 0)
            layout['h'] = data['h'];
    }
    return layout;
}

/**
 * Description of an editable parameter of a block, of the project or of an external slot, used to build forms
 * (e.g., the inspector panel of the editor). The value is changed with the ``setParameter`` method of the owner.
 *
 * @typedef {Object} EditableParameter
 * @property {string} key - identifier passed to ``setParameter``
 * @property {string} label - human readable name
 * @property {string} type - 'text' (free text) or 'select' (one of ``options``)
 * @property {string} value - current value
 * @property {{value: string, label: string}[]} [options] - choices of a 'select' parameter
 */

/**
 * @param {string[]} values
 * @returns {{value: string, label: string}[]} select options showing the values themselves
 */
function parameterOptions(values){
    return values.map(v => ({value: v, label: v}));
}

class Block{
    /**
     * @param {WorkflowEditor} editor - the editor owning the block
     * @param {Block|null} parent_block - container block in which this block is nested (null for the workflow)
     */
    constructor(editor, parent_block){
        this.editor = editor;
        this.parent_block = parent_block;
        /** Child blocks; **their order defines the execution order** within this block. @type {Block[]} */
        this.blocks = [];
        this.input_slots = [];
        this.output_slots = [];
        this.name = 'Block';

        /**
         * Name of the block in the generated code. It also serves as the persistent block UID
         * (see {@link Block#getUID}) and it is regenerated whenever the block tree changes
         * (see BlockWorkflow.generateAllElementCodeNames), e.g., when blocks are reordered.
         * @type {string}
         */
        this.code_name = "";

        /**
         * Session-unique, immutable identifier of the block used by the graphical view (e.g., as the id
         * of the corresponding canvas element). Unlike {@link Block#code_name} it does not change when
         * blocks are reordered or renamed. It is not persisted.
         * @type {number}
         */
        this.view_id = ++block_view_id_counter;

        /**
         * Position (and optionally size) of the block on the canvas, or null when the block has not been
         * placed yet (the view then computes an automatic layout).
         * @type {BlockLayout|null}
         */
        this.layout = null;

        this.menu_items = [];
        this.menu_record = new VisualMenu();

        /**
         * Direction ('vertical' or 'horizontal') in which child blocks are arranged by the automatic layout.
         * @type {string}
         */
        this.child_block_sort = 'vertical';

        this.defines_timestep = false;
    }

    /**
     * @returns {EditableParameter[]} the parameters of the block which the user can edit (none by default;
     *          blocks with parameters override this method together with {@link Block#setParameter})
     */
    getParameters(){
        return [];
    }

    /**
     * Change a parameter of the block (see {@link Block#getParameters}).
     *
     * @param {string} key - parameter key
     * @param {string} value - new value
     * @returns {boolean} true when the parameter exists and the value was accepted
     */
    setParameter(key, value){
        return false;
    }

    /**
     * @returns {boolean} true when the block can contain child blocks (workflow, loops, ...);
     *                    container blocks override this method
     */
    isContainer(){
        return false;
    }

    /**
     * @returns {boolean} true when the block executes its children repeatedly (Timeloop, DoWhile).
     *                    Inside a loop, reading a value produced later in the loop body is a legitimate
     *                    read of the previous iteration's value.
     */
    isLoop(){
        return false;
    }

    /**
     * @returns {boolean} true when the block emits execution code, i.e., it is executed at its position among
     *          its siblings (models, variables, loops and other containers). Data and helper blocks (constants,
     *          input files, conversions, comparisons) override this method and return false: their value is
     *          evaluated where a consumer reads it, so their position in the child list does not matter.
     */
    isExecutable(){
        return true;
    }

    /**
     * @returns {number} zero-based position of the block among the *executable* children of its parent, i.e.,
     *                   its execution order within the parent; -1 for the workflow (root) block and for blocks
     *                   which are not executable (see {@link Block#isExecutable})
     */
    getExecutionIndex(){
        if(this.parent_block === null || !this.isExecutable())
            return -1;
        return this.parent_block.blocks.filter(b => b.isExecutable()).indexOf(this);
    }

    /**
     * Hierarchical execution label of the block, e.g., '2' for the second executed top-level block and '2.1'
     * for the first executed block nested in it. The label reflects the order in which the generated code
     * executes the blocks. The workflow (root) block and non-executable blocks (data and helper blocks, see
     * {@link Block#isExecutable}) have an empty label.
     *
     * @returns {string} execution label
     */
    getExecutionLabel(){
        if(this.parent_block === null || !this.isExecutable())
            return '';
        let parent_label = this.parent_block.getExecutionLabel();
        let own = String(this.getExecutionIndex() + 1);
        return parent_label === '' ? own : parent_label + '.' + own;
    }

    /**
     * @returns {BlockLayout|null} position and size of the block on the canvas (see {@link BlockLayout})
     */
    getLayout(){
        return this.layout;
    }

    /**
     * Set the canvas layout of the block.
     *
     * @param {BlockLayout|null} layout - new layout; invalid values are treated as null (= not placed)
     */
    setLayout(layout){
        this.layout = normalizeLayout(layout);
    }

    getDefinesTimestep(){
        return this.defines_timestep;
    }

    getTimestepVariableName(){
        if(this.getDefinesTimestep())
            return this.code_name + "_time_step";
        return "None";
    }

    getTimestepVariableNameFromSelfOrParent(){
        if(this.getDefinesTimestep())
            return this.getTimestepVariableName();
        if(this.parent_block !== null)
            return this.parent_block.getTimestepVariableNameFromSelfOrParent();
        return "None"
    }

    /** @returns {Block} */
    getParentBlock(){
        return this.parent_block;
    }

    /** @returns {boolean} */
    getHasParentBlock(){
        return this.parent_block !== null;
    }

    /** @returns {Block[]} */
    getParentBlockChain(){
        let chain = [];
        if(this.getHasParentBlock()){
            chain = this.getParentBlock().getParentBlockChain();
            chain.push(this.getParentBlock());
        }
        return chain;
    }
    
    

    getMenu(){
        return this.menu_record;
    }

    addMoveMenuItems(){
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('move_me', 'up', 'Up'), 'Move');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('move_me', 'down', 'Down'), 'Move');
        this.getMenu().addItem(new VisualMenuItem('delete_me', '', 'Delete'));
    }

    addAddBlockItems(){
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'physicalquantity', 'Physical&nbsp;Quantity'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'property', 'Property'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'timeloop', 'Time&nbsp;Loop'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'dowhile', 'DoWhile&nbsp;Loop'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'model', 'Model'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'file', 'File'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'value_comparison', 'Value&nbsp;comparison'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'property_to_quantity', 'Property&nbsp;to&nbsp;Quantity'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'quantity_to_property', 'Quantity&nbsp;to&nbsp;Property'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'number_to_quantity', 'Number&nbsp;to&nbsp;Quantity'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'number_to_property', 'Number&nbsp;to&nbsp;Property'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'datalist_length', 'DataList&nbsp;Length'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'allocate_model_at_runtime', 'Allocate&nbsp;model&nbsp;at&nbsp;runtime'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'run_in_background', 'Run&nbsp;in&nbsp;background'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'variable', 'Variable'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'get_item_from_datalist', 'Get&nbsp;item&nbsp;from&nbsp;datalist'), 'Add&nbsp;block');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_block', 'wait_for_background_processes', 'Wait&nbsp;for&nbsp;background&nbsp;processes'), 'Add&nbsp;block');
    }

    addAddExternalSlotItems(){
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_external_slot', 'in', 'External&nbsp;Input'), 'Add&nbsp;External&nbsp;Dataslot');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('add_external_slot', 'out', 'External&nbsp;Output'), 'Add&nbsp;External&nbsp;Dataslot');
    }

    /**
     * Menu items arranging the child blocks on the canvas (keyword 'set_order', see {@link Block#arrangeChildren}).
     * The arrangement does not change the execution order.
     */
    addOrderingMenuItems(){
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_order', 'dataflow', 'By&nbsp;data&nbsp;flow'), 'Arrange&nbsp;child&nbsp;blocks');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_order', 'horizontal', 'Horizontally'), 'Arrange&nbsp;child&nbsp;blocks');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_order', 'vertical', 'Vertically'), 'Arrange&nbsp;child&nbsp;blocks');
    }

    /**
     * Set the arrangement of the child blocks and discard their canvas positions, so that the automatic layout
     * places them again (see src/view/AutoLayout.js). The stored size of this block is discarded as well, so that
     * it shrinks to its new content. The execution order is not changed.
     *
     * @param {string} sort - 'dataflow' (columns following the data flow), 'vertical' or 'horizontal'
     */
    arrangeChildren(sort){
        if(sort !== 'dataflow' && sort !== 'vertical' && sort !== 'horizontal')
            return;
        this.child_block_sort = sort;
        this.blocks.forEach(b => { b.layout = null; });
        if(this.layout !== null)
            this.layout = {x: this.layout.x, y: this.layout.y};
    }

    defineMenu(){
        this.menu_record = new VisualMenu();
    }

    generateMenu(menu){
        this.generateGraphicalMenuInstanceStructure(menu, this.menu_record, menu);
    }

    generateGraphicalMenuInstanceStructure(menu, menu_record, root_menu){
        let self = this;
        let sub_menu;
        let menus = menu_record.getMenus();
        for(let i=0;i<menus.length;i++){
            sub_menu = root_menu.addItem(menus[i].getName(), null, null, menu);
            this.generateGraphicalMenuInstanceStructure(sub_menu, menus[i], root_menu);
        }

        let items = menu_record.getItems();
        for(let i=0;i<items.length;i++) {
            root_menu.addItem(items[i].getText(), null, function(){self.modificationQuery(items[i].getKeyword(), items[i].getValue());}, menu);
        }
    }

    /**
     * Add an external data slot (workflow input or output). Note the inverted direction: an external
     * *input* of the workflow is stored as an *output* slot of the workflow block (it provides data to the
     * blocks inside) and vice versa.
     *
     * @param {string} inout - 'in' for an external input, 'out' for an external output
     * @param {string|null} name - slot name (a default is used when null)
     * @param {string} type - data type
     * @param {string} obj_type - DataID
     * @param {string} uid - slot UID ('' to generate a new one)
     * @returns {SlotExt|null} the created slot, or null for an invalid ``inout``
     */
    addExternalDataSlot(inout, name=null, type='None', obj_type='None', uid=''){
        let slot = null;
        if(inout === 'out') {
            if(name === null)
                name = 'external_output';
            slot = new SlotExt(this, 'in', name, name, type, true, obj_type, uid);
            this.addInputSlot(slot);
        }
        if(inout === 'in') {
            if(name === null)
                name = 'external_input';
            slot = new SlotExt(this, 'out', name, name, type, true, obj_type, uid);
            this.addOutputSlot(slot);
        }
        return slot;
    }

    myquery_proceed(action, p1=null, p2=null){
        myQuery_hide();
        this.editor.generateWorkflowHtml();
    }

    modificationQuery(keyword, value=null) {

        if(keyword === 'add_block')
            this.addBlockByName(value);
        if(keyword === 'delete_me') {
            this.deleteSelf();
        }
        if(keyword === 'move_me'){
            if(value === 'up')
                this.moveMeUp();
            if(value === 'down')
                this.moveMeDown();
        }
        if(keyword === 'add_external_slot'){
            let new_name;
            let slots = this.getSlots();
            let chosen = false;
            let sl_i = 0;
            while(chosen === false){
                sl_i++;
                new_name = 'ext_slot_' + sl_i;
                chosen = true;
                for(let i=0;i<slots.length;i++)
                    if(slots[i].name === new_name)
                        chosen = false;
            }
            this.addExternalDataSlot(value, new_name);
        }
        if(keyword === 'set_order'){
            this.arrangeChildren(value);
        }
        this.editor.generateWorkflowHtml();
    }

    getCodeName(){
        return this.code_name;
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        console.log('TODO Block.generateOutputDataSlotGetFunction');
        return "ToBeImplemented";
    }

    getOutputDataSlotGetFunctionOfLinkedDataSlot(slot, time=""){
        //todo check if slot is mine
        let connected_slot = slot.getLinkedDataSlot();
        return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot, time);

    }

    getInitCode(indent=0){
        let code = ["", "# __init__ code of "+this.code_name+" ("+this.name+")"];
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        let code = ["", "# initialization code of "+this.code_name+" ("+this.name+")"];
        return push_indents_before_each_line(code, indent);
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = ["", "# execution code of "+this.code_name+" ("+this.name+")"];
        return push_indents_before_each_line(code, indent);
    }

    getAllocationMetadata(indent=0){
        return [];
    }

    getBlocksRecursive(class_filter=null){
        let sub_blocks;
        let blocks = [];
        for (let i = 0; i < this.blocks.length; i++) {
            blocks.push(this.blocks[i]);
            extend_array(blocks, this.blocks[i].getBlocksRecursive());
        }
        if(class_filter==null)
            return blocks;
        else{
            sub_blocks = [];
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].constructor.name === class_filter.name)
                    sub_blocks.push(blocks[i]);
            }
            return sub_blocks;
        }
    }

    getBlocks(class_filter=null){
        let sub_blocks;
        if(class_filter==null)
            return this.blocks;
        else{
            sub_blocks = [];
            for (let i = 0; i < this.blocks.length; i++) {
                if (this.blocks[i].constructor.name === class_filter.name)
                    sub_blocks.push(this.blocks[i]);
            }
            return sub_blocks;
        }
    }

    addBlock(block){
        this.blocks.push(block);
    }

    addInputSlot(slot){
        this.input_slots.push(slot);
    }

    addOutputSlot(slot){
        this.output_slots.push(slot);
    }

    getSlots(type=''){
        if(type==='in')
            return this.input_slots;
        if(type==='out')
            return this.output_slots;
        return this.input_slots.concat(this.output_slots);
    }

    deleteSlot(slot){
        let slots = [];
        for (let i = 0; i < this.input_slots.length; i++)
            if(this.input_slots[i] !== slot)
                slots.push(this.input_slots[i]);
        this.input_slots = slots;
        slots = [];
        for (let i = 0; i < this.output_slots.length; i++)
            if(this.output_slots[i] !== slot)
                slots.push(this.output_slots[i]);
        this.output_slots = slots;
    }

    getSlotsRecursive(type=''){
        let slots = this.getSlots(type);
        for (let i = 0; i < this.blocks.length; i++)
            // extend_array(slots, this.blocks[i].getSlotsRecursive(type));
            slots = slots.concat(this.blocks[i].getSlotsRecursive(type));
        return slots;
    }

    removeBlockFromList(block){
        let new_block_list = [];
        for (let i = 0; i < this.blocks.length; i++) {
            if(this.blocks[i] !== block)
                new_block_list.push(this.blocks[i]);
        }
        this.blocks = new_block_list;
    }

    deleteLinkedDatalinksToChildSlots(){
        let dls_to_remove = [];
        let slots = this.getSlots();
        for(let i=0;i<slots.length;i++){
            for(let j=0;j<editor.datalinks.length;j++){
                if(editor.datalinks[j].slot1 === slots[i] || editor.datalinks[j].slot2 === slots[i])
                    dls_to_remove.push(editor.datalinks[j]);
            }
        }
        for(let i=0;i<dls_to_remove.length;i++) {
            editor.removeDatalink(dls_to_remove[i]);
        }
    }

    deleteSelf() {
        this.deleteLinkedDatalinksToChildSlots();

        for (let i = 0; i < this.blocks.length; i++) {
            this.blocks[i].deleteSelf();
        }

        this.parent_block.removeBlockFromList(this);
    }

    moveChildBlockUp(block){
        for (let i = 0; i < this.blocks.length; i++) {
            if(this.blocks[i] === block){
                if(i>0) {
                    let block_temp = this.blocks[i];
                    this.blocks[i] = this.blocks[i - 1];
                    this.blocks[i - 1] = block_temp;

                }
                break;
            }
        }
    }

    moveChildBlockDown(block){
        for (let i = 0; i < this.blocks.length; i++) {
            if(this.blocks[i] === block){
                if(i<this.blocks.length-1) {
                    let block_temp = this.blocks[i];
                    this.blocks[i] = this.blocks[i + 1];
                    this.blocks[i + 1] = block_temp;

                }
                break;
            }
        }
    }

    /**
     * Move the block (with its children) into another container block. The block becomes the last child of
     * the container, i.e., it is executed after the other children. Data links are kept.
     *
     * @param {Block} container - new parent: the workflow or a container block; it must not be the block itself
     *                            or one of its descendants
     * @returns {boolean} true when the block was moved
     */
    moveToContainer(container){
        if(container === null || !container.isContainer() || container === this ||
            container.getParentBlockChain().includes(this) || this.parent_block === null)
            return false;
        this.parent_block.removeBlockFromList(this);
        this.parent_block = container;
        container.addBlock(this);
        return true;
    }

    moveMeUp(){
        this.parent_block.moveChildBlockUp(this);
    }

    moveMeDown(){
        this.parent_block.moveChildBlockDown(this);
    }

    /**
     * Create a block of the given kind and append it as the last child of this block.
     *
     * @param {string} name - kind of the block, e.g., 'model', 'timeloop', 'property' (see the list below and
     *        the block palette, src/view/Palette.js)
     * @returns {Block|null} the new block, or null for an unknown kind
     */
    addBlockByName(name) {
        let block = null;

        if (name === "physicalquantity")
            block = new BlockPhysicalQuantity(this.editor, this, 0, 'none');
        if (name === "property")
            block = new BlockProperty(this.editor, this, '0.', 'mupif.DataID.PID_None', 'mupif.ValueType.Scalar', 'none');
        if (name === "timeloop")
            block = new BlockTimeloop(this.editor, this);
        if (name === "dowhile")
            block = new BlockDoWhile(this.editor, this);
        if (name === "model")
            block = new BlockModel(this.editor, this, {});
        if (name === "file")
            block = new BlockInputFile(this.editor, this, '');
        if (name === "value_comparison")
            block = new BlockValueComparison(this.editor, this);
        if (name === "property_to_quantity")
            block = new BlockPropertyToQuantity(this.editor, this);
        if (name === "quantity_to_property")
            block = new BlockQuantityToProperty(this.editor, this);
        if (name === "number_to_quantity")
            block = new BlockNumberToQuantity(this.editor, this);
        if (name === "number_to_property")
            block = new BlockNumberToProperty(this.editor, this);
        if (name === "datalist_length")
            block = new BlockDataListLength(this.editor, this);
        if (name === "allocate_model_at_runtime")
            block = new BlockAllocateModelAtRuntime(this.editor, this);
        if (name === "run_in_background")
            block = new BlockRunInBackground(this.editor, this);
        if (name === "variable")
            block = new BlockVariable(this.editor, this);
        if (name === "get_item_from_datalist")
            block = new BlockGetItemFromDataList(this.editor, this);
        if (name === "wait_for_background_processes")
            block = new BlockWaitForBackgroundProcesses(this.editor, this);


        if (block !== null) {
            this.addBlock(block);
        }
        return block;
    }

    generateCodeName(all_blocks, base_name='block_'){
        let i = 0;
        let new_name;
        let found = false;
        let duplicite;
        while(!found) {
            i += 1;
            new_name = base_name + i;
            duplicite = false;

            for(let j=0;j<all_blocks.length;j++)
                if(all_blocks[j].code_name === new_name)
                    duplicite = true;

            if(!duplicite) {
                found = true;
                this.code_name = new_name;
            }
        }
    }

    getDataSlotWithName(name) {
        let slots = this.getSlots();
        for (let i = 0; i < slots.length; i++)
            if (slots[i].name === name)
                return slots[i];
        return null;
    }

    getUID(){
        return this.getCodeName();
    }

    getClassName(){
        return 'Block';
    }

    /**
     * Serialize the block (without its children) into a JSON-compatible record.
     *
     * The optional ``layout`` entry (see {@link BlockLayout}) is written only when the block has been placed
     * on the canvas, so that projects created without the graphical editor keep their original form.
     *
     * @returns {Object} JSON record of the block
     */
    getDictForJSON(){
        let slots;
        let slot_in_array = [];
        let slot_out_array = [];

        slots = this.getSlots('in');
        for (let i = 0; i < slots.length; i++)
            slot_in_array.push(slots[i].getUID());

        slots = this.getSlots('out');
        for (let i = 0; i < slots.length; i++)
            slot_out_array.push(slots[i].getUID());

        let dict = {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': this.parent_block.getUID(),
            'slot_in_uids': slot_in_array,
            'slot_out_uids': slot_out_array

        };
        if(this.layout !== null)
            dict['layout'] = Object.assign({}, this.layout);
        return dict;
    }

    // ##############################################################
    // Presentation, used by the canvas view (src/view/Shapes.js and
    // src/view/CanvasView.js); subclasses override the first three.
    // ##############################################################

    /**
     * @returns {string} CSS class(es) of the block kind; the canvas derives the fill color from it
     *                   (BLOCK_COLORS in src/view/Shapes.js)
     */
    getBlockHtmlClass(){
        return 'we_block';
    }

    /** @returns {string} human readable name of the block kind, shown in the block header */
    getBlockHtmlName(){
        return 'Block';
    }

    /**
     * @returns {string} parameters of the block as HTML (lines separated by ``<br>``), shown below the header
     */
    getBlockHtml_params(){
        return '';
    }

    /** @returns {string} HTML of the items of the block's context menu (see {@link Block#defineMenu}) */
    getMenuHtml(){
        this.defineMenu();
        return this.generateMenuHtml(this.menu_record, 1);
    }

    generateMenuHtml(menu_record, level){
        let html = '';

        let menus = menu_record.getMenus();
        for(let i=0;i<menus.length;i++){
            html += '<div class="block_menu_item">'+menus[i].getName()+'&nbsp;&#129078;';
            html += '<div class="block_menu_submenu">';
            html += '<div class="block_menu block_menu_'+level+'">';
            html += this.generateMenuHtml(menus[i], level+1);
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }

        let items = menu_record.getItems();
        for(let i=0;i<items.length;i++) {
            html += '<div class="block_menu_item" onclick="editor.getBlockByUID(\''+this.getUID()+'\').modificationQuery(\''+items[i].getKeyword()+'\', \''+items[i].getValue()+'\');">'+items[i].getText()+'</div>';
        }

        return html;
    }

}