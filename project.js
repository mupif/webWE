
let editor;// The Workflow Editor instance

let example_id = 0;// Global defining optional example

class Block{
    constructor(editor, parent_block){
        this.editor = editor;
        this.parent_block = parent_block;
        this.blocks = [];
        this.input_slots = [];
        this.output_slots = [];
        this.name = 'Block';

        this.code_name = "";

        this.menu_items = [];
        this.menu_record = new VisualMenu();

        this.child_block_sort = 'vertical';

        this.defines_timestep = false;
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

    addOrderingMenuItems(){
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_order', 'horizontal', 'Horizontally'), 'Order&nbsp;child&nbsp;blocks');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_order', 'vertical', 'Vertically'), 'Order&nbsp;child&nbsp;blocks');
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

    addExternalDataSlot(inout, name=null, type='None', obj_type='None', uid=''){
        if(inout === 'out') {
            if(name === null)
                name = 'external_output';
            this.addInputSlot(new SlotExt(this, 'in', name, name, type, true, obj_type, uid));
        }
        if(inout === 'in') {
            if(name === null)
                name = 'external_input';
            this.addOutputSlot(new SlotExt(this, 'out', name, name, type, true, obj_type, uid));
        }

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
            if(value === 'horizontal')
                this.child_block_sort = value;
            if(value === 'vertical')
                this.child_block_sort = value;
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

    moveMeUp(){
        this.parent_block.moveChildBlockUp(this);
    }

    moveMeDown(){
        this.parent_block.moveChildBlockDown(this);
    }

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

        return {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': this.parent_block.getUID(),
            'slot_in_uids': slot_in_array,
            'slot_out_uids': slot_out_array

        };
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block';
    }

    getBlockHtmlName(){
        return 'Block';
    }

    getBlockHtmlContent(){
        let html = '';
        html += this.getBlockHtml_header();
        html += this.getBlockHtml_params();
        html += '<div class="block_over_content">';
        html += '<div>';
        html += this.getBlockHtml_slots_input();
        html += '</div><div>';
        html += this.getBlockHtml_slots_output();
        html += '</div>';
        html += '</div>';
        html += this.getBlockHtml_content();
        html += this.getBlockHtml_footer();
        html += this.getBlockHtml_menu();
        return html;
    }

    getBlockHtml(){
        let html = '';
        html += '<div id="blockdiv_'+this.getUID()+'" class="'+this.getBlockHtmlClass()+'" onmousedown="anyClick(event, \''+this.getUID()+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;" oncontextmenu="return false;">';

        html += this.getBlockHtmlContent();

        html += '</div>';
        return html;
    }

    getBlockHtml_header(){
        return '<div class="bl_header">'+this.getBlockHtmlName()+'</div>';
    }

    getBlockHtml_params(){
        return '';
    }

    getBlockHtml_slots_input(){
        let html = '<div class="bl_slots_inputs">';
        let slots = this.getSlots('in');
        let n_slots = slots.length;
        for(let i=0;i<n_slots;i++)
            html += slots[i].getSlotHtml();
        html += '</div>';
        return html;
    }

    getBlockHtml_slots_output(){
        let html = '<div class="bl_slots_inputs">';
        let slots = this.getSlots('out');
        let n_slots = slots.length;
        for(let i=0;i<n_slots;i++)
            html += slots[i].getSlotHtml();
        html += '</div>';
        return html;
    }

    getBlockHtml_content(){
        let n_blocks = this.blocks.length;
        let html = '';
        if(n_blocks > 0) {
            if (this.child_block_sort === 'vertical')
                html += '<div class="bl_content bl_content_vertical">';
            else
                html += '<div class="bl_content bl_content_horizontal">';

            for (let i = 0; i < n_blocks; i++) {
                html += this.blocks[i].getBlockHtml();
            }
            html += '</div>';
        }
        return html;
    }

    getBlockHtml_footer(){
        return '';
    }

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
            html += '<div class="block_menu_item" onclick="editor.getBlockByUID(\''+this.getUID()+'\').modificationQuery(\''+items[i].getKeyword()+'\', \''+items[i].getValue()+'\');" onmousedown="editor.one_elem_check_disabling_propagation=true;" onmouseup="editor.one_elem_check_disabling_propagation=false;">'+items[i].getText()+'</div>';
        }

        return html;
    }

    getBlockHtml_menu(){
        let html = '<div class="block_menu_base" id="block_menu_base_'+this.getUID()+'">';
        html += '<div class="block_menu block_menu_0" style="display:block;">';
        html += this.getMenuHtml();
        html += '</div>';
        html += '</div>';
        return html;
    }

    getBlockDiv(){
        return document.getElementById('blockdiv_'+this.getUID());
    }

    getBlockHeaderDiv(){
        let divs = document.getElementById('blockdiv_'+this.getUID()).getElementsByClassName('bl_header');
        if(divs.length)
            return divs[0];
    }

    getBlockMenuDiv(){
        return document.getElementById('block_menu_base_'+this.getUID());
    }

}

class BlockDoWhile extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = 'DoWhile';

        this.addInputSlot(new Slot(this, 'in', 'condition', 'condition', 'mupif.Property', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'counter', 'counter', 'number'));
    }

    generateCodeName(all_blocks, base_name='dowhile_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getCondition(time){
        let connected_slot = this.getDataSlotWithName("condition").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot, time);
        return 'False';
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        if(slot.name === 'counter') {
            return this.code_name + "_counter";
        }
        return 'None'
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_compute = this.code_name + "_compute";
        let var_counter = this.code_name + "_counter";
        
        code.push(var_counter + " = 0");
        
        let ts = this.getTimestepVariableNameFromSelfOrParent();
        if(timestep !== "")
            ts = timestep;
        let ti;
        if(ts !== "None")
            ti = ts + ".getTime()";
        else
            ti = "0*mupif.U.s";
        code.push(var_compute + " = True");
        
        code.push("while " + var_compute + ":");

        code.push("\t" + var_counter + " += 1")

        code.push("\t" + var_compute + " = " + this.getCondition(ti));
        code.push("\tif " + var_compute + ":")

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            code = code.concat(blocks[i].getExecutionCode(2, timestep, solvefunc));
        }

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockDoWhile';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_default';
    }

    getBlockHtmlName(){
        return 'Do While';
    }

}

class BlockInputFile extends Block{
    constructor(editor, parent_block, filename=""){
        super(editor, parent_block);
        this.filename = filename;
        this.name = 'InputFile';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'filename = '+this.filename, 'mupif.PyroFile', false, 'None', '', '', '', 'none'));
    }

    generateCodeName(all_blocks, base_name='input_file_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.PyroFile(filename='"+this.filename+"', mode='rb')");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        //return [];
        let code = super.getInitializationCode();
        code.push("self.daemon.register(self."+this.code_name+")");
        return push_indents_before_each_line(code, indent);
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_file', '', 'Input&nbsp;file'), 'Set');
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_file') {
            this.filename = document.getElementById('myQuery_temp_val').value;
            console.log('Value set to "'+this.filename+'"');
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        if(keyword === 'set_file'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Input file:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.filename+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        super.modificationQuery(keyword, value);
    }

    getClassName() {
        return 'BlockInputFile';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['filename'] = this.filename;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_input_file';
    }

    getBlockHtmlName(){
        return 'Input File';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Filename = <b>\'' + this.filename + '\'</b>';

        html += '</div>';
        return html;
    }

}

class BlockModel extends Block {
    constructor(editor, parent_block, md = {}, input_file_directory="") {
        super(editor, parent_block);
        // this.md = md;

        this.input_file_directory = input_file_directory;

        this.exec_type = "";
        this.exec_settings_jobmanagername = "";

        // this.loadDataFromMetadata();
        this.setMetadata(md);

        if ('Inputs' in this.md && 'Outputs' in this.md)
            this.constructSlots();
    }

    loadDataFromMetadata() {
        // backwards compatibitlity ?
        // if ('ClassName' in this.md) {
        //     this.name = this.md['ClassName'];
        //     this.model_name = this.md['ClassName'];
        // }
        // if ('ModuleName' in this.md)
        //     this.model_module = this.md['ModuleName'];

        if ('Name' in this.md)
            this.name = this.md['Name'];
        
        this.exec_type = 'Local';
        if ('Execution_settings' in this.md) {
            if ('Type' in this.md['Execution_settings'])
                if (this.md['Execution_settings']['Type'] === 'Distributed')
                    this.exec_type = this.md['Execution_settings']['Type'];
            if ('jobManName' in this.md['Execution_settings'])
                this.exec_settings_jobmanagername = this.md['Execution_settings']['jobManName'];
            if ('Module' in this.md['Execution_settings'])
                this.model_module = this.md['Execution_settings']['Module'];
            if ('Class' in this.md['Execution_settings'])
                this.model_name = this.md['Execution_settings']['Class'];
        }
    }

    constructSlots() {
        this.input_slots = [];
        this.output_slots = [];
        let md = this.md;
        let name;
        let objid;
        let vt;
        for (let i = 0; i < md['Inputs'].length; i++) {
            objid = [''];
            vt = '';
            if ('ValueType' in md['Inputs'][i])
                vt = md['Inputs'][i]['ValueType'];
            if ('Obj_ID' in md['Inputs'][i]) {
                if (typeof md['Inputs'][i]['Obj_ID'] == "string"){
                    objid = [md['Inputs'][i]['Obj_ID']];
                } else if (typeof md['Inputs'][i]['Obj_ID'] == "object"){
                    if (md['Inputs'][i]['Obj_ID'].length === 0)
                        objid = [''];
                    else
                        objid = md['Inputs'][i]['Obj_ID'];
                }
            }
            for (let ii = 0; ii < objid.length; ii++) {
                name = md['Inputs'][i]['Name'];
                if (objid[ii] !== '')
                    name += ' [' + objid[ii] + ']';
                this.addInputSlot(new Slot(this, 'in', name, name, md['Inputs'][i]['Type'], md['Inputs'][i]['Required'], md['Inputs'][i]['Type_ID'], objid[ii], '', md['Inputs'][i]['Set_at'], md['Inputs'][i]['Units'], vt));
            }
        }

        for (let i = 0; i < md['Outputs'].length; i++) {
            objid = [''];
            vt = '';
            if ('ValueType' in md['Outputs'][i])
                vt = md['Outputs'][i]['ValueType'];
            if ('Obj_ID' in md['Outputs'][i]) {
                if (typeof md['Outputs'][i]['Obj_ID'] == "string"){
                    objid = [md['Outputs'][i]['Obj_ID']];
                } else if (typeof md['Outputs'][i]['Obj_ID'] == "object"){
                    if (md['Outputs'][i]['Obj_ID'].length === 0)
                        objid = [''];
                    else
                        objid = md['Outputs'][i]['Obj_ID'];
                }
            }
            for (let ii = 0; ii < objid.length; ii++) {
                name = md['Outputs'][i]['Name'];
                if (objid[ii] !== '')
                    name += ' [' + objid[ii] + ']';
                this.addOutputSlot(new Slot(this, 'out', name, name, md['Outputs'][i]['Type'], md['Outputs'][i]['Required'], md['Outputs'][i]['Type_ID'], objid[ii], '', '', md['Outputs'][i]['Units'], vt));
            }
        }
    }

    setMetadata(md) {
        this.md = md;
        this.loadDataFromMetadata();
    }

    setMetadataAndUpdate(md) {
        this.deleteLinkedDatalinksToChildSlots();
        this.setMetadata(md);
        this.constructSlots();
    }

    generateCodeName(all_blocks, base_name = 'model_') {
        super.generateCodeName(all_blocks, base_name);
    }

    /** @returns {BlockAllocateModelAtRuntime} */
    getParentAllocateModelAtRuntimeBlock(){
        let res = null;
        let parent_blocks = this.getParentBlockChain();
        parent_blocks.forEach(b => {
            if(b.getClassName() === 'BlockAllocateModelAtRuntime'){res = b;}
        });
        return res;
    }

    /** @returns {BlockRunInBackground} */
    getParentRunInBackgroundBlock(){
        let res = null;
        let parent_blocks = this.getParentBlockChain();
        parent_blocks.forEach(b => {
            if(b.getClassName() === 'BlockRunInBackground'){res = b;}
        });
        return res;
    }

    getInitCode(indent = 0) {
        return [];
    }

    getInitializationCode(indent = 0, metaDataStr = "{}") {
        return [];
    }

    getExecutionCode(indent = 0, timestep = "", solvefunc=false) {
        if(timestep === "")
            timestep = this.getTimestepVariableNameFromSelfOrParent();

        let code = super.getExecutionCode();
        
        let model_name = "'" + this.code_name + "'";
        
        let parent_allocate_at_runtime_block = this.getParentAllocateModelAtRuntimeBlock();
        if(parent_allocate_at_runtime_block !== null){
            model_name = "model_name";
            code.push(model_name + " = self._generateNewModelName(base='" + this.code_name + "')");
            code.push("self._allocateModelByName(name='" + this.code_name + "', name_new=" + model_name + ")");
            code.push("self.getModel(" + model_name + ").initialize(metadata=self._getInitializationMetadata())");
            code.push(parent_allocate_at_runtime_block.getModelNamesVariable() + ".append(" + model_name + ")");
        }

        let run_in_background = "False"
        let parent_run_in_background_block = this.getParentRunInBackgroundBlock();
        if(parent_run_in_background_block !== null){
            run_in_background = "True"
            code.push(parent_run_in_background_block.getModelNamesVariable() + ".append(" + model_name + ")");
        }

        if(timestep === "None" && solvefunc) {
            code.push(this.code_name + "_virtual_timestep = mupif.timestep.TimeStep(time=0*mupif.Q.s, dt=1*mupif.Q.s, targetTime=1*mupif.Q.s)");
            timestep = this.code_name + "_virtual_timestep"
        }
        let timestep_time = timestep + ".getTime()";

        let linked_slot;
        let obj_id;
        for (let i = 0; i < this.input_slots.length; i++) {
            linked_slot = this.input_slots[i].getLinkedDataSlot();
            if (linked_slot != null) {
                if(this.input_slots[i].set_at !== 'initialization') {
                    obj_id = this.input_slots[i].obj_id;
                    if (typeof obj_id === 'string')
                        obj_id = "'" + obj_id + "'";
                    code.push("self.getModel(" + model_name + ").set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
                }
            }
        }

        code.push("self.getModel(" + model_name + ").solveStep(tstep=" + timestep + ", runInBackground=" + run_in_background + ")");

        return push_indents_before_each_line(code, indent);
    }

    getAllocationMetadata(indent=0){
        let instantiate = this.getParentAllocateModelAtRuntimeBlock() === null;
        let code;
        if(this.exec_type === "Distributed") {
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Jobmanager\": \"" + this.exec_settings_jobmanagername + "\",",
                "\t\"Instantiate\": " + (instantiate ? "True" : "False") + "",
                "}"
            ];
        }else{
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Module\": \"" + this.model_module + "\",",
                "\t\"Class\": \"" + this.model_name + "\",",
                "\t\"Instantiate\": " + (instantiate ? "True" : "False") + "",
                "}"
            ];
        }
        return push_indents_before_each_line(code, indent);
    }

    generateOutputDataSlotGetFunction(slot, time = "None") {
        //todo check if slot is mine
        // if (slot in self.getSlots(DataSlot.OutputDataSlot)) {
        if (true) {
            let obj_id;
            if (typeof slot.obj_id === 'string')
                obj_id = "'" + slot.obj_id + "'";
            else
                obj_id = slot.obj_id;
            return "self.getModel('" + this.code_name + "').get(" + slot.getDataID() + ", " + time + ", " + obj_id + ")";
        }
        return "None";
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_work_dir') {
            this.input_file_directory = document.getElementById('myQuery_temp_val').value;
            console.log('Working directory was set to "'+this.input_file_directory+'"');
        }
        if(action==='set_md') {
            let md_list = this.editor.list_of_model_metadata;
            for (let i = 0; i < md_list.length; i++) {
                if (p1 === md_list[i]['ID']) {
                    this.setMetadataAndUpdate(md_list[i]);
                }
            }
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        // if (keyword === 'set_metadata') {
        //     let md_list = this.editor.list_of_model_metadata;
        //     for (let i = 0; i < md_list.length; i++) {
        //         if (value === md_list[i]['ID']) {
        //             this.setMetadataAndUpdate(md_list[i]);
        //         }
        //     }
        // }
        if (keyword === 'set_work_dir') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Working directory:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.input_file_directory+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
        if (keyword === 'set_md') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Metadata:</b>&nbsp;';
            let md_list = this.editor.list_of_model_metadata;
            for (let i = 0; i < md_list.length; i++)
                q_html += '<br><button style="margin-top:2px;" onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\', \''+md_list[i]['ID']+'\');">'+md_list[i]['Name']+'</button>';

            q_html += '<br><button style="margin-top:2px;color:red;" onclick="myQuery_hide();">Cancel</button>';

            myQuery_show(q_html);
        }


        super.modificationQuery(keyword, value);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_input_file', '', 'Input&nbsp;file'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_work_dir', '', 'Working&nbsp;directory'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_md', '', 'Metadata'), 'Set');
        // let md_list = this.editor.list_of_model_metadata;
        // for (let i = 0; i < md_list.length; i++)
        //     this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_metadata', md_list[i]['ID'], md_list[i]['Name']), 'Set.MD');
    }

    getClassName() {
        return 'BlockModel';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['metadata'] = this.md;
        dict['model_working_directory'] = this.input_file_directory;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_model';
    }

    getBlockHtmlName(){
        return 'Model';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Name = <b>\'' + this.md['Name'] + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.md['ID'] + '\'</b>';

        if(this.exec_type !== "Distributed") {
            html += '<br>';
            html += 'Working directory = <b>\'' + this.input_file_directory + '\'</b>';
        }
        html += '</div>';
        return html;
    }

}

class BlockPhysicalQuantity extends Block{
    constructor(editor, parent_block, value, units){
        super(editor, parent_block);
        this.value = value;
        this.units = units;
        this.name = 'PhysicalQuantity';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.PhysicalQuantity', false, 'mupif.DataID.ID_None', '', '', '', units, 'Scalar'));
    }

    generateCodeName(all_blocks, base_name='constant_physical_quantity_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = "+this.value+"*mupif.U."+this.units+"");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_value', '', 'Value'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_units', '', 'Units'), 'Set');
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_value') {
            this.value = document.getElementById('myQuery_temp_val').value;
            console.log('Value set to "'+this.value+'"');
        }
        if(action==='set_units') {
            this.units = document.getElementById('myQuery_temp_val').value;
            console.log('Units set to "'+this.units+'"');
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        if(keyword === 'set_value'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Value:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.value+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
        if(keyword === 'set_units'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Choose Units:</b>&nbsp;';
            q_html += '<select id="myQuery_temp_val">';
            for(let i=0;i<mupif_Units.length;i++) {
                q_html += '<option value="'+mupif_Units[i]+'"';
                if(this.units === mupif_Units[i])
                    q_html += ' selected';
                q_html += '>'+mupif_Units[i]+'</option>';
            }
            q_html += '</select>';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }


        super.modificationQuery(keyword, value);
    }

    getClassName() {
        return 'BlockConstPhysicalQuantity';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['value'] = this.value;
        dict['units'] = this.units;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Quantity';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>' + this.value + '</b>';
        html += '<br>';
        html += 'Units = <b>' + this.units + '</b>';

        html += '</div>';
        return html;
    }

}

class BlockProperty extends Block{
    constructor(editor, parent_block, value, property_id, value_type, units){
        super(editor, parent_block);
        this.value = value;
        this.property_id = property_id;
        this.value_type = value_type;
        this.units = units;
        this.name = 'Property';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.Property', false, this.property_id, '', '', '', units, this.value_type));
    }

    generateCodeName(all_blocks, base_name='constant_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.property.ConstantProperty(value="+this.value+", propID="+this.property_id+", valueType="+this.value_type+", unit=mupif.U."+this.units+", time=None)");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_value', '', 'Value'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_units', '', 'Units'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_property_id', '', 'Property&nbsp;ID'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_value_type', '', 'Value&nbsp;type'), 'Set');
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_value') {
            this.value = document.getElementById('myQuery_temp_val').value;
            console.log('Value set to "'+this.value+'"');
        }
        if(action==='set_units') {
            this.units = document.getElementById('myQuery_temp_val').value;
            console.log('Units set to "'+this.units+'"');
        }
        if(action==='set_property_id') {
            this.property_id = 'mupif.DataID.'+document.getElementById('myQuery_temp_val').value;
            console.log('Property ID set to "'+this.property_id+'"');
        }
        if(action==='set_value_type') {
            this.value_type = 'mupif.ValueType.'+document.getElementById('myQuery_temp_val').value;
            console.log('Value type set to "'+this.value_type+'"');
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        if(keyword === 'set_value'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Value:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.value+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        if(keyword === 'set_units'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Choose Units:</b>&nbsp;';
            q_html += '<select id="myQuery_temp_val">';
            for(let i=0;i<mupif_Units.length;i++) {
                q_html += '<option value="'+mupif_Units[i]+'"';
                if(this.units === mupif_Units[i])
                    q_html += ' selected';
                q_html += '>'+mupif_Units[i]+'</option>';
            }
            q_html += '</select>';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        if(keyword === 'set_property_id'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Choose PropertyID:</b>&nbsp;';
            q_html += '<select id="myQuery_temp_val">';
            for(let i=0;i<mupif_DataID.length;i++) {
                q_html += '<option value="'+mupif_DataID[i]+'"';
                if(this.property_id === 'mupif.DataID.'+mupif_DataID[i])
                    q_html += ' selected';
                q_html += '>'+mupif_DataID[i]+'</option>';
            }
            q_html += '</select>';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        if(keyword === 'set_value_type'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Choose ValueType:</b>&nbsp;';
            q_html += '<select id="myQuery_temp_val">';
            for(let i=0;i<mupif_ValueType.length;i++) {
                q_html += '<option value="'+mupif_ValueType[i]+'"';
                if(this.value_type === 'mupif.ValueType.'+mupif_ValueType[i])
                    q_html += ' selected';
                q_html += '>'+mupif_ValueType[i]+'</option>';
            }
            q_html += '</select>';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        super.modificationQuery(keyword, value);
    }

    getClassName() {
        return 'BlockConstProperty';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['value'] = this.value;
        dict['units'] = this.units;
        dict['propID'] = this.property_id;
        dict['valueType'] = this.value_type;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Property';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>' + this.value + '</b>';
        html += '<br>';
        html += 'Units = <b>' + this.units + '</b>';
        html += '<br>';
        html += 'ValueType = <b>' + this.value_type.replace('mupif.ValueType.', '') + '</b>';
        html += '<br>';
        html += 'PropertyID = <b>' + this.property_id.replace('mupif.DataID.', '') + '</b>';

        html += '</div>';
        return html;
    }

}

class BlockTimeloop extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');
        this.defines_timestep = true;

        this.addInputSlot(new Slot(this, 'in', 'start_time', 'start_time', 'mupif.PhysicalQuantity', false, null, '', '', '', 'none', 'Scalar'));
        this.addInputSlot(new Slot(this, 'in', 'target_time', 'target_time', 'mupif.PhysicalQuantity', false, null, '', '', '', 'none', 'Scalar'));
        this.addInputSlot(new Slot(this, 'in', 'max_dt', 'max_dt', 'mupif.PhysicalQuantity', true, null, '', '', '', 'none', 'Scalar'));
    }

    generateCodeName(all_blocks, base_name='timeloop_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getStartTime(){
        let connected_slot = this.getDataSlotWithName("start_time").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getTargetTime(){
        let connected_slot = this.getDataSlotWithName("target_time").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getMaxDt(){
        let connected_slot = this.getDataSlotWithName("max_dt").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_time = this.code_name + "_time";
        let var_target_time = this.code_name + "_target_time";
        let var_dt = this.code_name + "_dt";
        let var_compute = this.code_name + "_compute";
        let var_time_step = this.code_name + "_time_step";
        let var_time_step_number = this.code_name + "_time_step_number";

        code.push(var_time + " = " + this.getStartTime());
        code.push(var_target_time + " = " + this.getTargetTime());

        code.push(var_compute + " = True");
        code.push(var_time_step_number + " = 0");

        code.push("while " + var_compute + ":");
        let while_code = [];

        code.push("\t" + var_time_step_number + " += 1");

        let dt_code = "\t" + var_dt + " = min([";
        let first = true;

        if(this.getMaxDt()) {
            dt_code += this.getMaxDt();
            first = false;
        }

        let model_blocks = this.getBlocks(BlockModel);
        for(let i=0;i<model_blocks.length;i++) {
            if (!first)
                dt_code += ", ";
            dt_code += "self.getModel('" + model_blocks[i].code_name + "').getCriticalTimeStep()";
            first = false;
        }
        dt_code += "])";

        while_code.push("");
        while_code.push(dt_code);
        while_code.push("\t" + var_time + " = min(" + var_time + ".inUnitsOf('s').getValue()+" + var_dt + ".inUnitsOf('s').getValue(), " + var_target_time + ".inUnitsOf('s').getValue())*mupif.U.s");
        while_code.push("");

        while_code.push("\tif " + var_time + ".inUnitsOf('s').getValue() + 1.e-6 > " + var_target_time + ".inUnitsOf('s').getValue():");
        while_code.push("\t\t" + var_compute + " = False");

        while_code.push("\t");
        while_code.push("\t" + var_time_step + " = mupif.timestep.TimeStep(time=" + var_time + ", dt=" + var_dt + ", targetTime=" + var_target_time + ", number=" + var_time_step_number + ")");
        // while_code.push("\t");

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            while_code = while_code.concat(blocks[i].getExecutionCode(1, var_time_step, solvefunc));
        }

        code = code.concat(while_code);
        code.push("");

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockTimeloop';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['child_block_sort'] = this.child_block_sort;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_default';
    }

    getBlockHtmlName(){
        return 'Time Loop';
    }

}

class BlockWorkflow extends Block{
    constructor(editor, parent_block){
        super(editor, null);
        this.name = this.getClassName().replace('Block', '');

        this.project_name = 'My unnamed project';
        this.project_classname = 'MyUnnamedProject';
        this.project_modulename = 'MyModuleName';
        this.project_id = 'my_unnamed_project_01';


        this.exec_type = "Local";
        this.exec_settings_jobmanagername = "";

        this.project_nshost = '';// nshost is set by environment variables by default
        this.project_nsport = '';// nsport is set by environment variables by default

        this.jobman_name = '';
        
        this.script_name_base = '';
    }

    /**
     * 
     * @param inout
     * @returns {Slot[]} */
    getAllExternalDataSlots(inout){
        return this.getSlots(inout);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return slot.getCodeRepresentation();
    }

    canGenerateCode(type){
        if(type === 'exec'){
            let result = true;
            if(this.getSlots().length) {
                result = false;
                console.log('Execution code cannot be generated with external inputs.');
                if(this.editor.visual)
                    myQuery_show_error('Execution code cannot be generated with external inputs.');
            }
            let blocks = this.getBlocksRecursive(BlockTimeloop);
            if(!blocks.length) {
                result = false;
                console.log('Execution code cannot be generated without a Timeloop or another block defining a timestep.');
                if(this.editor.visual)
                    myQuery_show_error('Execution code cannot be generated without a Timeloop or another block defining a timestep.');
            }
            return result;
        }
        if(type === 'class'){
            return true;
        }
        if(type === 'server'){
            return true;
        }
        console.log('Type of code is not valid!');
        return false;
    }

    generateAllElementCodeNames(){
        this.code_name = 'workflow';
        let blocks = this.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++)
            blocks[i].code_name = "";
        for(let i=0;i<blocks.length;i++)
            blocks[i].generateCodeName(blocks);
        let slots = this.getSlotsRecursive();
        for(let i=0;i<slots.length;i++)
            slots[i].code_name = '';
        let slot_code_id = 0;
        for(let i=0;i<slots.length;i++)
            if(!slots[i].external) {
                slot_code_id += 1;
                slots[i].code_name = 'slot_' + slot_code_id;
            }
        slots = this.getAllExternalDataSlots('in');
        for(let i=0;i<slots.length;i++)
            slots[i].code_name = 'external_output_'+(i+1);
        slots = this.getAllExternalDataSlots('out');
        for(let i=0;i<slots.length;i++)
            slots[i].code_name = 'external_input_'+(i+1);
    }

    generateCodeForServer(){
        console.log('Generating Python code for server.');
        if(this.canGenerateCode('server')) {
            let code = ["import mupif", "import copy"];
            code.push("import "+this.script_name_base);
            code.push("");
            code.push("if __name__ == '__main__':");
            code.push("\t# code to run the jobmanager server");
            code.push("");
            let conn_info = "";
            if(this.project_nshost && this.project_nsport)
                conn_info = "nshost='" + this.project_nshost + "', nsport=" + this.project_nsport + "";
            code.push("\tns = mupif.pyroutil.connectNameserver(" + conn_info + ")");
            code.push("");
            code.push("\tjobMan = mupif.SimpleJobManager(");
            code.push("\t\tns=ns,");
            code.push("\t\tappClass="+this.script_name_base+"."+this.project_classname+",");
            code.push("\t\tappName='"+this.editor.getJobmanName()+"',");
            code.push("\t\tjobManWorkDir='.',");
            code.push("\t\tmaxJobs=10");
            code.push("\t).runServer()");
            code.push("");

            return replace_tabs_with_spaces_for_each_line(code);
        }
        return '';
    }
    
    generateMetadata(class_code){
        if(this.canGenerateCode(class_code ? 'class' : 'exec')) {

            this.generateAllElementCodeNames();

            let all_model_blocks = this.getBlocksRecursive(BlockModel);
            let model;

            let code = [];

            // begin
            code.push("\t\t\t\"ClassName\": \"" + this.project_classname + "\",");
            code.push("\t\t\t\"ModuleName\": \"" + this.project_modulename + "\",");
            code.push("\t\t\t\"Name\": \"" + this.project_name + "\",");
            code.push("\t\t\t\"ID\": \"" + this.project_id + "\",");
            code.push("\t\t\t\"Description\": \"\",");

            if (class_code) {
                code.push("\t\t\t\"Execution_settings\": {");
                code.push("\t\t\t\t\"Type\": \"" + this.exec_type + "\"");
                if (this.exec_type === 'Distributed') {
                    code = addCommaToLastLine(code);
                    code.push("\t\t\t\t\"jobManName\": \"" + this.jobman_name + "\"");
                }
                code.push("\t\t\t},");
            }

            let params;
            let n_slots_printed;
            n_slots_printed = 0;
            code.push("\t\t\t\"Inputs\": [");
            this.getAllExternalDataSlots("out").forEach(s => {
                if (s.connected()) {
                    if (n_slots_printed)
                        code = addCommaToLastLine(code);
                    params = "\"Name\": \"" + s.getName() + "\", \"Type\": \"" + s.getLinkedDataSlot().getDataType() + "\", " +
                        "\"Required\": True, \"description\": \"\", " +
                        "\"Type_ID\": \"" + s.getLinkedDataSlot().getDataID() + "\", " +
                        "\"Obj_ID\": \"" + s.getName() + "\", " +
                        "\"Units\": \"" + s.getLinkedDataSlot().getUnits() + "\", " +
                        "\"Set_at\": \""+(s.getLinkedDataSlot().getSetAt() === 'initialization' ? 'initialization' : 'timestep')+"\"";
                    if(s.getLinkedDataSlot().getDataType() === 'mupif.Property' || s.getLinkedDataSlot().getDataType() === 'mupif.Function')
                        params += ', "ValueType": "' + s.getLinkedDataSlot().getValueType() + '"';
                    code.push("\t\t\t\t{" + params + "}");
                    n_slots_printed += 1;
                }
            })
            code.push("\t\t\t],");

            n_slots_printed = 0;
            code.push("\t\t\t\"Outputs\": [");
            this.getAllExternalDataSlots("in").forEach(s => {
                if (s.connected()) {
                    if (n_slots_printed)
                        code = addCommaToLastLine(code);
                    params = "\"Name\": \"" + s.getName() + "\", \"Type\": \"" + s.getLinkedDataSlot().getDataType() + "\", " +
                        "\"description\": \"\", " +
                        "\"Type_ID\": \"" + s.getLinkedDataSlot().getDataID() + "\", " +
                        "\"Obj_ID\": \"" + s.getName() + "\", " +
                        "\"Units\": \"" + s.getLinkedDataSlot().getUnits() + "\"";
                    if(s.getLinkedDataSlot().getDataType() === 'mupif.Property' || s.getLinkedDataSlot().getDataType() === 'mupif.Function' || s.getLinkedDataSlot().getDataType() === 'mupif.String')
                        params += ', "ValueType": "' + s.getLinkedDataSlot().getValueType() + '"';
                    code.push("\t\t\t\t{" + params + "}");
                    n_slots_printed += 1;
                }
            })
            code.push("\t\t\t],");

            code.push("\t\t\t\"Models\": [");
            for (let i = 0; i < all_model_blocks.length; i++) {
                if (i)
                    code = addCommaToLastLine(code);
                model = all_model_blocks[i];
                extend_array(code, all_model_blocks[i].getAllocationMetadata(4));
            }
            code.push("\t\t\t]");

            // end

            return code;
        }
        return [];
    }

    generateMetadataJson(){
        let code = ["{"];
        extend_array(code, replace_tabs_with_spaces_for_each_line(this.generateMetadata(true)));
        code.push("}");
        return code;
    }
    
    generateCode(class_code){
        
        console.log('Generating Python code.');
        if(this.canGenerateCode(class_code ? 'class' : 'exec')) {

            this.generateAllElementCodeNames();

            let child_blocks = this.getBlocks();
            let model;
            
            let code = [];
            
            code.push("import mupif");
            code.push("import copy");
            code.push("import Pyro5");
            code.push("import threading");
            code.push("import time");
            code.push("import os");

            let model_blocks = this.getBlocksRecursive(BlockModel);
            let imported_modules = [];
            for (let i = 0; i < model_blocks.length; i++) {
                if (model_blocks[i].model_module !== "" && model_blocks[i].exec_type === "Local") {
                    if (!imported_modules.includes(model_blocks[i].model_module)) {
                        code.push("import " + model_blocks[i].model_module);
                        imported_modules.push(model_blocks[i].model_module);
                    }
                }
            }

            code.push("import logging");

            code.push("log = logging.getLogger()");

            code.push("");
            code.push("");
            code.push("@Pyro5.api.expose");
            code.push("class " + this.project_classname + "(mupif.Workflow):");

            // --------------------------------------------------
            // __init__ function
            // --------------------------------------------------

            code.push("");
            code.push("\tdef __init__(self, metadata=None):");

            code.push("\t\tMD = {");

            extend_array(code, this.generateMetadata(class_code));

            code.push("\t\t}");
            code.push("\t\tsuper().__init__(metadata=MD)");
            code.push("\t\tself.updateMetadata(metadata)");
            code.push("\t\tself.daemon = None");

            if (class_code) {
                // initialization of workflow inputs
                this.getAllExternalDataSlots("out").forEach(s => {
                    if (s.connected()) {
                        code.push("");
                        code.push("\t\t# initialization code of external input ("+s.getObjectID()+")");
                        code.push("\t\t" + s.getCodeRepresentation() + " = None");
                        code.push("\t\t# It should be defined from outside using set() method.");
                    }
                })
            }

            // init codes of child blocks

            let allBlocksRecursive = this.getBlocksRecursive();
            for (let i = 0; i < allBlocksRecursive.length; i++)
                extend_array(code, allBlocksRecursive[i].getInitCode(2));
            
            // --------------------------------------------------
            // initialize function
            // --------------------------------------------------

            code.push("");
            code.push("\tdef initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):");
            code.push("\t\tsuper().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)");

            code.push("");

            let conn_info = "";
            if(this.project_nshost && this.project_nsport)
                conn_info = "nshost='" + this.project_nshost + "', nsport=" + this.project_nsport + "";
            code.push("\t\tns = mupif.pyroutil.connectNameserver(" + conn_info + ")");
            code.push("\t\tself.daemon = mupif.pyroutil.getDaemon(ns)");

            for (let i = 0; i < allBlocksRecursive.length; i++)
                extend_array(code, allBlocksRecursive[i].getInitializationCode(2));
            
            // setting of the inputs for initialization
            let linked_slot;
            let timestep_time = "None";
            for (let i = 0; i < allBlocksRecursive.length; i++) {
                allBlocksRecursive[i].getSlots('in').forEach(s => {
                    if (s.getSetAt() === 'initialization') {
                        let obj_id;
                        linked_slot = s.getLinkedDataSlot();
                        if (linked_slot != null) {
                            if(!(linked_slot instanceof SlotExt)){
                                obj_id = s.getObjectID();
                                if (typeof obj_id === 'string')
                                    obj_id = "'" + obj_id + "'";
                                code.push("");
                                code.push("\t\tself.getModel('" + allBlocksRecursive[i].code_name + "').set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
                            }
                        }
                    }
                })
            }
            
            if (class_code) {
                
                // --------------------------------------------------
                // set method
                // --------------------------------------------------

                code.push("");
                code.push("\t# set method for all external inputs");
                code.push("\tdef set(self, obj, objectID=''):");
                code.push("\t\tpass");

                let anyOfThisValueType;
                let linked_model;
                let data_types = ["mupif.PyroFile", "mupif.Property", "mupif.Field", "mupif.HeavyStruct", "mupif.String", "mupif.Function"];
                for(let vi=0;vi<data_types.length;vi++){
                    anyOfThisValueType = false;
                    this.getAllExternalDataSlots("out").forEach(s => {
                        if (s.connected()) {
                            if (s.getLinkedDataSlot().getDataType() === data_types[vi]) {
                                anyOfThisValueType = true;
                            }
                        }
                    })
                    if(anyOfThisValueType) {
                        code.push("");
                        code.push("\t\t# in case of " + data_types[vi]);
                        code.push("\t\tif obj.isInstance(" + data_types[vi] + "):");
                        code.push("\t\t\tpass");
                        this.getAllExternalDataSlots("out").forEach(s => {
                            if (s.connected()) {
                                if (s.getLinkedDataSlot().getDataType() === data_types[vi]) {
                                    code.push("\t\t\tif objectID == '" + s.getName() + "':");
                                    code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");

                                    if (s.getLinkedDataSlot().set_at === 'initialization') {
                                        linked_model = s.getLinkedDataSlot().getParentBlock();
                                        if (linked_model instanceof BlockModel) {
                                            code.push("\t\t\t\tself.getModel('" + linked_model.getCodeName() + "').set(" + s.getCodeRepresentation() + ", '" + s.getLinkedDataSlot().getObjectID() + "')");
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
                
                // --------------------------------------------------
                // get method
                // --------------------------------------------------

                code.push("");
                code.push("\t# get method for all external outputs");
                code.push("\tdef get(self, objectTypeID, time=None, objectID=''):");

                this.getAllExternalDataSlots("in").forEach(s => {
                    if (s.connected()) {
                        code.push("\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\treturn " + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'));
                    }
                })

                code.push("");
                code.push("\t\treturn None");
            }

            // --------------------------------------------------
            // solve or solveStep function
            // --------------------------------------------------

            code.push("");
            if (class_code)
                code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
            else
                code.push("\tdef solve(self, runInBackground=False):");

            code.push("\t\tpass");

            for (let i = 0; i < child_blocks.length; i++) {
                model = child_blocks[i];
                if (class_code)
                    code = code.concat(model.getExecutionCode(2, "tstep", false));
                else
                    code = code.concat(model.getExecutionCode(2, "", true));
            }

            code.push("");
            code.push("");

            // --------------------------------------------------
            // execution part
            // --------------------------------------------------

            if (class_code) {
                code.push("if __name__ == '__main__':  # for development and testing");
                code.push("");
                code.push("\t# log = logging.getLogger(__file__.split(os.path.sep)[-1].split('.')[0])");
                code.push("\tlog.setLevel(logging.DEBUG)");
                code.push("\ttailHandler = mupif.pyrolog.TailLogHandler(capacity=10000)");
                code.push("\tlog.addHandler(tailHandler)");
                code.push("\tns = mupif.pyroutil.connectNameserver()");
                code.push("\tdaemon = mupif.pyroutil.getDaemon(proxy=ns)");
                code.push("\tlogUri = str(daemon.register(mupif.pyrolog.PyroLogReceiver(tailHandler=tailHandler)))");

                code.push("");
                code.push("\tmd = {'Execution': {'ID': 'N/A', 'Use_case_ID': 'N/A', 'Task_ID': 'N/A', 'Log_URI': logUri}}");
                code.push("\tns = mupif.pyroutil.connectNameserver()");
                code.push("\tdaemon = mupif.pyroutil.getDaemon(ns)");
                code.push("");
                code.push("\tw = " + this.project_classname + "()");
                code.push("\tw.initialize(metadata=md)");
                code.push("");

                let num_inp_hs = 0;
                let num_inp_file = 0;
                this.getAllExternalDataSlots("out").forEach(s => {
                    if (s.connected()) {
                        let linkedDS = s.getLinkedDataSlot();

                        let io_objectId = s.getName();
                        let io_units = linkedDS.getUnits();
                        let io_dataId = linkedDS.getDataID();
                        let io_type = linkedDS.getDataType();
                        let io_valueType = '';
                        if (io_type === 'mupif.Property' || io_type === 'mupif.Function' || io_type === 'mupif.String') {
                            io_valueType = linkedDS.getValueType();
                        }

                        if (io_type === 'mupif.Property') {
                            let io_value = '0.';
                            if (io_valueType === 'Scalar') { io_value = '0.'; }
                            if (io_valueType === 'Vector') { io_value = '[0.]'; }
                            if (io_valueType === 'Tensor') { io_value = '[[0.]]'; }
                            code.push(`\tw.set(mupif.ConstantProperty(value=${io_value}, propID=${io_dataId}, valueType=mupif.ValueType.${io_valueType}, unit='${io_units}'), objectID='${io_objectId}')`);
                        }
                        else if (io_type === 'mupif.String') {
                            let io_value = '""';
                            if (io_valueType === 'Scalar') { io_value = '""'; }
                            if (io_valueType === 'Vector') { io_value = '[""]'; }
                            if (io_valueType === 'Tensor') { io_value = '[[""]]'; }
                            code.push(`\tw.set(mupif.String(value=${io_value}, dataID=${io_dataId}, valueType=mupif.ValueType.${io_valueType}), objectID='${io_objectId}')`);
                        }
                        else if (io_type === 'mupif.PyroFile') {
                            num_inp_file++;
                            let file_name = `input_file_${num_inp_file}`;
                            code.push(`\t${file_name} = mupif.PyroFile(filename='./${file_name}.txt', mode="rb", dataID=${io_dataId})`);
                            code.push(`\tw.set(${file_name}, objectID='${io_objectId}')`);
                        }
                        else if (io_type === 'mupif.HeavyStruct') {
                            num_inp_hs++;
                            let hs_name = `input_hs_${num_inp_hs}`;
                            code.push(`\t${hs_name} = mupif.HeavyStruct(h5path='./${hs_name}.h5', mode='copy-readwrite', id=${io_dataId})`);
                            code.push(`\tdaemon.register(${hs_name})`);
                            code.push(`\t${hs_name}.exposeData()`);
                            code.push(`\tw.set(${hs_name}, objectID='${io_objectId}')`);
                        }
                        else {
                            code.push(`\t# Setting of input type ${io_type} is not implemented in workflow generator.`);
                        }
                    }
                })

                code.push("");
                code.push("\tw.solve()");
                code.push("");

                let out_number = 0;
                this.getAllExternalDataSlots("in").forEach(s => {
                    if (s.connected()) {
                        let linkedDS = s.getLinkedDataSlot();

                        let io_objectId = s.getName();
                        let io_dataId = linkedDS.getDataID();

                        out_number++;
                        let output_name = `output_${out_number}`;
                        code.push(`\t${output_name} = w.get(${io_dataId}, objectID='${io_objectId}')`);
                        code.push(`\tprint(${output_name})`);
                    }
                })

                code.push("");
                code.push("\tw.terminate()");
                code.push("");
            } else {
                code.push("if __name__ == '__main__':");
                code.push("\tproblem = " + this.project_classname + "()");
                code.push("");
                code.push("\t# these metadata are supposed to be filled before execution");
                code.push("\tmd = {");
                code.push("\t\t'Execution': {");
                code.push("\t\t\t'ID': 'N/A',");
                code.push("\t\t\t'Use_case_ID': 'N/A',");
                code.push("\t\t\t'Task_ID': 'N/A'");
                code.push("\t\t}");
                code.push("\t}");
                code.push("\tproblem.initialize(metadata=md)");
                code.push("\tproblem.solve()");
                code.push("\tproblem.terminate()");
                code.push("");
                code.push("\tprint('Simulation has finished.')");
                code.push("");
            }

            return replace_tabs_with_spaces_for_each_line(code);
        }
        return '';
    }

    defineMenu() {
        super.defineMenu();
        this.addAddBlockItems();
        this.addAddExternalSlotItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockWorkflow';
    }

    getDictForJSON(){
        this.generateAllElementCodeNames();

        let ext_slots = [];
        let data_blocks = [];
        let data_datalinks = [];
        let slots;

        slots = this.getSlots();
        for(let i=0;i<slots.length;i++)
            ext_slots.push(slots[i].getDictForJSON());

        let elem_self = {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': 'None',
            'ext_slots': ext_slots,
            'child_block_sort': this.child_block_sort
        };

        data_blocks.push(elem_self);

        let blocks = this.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++){
            data_blocks.push(blocks[i].getDictForJSON());
        }

        for(let i=0;i<this.editor.datalinks.length;i++){
            data_datalinks.push(this.editor.datalinks[i].getDictForJSON());
        }

        let settings = {
            'project_name': this.project_name,
            'project_classname': this.project_classname,
            'project_modulename': this.project_modulename,
            'project_id': this.project_id,
            'project_nshost': this.project_nshost,
            'project_nsport': this.project_nsport,
            'script_name_base': this.script_name_base,
            'connection_type': this.exec_type
        };
        
        let jobman_settings = {};
        let jobman_to_save = false;
        if(this.jobman_name) {
            jobman_to_save = true;
            jobman_settings['name'] = this.jobman_name;
        }
        
        if(jobman_to_save)
            settings['jobman_settings'] = jobman_settings;
        
        return {'blocks': data_blocks, 'datalinks': data_datalinks, 'settings': settings};
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_default';
    }

    getBlockHtmlName(){
        return 'Workflow';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Name = <b>\'' + this.project_name + '\'</b>';
        html += '<br>';
        html += 'ClassName = <b>\'' + this.project_classname + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.project_id + '\'</b>';

        html += '</div>';
        return html;
    }

    getBlockHtmlContent(){
        let html = '';
        html += this.getBlockHtml_header();
        html += this.getBlockHtml_params();
        html += '<div class="block_over_content">';
        html += '<div>';
        html += this.getBlockHtml_slots_output();
        html += '</div><div>';
        html += this.getBlockHtml_content();
        html += '</div><div>';
        html += this.getBlockHtml_slots_input();
        html += '</div>';
        html += '</div>';
        html += this.getBlockHtml_footer();
        html += this.getBlockHtml_menu();
        return html;
    }

}

class BlockValueComparison extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'a', 'a', '*', true, null));
        this.addInputSlot(new Slot(this, 'in', 'b', 'b', '*', true, null));
        // this.addInputSlot(new Slot(this, 'in', 'a_number', 'a (number)', 'number', true, null));
        // this.addInputSlot(new Slot(this, 'in', 'b_number', 'b (number)', 'number', true, null));
        // this.addInputSlot(new Slot(this, 'in', 'a_quantity', 'a (quantity)', 'mupif.PhysicalQuantity', true, null));
        // this.addInputSlot(new Slot(this, 'in', 'b_quantity', 'b (quantity)', 'mupif.PhysicalQuantity', true, null));

        this.addOutputSlot(new Slot(this, 'out', 'a > b', 'a > b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a >= b', 'a >= b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a == b', 'a == b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a != b', 'a != b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a <= b', 'a <= b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a < b', 'a < b', 'Bool', false));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        let a = null;
        let b = null;
        let sa = null;
        let sb = null;
        if(this.getDataSlotWithName("a").connected() && this.getDataSlotWithName("b").connected() ){
            sa = this.getDataSlotWithName("a").getLinkedDataSlot();
            sb = this.getDataSlotWithName("b").getLinkedDataSlot();
            a = sa.getParentBlock().generateOutputDataSlotGetFunction(sa);
            b = sb.getParentBlock().generateOutputDataSlotGetFunction(sb);
        }
        if(a && b){
            let operator = slot.name.replace('a', '').replace('b', '');
            return a + operator + b;
        }
        return 'False';
    }

    generateCodeName(all_blocks, base_name='value_comparison_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockValueComparison';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Value Comparison';
    }

}

class BlockPropertyToQuantity extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'property', 'property', 'mupif.Property', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'quantity', 'quantity', 'mupif.PhysicalQuantity', false));
    }

    generateCodeName(all_blocks, base_name='property_to_quantity_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }
    
    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot = this.getDataSlotWithName("property").getLinkedDataSlot();
        if(in_slot != null) {
            let subject = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
            return subject + '.getValue()';
        }
        return 'None'
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockPropertyToQuantity';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Property to Quantity';
    }

}

class BlockQuantityToProperty extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'quantity', 'quantity', 'mupif.PhysicalQuantity', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'property', 'property', 'mupif.Property', false));
    }

    generateCodeName(all_blocks, base_name='quantity_to_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }
    
    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot = this.getDataSlotWithName("quantity").getLinkedDataSlot();
        if(in_slot != null) {
            let subject = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
            return 'mupif.property.ConstantProperty(quantity=' + subject + ', propID=mupif.DataID.ID_None, valueType=mupif.ValueType.Scalar, time=None)';
        }
        return 'None'
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockQuantityToProperty';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Quantity to Property';
    }

}

class BlockNumberToQuantity extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'number', 'number', 'number', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'quantity', 'quantity', 'mupif.PhysicalQuantity', false));
    }

    generateCodeName(all_blocks, base_name='number_to_quantity_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }
    
    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot = this.getDataSlotWithName("number").getLinkedDataSlot();
        if(in_slot != null) {
            let subject = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
            return subject + ' * mupif.U.none';
        }
        return 'None'
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockNumberToQuantity';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Number to Quantity';
    }

}

class BlockNumberToProperty extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'number', 'number', 'number', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'property', 'property', 'mupif.Property', false));
    }

    generateCodeName(all_blocks, base_name='number_to_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }
    
    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot = this.getDataSlotWithName("number").getLinkedDataSlot();
        if(in_slot != null) {
            let subject = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
            return 'mupif.property.ConstantProperty(quantity=' + subject + ' * mupif.U.none, propID=mupif.DataID.ID_None, valueType=mupif.ValueType.Scalar, time=None)';
        }
        return 'None'
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockNumberToProperty';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Number to Property';
    }

}

class BlockDataListLength extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'DataList', 'DataList', 'mupif.DataList[*]', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'length', 'length', 'number', false));
    }

    generateCodeName(all_blocks, base_name='datalist_length_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    /**
     * @param {Slot} slot
     * @param {string} time
     * @returns {string} */
    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot = this.getDataSlotWithName("DataList").getLinkedDataSlot();
        if(in_slot != null) {
            // if(in_slot.type.startsWith('mupif.DataList')) {
            let subject = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
            return 'len(' + subject + '.objs)';
            // }
        }
        return 'None'
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockDataListLength';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'DataList Length';
    }

}

class BlockAllocateModelAtRuntime extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addOutputSlot(new Slot(this, 'out', 'model_names', 'model_names', 'string[]', false));
    }

    generateCodeName(all_blocks, base_name='allocate_model_at_runtime_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return this.getModelNamesVariable();
    }
    
    getModelNamesVariable(){return "self."+this.code_name+"_model_names";}

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push(this.getModelNamesVariable() + " = []");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let var_time_step = "tstep";
        if(timestep !== ""){
            var_time_step = timestep
        }
        let code = [];
        code.push(this.getModelNamesVariable() + " = []");

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            code = code.concat(blocks[i].getExecutionCode(0, var_time_step, solvefunc));
        }

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockAllocateModelAtRuntime';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['child_block_sort'] = this.child_block_sort;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_allocate_model_at_runtime';
    }

    getBlockHtmlName(){
        return 'Allocate Model At Runtime';
    }

}

class BlockRunInBackground extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addOutputSlot(new Slot(this, 'out', 'model_names', 'model_names', 'string[]', false));
    }

    generateCodeName(all_blocks, base_name='run_in_background_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return this.getModelNamesVariable();
    }
    
    getModelNamesVariable(){return "self."+this.code_name+"_model_names";}

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push(this.getModelNamesVariable() + " = []");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let var_time_step = "tstep";
        if(timestep !== ""){
            var_time_step = timestep
        }
        let code = [];
        code.push(this.getModelNamesVariable() + " = []");

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            code = code.concat(blocks[i].getExecutionCode(0, var_time_step, solvefunc));
        }

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockRunInBackground';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['child_block_sort'] = this.child_block_sort;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_run_in_background';
    }

    getBlockHtmlName(){
        return 'Run in background';
    }

}

class BlockWaitForBackgroundProcesses extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'model_names', 'model_names', 'string[]', true, null));
        this.addInputSlot(new Slot(this, 'in', 'checking_period', 'checking_period', 'mupif.PhysicalQuantity', false, null));
    }

    generateCodeName(all_blocks, base_name='wait_for_background_processes_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();
        let cn = this.getCodeName()
        let var_all_done = cn + "_all_done"
        let var_model_name = cn + "_model_name"

        let in_slot_model_names = this.getDataSlotWithName("model_names").getLinkedDataSlot();
        let model_names = "[]"
        if(in_slot_model_names != null) {
            model_names = in_slot_model_names.getParentBlock().generateOutputDataSlotGetFunction(in_slot_model_names);
        }

        code.push(var_all_done + " = False");
        code.push("while not " + var_all_done + ":");
        code.push("\ttime.sleep(60)");
        code.push("\t" + var_all_done + " = True");
        code.push("\tfor " + var_model_name + " in " + model_names + ":");
        code.push("\t\tif not self.getModel(" + var_model_name + ").isSolved():");
        code.push("\t\t\t" + var_all_done + " = False");
        code.push("for " + var_model_name + " in " + model_names + ":");
        code.push("\tself.getModel(" + var_model_name + ").finishStep(tstep)");

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockWaitForBackgroundProcesses';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_wait_for_background_processes';
    }

    getBlockHtmlName(){
        return 'Wait for background processes';
    }

}

class BlockVariable extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'in', 'in', '*', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'out', 'out', '*', false));
        this.getDataSlotWithName('out').setRedirectionForParams(this.getDataSlotWithName('in'));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.code_name;
    }

    generateCodeName(all_blocks, base_name='variable_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        let code = super.getInitCode();

        let var_value = "self." + this.code_name;

        code.push(var_value + " = None");

        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let in_slot = this.getDataSlotWithName("in").getLinkedDataSlot();
        let val = "None"
        if(in_slot != null) {
            val = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
        }

        let var_value = this.code_name;

        code.push("self." + var_value + " = " + val);

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockVariable';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Variable';
    }

}

class BlockGetItemFromDataList extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'datalist', 'datalist', 'mupif.DataList[*]', true, null));
        this.addInputSlot(new Slot(this, 'in', 'number', 'number', 'number', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'item', 'item', '*', false));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        let in_slot_datalist = this.getDataSlotWithName("datalist").getLinkedDataSlot();
        let in_slot_number = this.getDataSlotWithName("number").getLinkedDataSlot();
        if(in_slot_datalist != null && in_slot_number != null) {
            let datalist = in_slot_datalist.getParentBlock().generateOutputDataSlotGetFunction(in_slot_datalist);
            let number = in_slot_number.getParentBlock().generateOutputDataSlotGetFunction(in_slot_number);
            return datalist + ".objs[int(" + number + ")-1] if 0 <= int(" + number + ")-1 < len(" + datalist + ".objs) else None";
        }
        return 'None'
    }

    generateCodeName(all_blocks, base_name='get_item_from_datalist_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockGetItemFromDataList';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Get item from DataList';
    }

}

let datalink_id = 0;
function generateNewDatalinkID(){
    datalink_id += 1;
    return 'datalink_'+datalink_id;
}

class Datalink{
    constructor(slot1, slot2) {
        this.id = generateNewDatalinkID();
        this.slot1 = slot1;
        this.slot2 = slot2;
    }

    getClassName(){
        return 'DataLink';
    }

    getDictForJSON(){
        return {
            'ds1_uid': this.slot1.getUID(),
            'ds2_uid': this.slot2.getUID()
        };
    }

    getDatalinkHtml(){
        let div_a;
        let div_b;
        let br_a;
        let br_b;
        //
        let div_workflow = document.getElementById('workflowSubContainer');
        let br_workflow = div_workflow.getBoundingClientRect();
        let s_x = br_workflow.x;
        let s_y = br_workflow.y;
        //
        div_a = document.getElementById('point_'+this.slot1.getUID());
        div_b = document.getElementById('point_'+this.slot2.getUID());
        br_a = div_a.getBoundingClientRect();
        br_b = div_b.getBoundingClientRect();
        //
        // return this.createDatalinkSimpleLine(br_a.x-s_x, br_a.y-s_y, br_b.x-s_x, br_b.y-s_y);
        return this.createDatalingSpline(br_a.x-s_x, br_a.y-s_y, br_b.x-s_x, br_b.y-s_y);
    }

    getDatalinkDiv(){
        return document.getElementById(this.id);
    }

    createDatalinkLineDiv(x, y, length, angle) {
        let html = '';
        html += '' +
            '<div class="we_datalink_sub" style="' +
            'width: ' + length + 'px;' +
            'height: 0;' +
            '-moz-transform: rotate(' + angle + 'rad);' +
            '-webkit-transform: rotate(' + angle + 'rad);' +
            '-o-transform: rotate(' + angle + 'rad);' +
            '-ms-transform: rotate(' + angle + 'rad);' +
            'top: ' + y + 'px;' +
            'left: ' + x + 'px;' +
            '" ' +
            'onmousedown="anyClick(event, \'\', \''+this.id+'\');"' +
            ' onmouseup="editor.one_elem_check_disabling_propagation=false;"' +
            ' onmouseenter="datalinkHoverIn(\''+this.id+'\')"' +
            ' onmouseleave="datalinkHoverOut()">' +
            '</div>';
        return html;
    }

    createDatalinkSubLine(x1, y1, x2, y2){
        let a = x1 - x2,
            b = y1 - y2,
            c = Math.sqrt(a * a + b * b);
        let sx = (x1 + x2) / 2,
            sy = (y1 + y2) / 2;
        let x = sx - c / 2,
            y = sy;
        let alpha = Math.PI - Math.atan2(-b, a);
        return this.createDatalinkLineDiv(x, y, c, alpha);
    }

    createDatalingSpline(x1, y1, x2, y2){
        let classname_add = '';
        if(editor.selected_datalink === this)
            classname_add = '_selected';

        let html = '<div class="we_datalink'+classname_add+'" id="'+this.id+'">';


        if(y1 === y2)
            html += this.createDatalinkSubLine(x1, y1, x2, y2);
        else{
            let dx = x2-x1;
            let dy = y2-y1;
            let diag_len = Math.sqrt(dx*dx+dy*dy);
            let div_elem_len = 5;

            let x1_, x2_, y1_, y2_;
            let division = Math.ceil(diag_len/div_elem_len);
            let d_alpha = Math.PI/division;
            let xc = 0.5*(x1+x2);
            let yc = 0.5*(y1+y2);
            let alpha=-Math.PI/2.;

            for(let iloc = 0; iloc < division;iloc++) {
                x1_ = x1+dx/division*iloc;
                y1_ = yc+Math.sin(alpha)*0.5*dy;
                x2_ = x1+dx/division*(iloc+1);
                y2_ = yc+Math.sin(alpha+d_alpha)*0.5*dy;
                html += this.createDatalinkSubLine(x1_, y1_, x2_, y2_);
                alpha += d_alpha;
            }

        }



        html += '<div>';
        return html;
    }



}



function replaceAllInStr(val, search, replace){
    return val.split(search).join(replace);
}

function generate_indents(n){
    let t = "";
    for(let i=0;i<n;i++)
        t += "\t";
    return t;
}

function push_indents_before_each_line(code_lines, indent){
    let new_code_lines = [];
    for(let i=0;i<code_lines.length;i++)
        new_code_lines.push(generate_indents(indent) + code_lines[i]);
    return new_code_lines
}

function replace_tabs_with_spaces_for_each_line(code_lines){
    let new_code_lines = [];
    for(let i=0;i<code_lines.length;i++)
        new_code_lines.push(replaceAllInStr(code_lines[i], "\t", "    "));
    return new_code_lines
}

function formatCodeToText(code){
    let text_code = "";
    for(let i=0;i<code.length;i++)
        text_code += code[i] + "\n";
    return text_code
}

function extend_array(arr, add){
    for(let i=0;i<add.length;i++)
        arr.push(add[i]);
}

function floatToStr(val){
    let val_str = val.toString();
    if(!val_str.includes('.'))
        val_str += '.0';
    return val_str;
}

function getTextValueFromUser(message, def_val){
    let val = prompt(message, def_val);
    if (val == null || val === "") {
        return null;
    }
    return val;
}

function addCommaToLastLine(code_lines){
    let len = code_lines.length;
    code_lines[len-1] = code_lines[len-1] + ",";
    return code_lines;
}


function keyPress(e){
    if(e.which === 46){
        if(editor.selected_datalink){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected datalink?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_datalink\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected block?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_block\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
        if(editor.selected_slot_ext){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected external dataslot?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_ext_slot\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
    }
    // moving blocks up
    if(e.which === 38){
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            editor.selected_block.moveMeUp();
            editor.generateWorkflowHtml();
        }
    }
    // moving blocks down
    if(e.which === 40){
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            editor.selected_block.moveMeDown();
            editor.generateWorkflowHtml();
        }
    }
    // changing the sorting
    if(e.which === 79){
        if(editor.selected_block){
            if(editor.selected_block.child_block_sort === 'vertical')
                editor.selected_block.child_block_sort = 'horizontal';
            else if(editor.selected_block.child_block_sort === 'horizontal')
                editor.selected_block.child_block_sort = 'vertical';
            editor.generateWorkflowHtml();
        }
    }
}

function anyClick(event, block_uid=null, datalink_uid=null, ext_dataslot_uid=null){
    if(editor.one_elem_check_disabling_propagation === false) {
        editor.one_elem_check_disabling_propagation = true;

        let block_instance = editor.getBlockByUID(block_uid);
        let datalink_instance = editor.getDatalinkByUID(datalink_uid);
        let ext_dataslot_instance = editor.getSlotByUID(ext_dataslot_uid);
        if(ext_dataslot_instance)
            if(ext_dataslot_instance.external === false)
                ext_dataslot_instance = null;

        // 0 = left
        // 1 = middle
        // 2 = right

        if (event.button === 0 || event.button === 2) {
            // block
            editor.selected_block = block_instance;
            let blocks = editor.getAllBlocks();
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].getBlockDiv().classList.remove('we_block_selected');
                blocks[i].getBlockMenuDiv().style.display = 'none';
            }
            if (editor.selected_block) {
                editor.selected_block.getBlockDiv().classList.add('we_block_selected');
            }

            if (event.button === 2 && editor.selected_block) {
                let block_menu = editor.selected_block.getBlockMenuDiv();
                block_menu.style.display = 'block';
            }

            // datalink
            editor.selected_datalink = null;
            for (let i = 0; i < editor.datalinks.length; i++)
                editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_selected');
            if (datalink_instance) {
                editor.selected_datalink = datalink_instance;
                datalink_instance.getDatalinkDiv().classList.add('we_datalink_selected');
            }

            // external dataslot
            editor.selected_slot_ext = null;
            let slots = editor.workflowblock.getAllExternalDataSlots();
            for (let i = 0; i < slots.length; i++)
                slots[i].getDataslotDiv().classList.remove('slot_selected');
            if (ext_dataslot_instance) {
                editor.selected_slot_ext = ext_dataslot_instance;
                ext_dataslot_instance.getDataslotDiv().classList.add('slot_selected');
            }
        }
    }
}

function datalinkHoverOut(){
    for (let i = 0; i < editor.datalinks.length; i++)
        editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_hover');
}

function datalinkHoverIn(datalink_uid){
    let datalink_instance = editor.getDatalinkByUID(datalink_uid);
    for (let i = 0; i < editor.datalinks.length; i++)
        editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_hover');
    if (datalink_instance) {
        datalink_instance.getDatalinkDiv().classList.add('we_datalink_hover');
    }
}

function datalink_creation_begin(slot_uid){
    editor.selected_slot_1 = editor.getSlotByUID(slot_uid);
}

function datalink_creation_finalize(slot_uid){
    editor.selected_slot_2 = editor.getSlotByUID(slot_uid);

    if(editor.selected_slot_1 && editor.selected_slot_2){
        editor.addDatalink(editor.selected_slot_1, editor.selected_slot_2);
        editor.selected_slot_1 = null;
        editor.selected_slot_2 = null;
    }
    editor.generateWorkflowHtml();
}

function focusOnEditor(){
    document.getElementById('workflowContainer').style.display = 'block';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'gray';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';

    editor.generateWorkflowHtml()
}

function focusOnProjectSettings(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'block';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'gray';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnModelList(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'block';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'gray';
}

function deleteMetaDataByListID(list_id){
    editor.list_of_model_metadata.splice(list_id, 1);
    updateHtmlOfListOfModels();
}

function updateHtmlOfListOfModels(){
    if(editor.visual) {
        let elem_list_of_models = document.getElementById('block_list_of_models');
        let temp_html = '<h2 style="margin-bottom:20px;"><b>Project models</b>' +
            '<form action="" method="post" enctype="multipart/form-data" style="margin:0;padding:0;display:inline-block;" id="form_metadata_data">' +
            '<label for="form_metadata_file_selector" id="label_form_metadata_file_selector" style="display:none;">' +
            'Load MetaData JSON from file' +
            '<input type="file" id="form_metadata_file_selector" name="metadata_file" style="display:none;width:100px;" onchange="loadJsonMetaDataFileContent();">' +
            '</label>' +
            '<input type="hidden" value="Load from JSON" name="file_upload">' +
            '</form>' +
            '<button onclick="document.getElementById(\'label_form_metadata_file_selector\').click();" style="margin-left:30px;">Load MetaData JSON from file</button>' +
            '</h2>';

        temp_html += '<table style="color:black;">';
        for (let i = 0; i < editor.list_of_model_metadata.length; i++) {
            temp_html += '' +
                '<tr>' +
                '<td>' + (i + 1) + ']</td><td style="padding:3px 10px 3px 10px;"><b>' + editor.list_of_model_metadata[i]['Name'] + '</b></td>' +
                '<td><button onclick="editor.download_ith_metadata(' + i + ');">download</button></td>' +
                '<td><button onclick="deleteMetaDataByListID(' + i + ');">delete</button></td>' +
                '</tr>';
        }
        temp_html += '</table>';

        elem_list_of_models.innerHTML = temp_html;
    }
}

function loadJsonProjectFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        editor.loadFromJsonData(json_dict);
        editor.generateWorkflowHtml();
    });
    reader.readAsText(document.getElementById('form_json_file_selector').files[0]);
}

function loadJsonMetaDataFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        if(checkMetaDataValidity(json_dict))
            editor.list_of_model_metadata.push(json_dict);
        else
            console.log('MetaData JSON is not valid for usage.');
        updateHtmlOfListOfModels();
    });
    reader.readAsText(document.getElementById('form_metadata_file_selector').files[0]);
}

function loadMetaDataFromJSONOnServer(filename){
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                let answer = rawFile.responseText;
                let model_json = JSON.parse(answer);
                if(checkMetaDataValidity(model_json))
                    editor.list_of_model_metadata.push(model_json);
                else
                    console.log('MetaData JSON is not valid for usage.');
                updateHtmlOfListOfModels();
            }
        }
    };
    rawFile.send(null);
}

function loadTextFileFromServer(filename){
    let result = null;
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filename, false);
    xmlhttp.send();
    if (xmlhttp.status===200) {
        result = xmlhttp.responseText;
    }
    return result;
}

function checkMetaDataValidity(md){
    // if(!("ClassName" in md))
    //     return false;
    // if(!("ModuleName" in md))
    //     return false;
    if(!("Name" in md))
        return false;
    if(!("ID" in md))
        return false;
    if(!("Inputs" in md))
        return false;
    if(!("Outputs" in md))
        return false;
    if(!("Execution_settings" in md))
        return false;
    return true;
}


function main(visual=false)
{



    editor = new WorkflowEditor();

    // ====================================================================================================
    // ====================================================================================================
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====

    // MAIN CODE

    editor.workflowblock = new BlockWorkflow(editor, null);
    editor.visual = visual;

    if(visual) {
        loadMetaDataFromJSONOnServer('examples/metadata/md01.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md02.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md03.json');
    }
    
    if (example_id === 1) {
        let json_data = JSON.parse(loadTextFileFromServer('examples/example01.json'));
        editor.loadFromJsonData(json_data);
    }
    if (example_id === 2) {
        let json_data = JSON.parse(loadTextFileFromServer('examples/example02.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 3){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example03.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 4){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example04.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 5){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example05.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 6){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example06.json'));
        editor.loadFromJsonData(json_data);
    }

    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // ====================================================================================================
    // ====================================================================================================

    if(visual) {
        updateHtmlOfListOfModels();
        focusOnEditor();
        editor.generateWorkflowHtml();
    }

    return editor;
}

class VisualMenu {
    constructor(name="") {
        this.name = name;
        this.menus = [];
        this.items = [];
    }

    getName() {
        return this.name;
    }

    getMenus() {
        return this.menus;
    }

    getItems() {
        return this.items;
    }

    addMenu(menu) {
        this.menus.push(menu);
    }

    addItem(item) {
        this.items.push(item);
    }

    addItemIntoSubMenu(item, trace) {
        let trace_list = trace.split('.');
        let current_menu = this;
        let menu_name;
        let submenu_search;
        let new_menu;
        for(let i=0;i<trace_list.length;i++){
            menu_name = trace_list[i];
            submenu_search = current_menu.getMenuWithName(menu_name);
            if(submenu_search != null)
                current_menu = submenu_search;
            else
            {
                new_menu = new VisualMenu(menu_name);
                current_menu.addMenu(new_menu);
                current_menu = new_menu;
            }
        }
        current_menu.addItem(item);
    }

    getItemWithKeyword(keyword) {
        let items = this.getItems();
        for(let i=0;i<items.length;i++)
            if(items[i].getKeyword() === keyword)
                return items[i];
        return null;
    }

    getMenuWithName(name) {
        let menus = this.getMenus();
        for(let i=0;i<menus.length;i++)
            if (menus[i].getName() === name)
                return menus[i];
        return null;
    }
}


class VisualMenuItem {
    constructor(keyword, value, text, input_type="", input_caption="", input_options=[]) {
        this.keyword = keyword;
        this.value = value;
        this.text = text;
        this.input_type = input_type; // '' or 'select' or 'int' or 'float' or 'str'
        this.input_caption = input_caption;
        this.input_options = input_options;
    }

    getKeyword() {
        return this.keyword;
    }

    getText() {
        return this.text;
    }

    getValue() {
        return this.value;
    }

    getInputType() {
        return this.input_type;
    }

    getInputCaption() {
        return this.input_caption;
    }

    getInputOptions() {
        return this.input_options;
    }
}

let mupif_ValueType = [
    'Scalar',
    'Vector',
    'Tensor',
];

let mupif_DataID = [
'FID_Displacement',
'FID_Strain',
'FID_Stress',
'FID_Temperature',
'FID_Humidity',
'FID_Concentration',
'FID_Thermal_absorption_volume',
'FID_Thermal_absorption_surface',
'FID_Material_number',
'FID_BucklingShape',
'FID_FibreOrientation',
'FID_DomainNumber',
'FID_Permeability',
'FID_Velocity',
'FID_Pressure',
'FID_ESI_VPS_Displacement',
'FID_Porosity',
'FID_Mises_Stress',
'FID_MaxPrincipal_Stress',
'FID_MidPrincipal_Stress',
'FID_MinPrincipal_Stress',
'FID_MaxPrincipal_Strain',
'FID_MidPrincipal_Strain',
'FID_MinPrincipal_Strain',
'PSID_ParticlePositions',
'FuncID_ProbabilityDistribution',
'ID_None',
'ID_GrainState',
'ID_MoleculeState',
'ID_InputFile',
'ID_ForceField',
'PID_Concentration',
'PID_CumulativeConcentration',
'PID_Velocity',
'PID_transient_simulation_time',
'PID_effective_conductivity',
'PID_volume_fraction_red_phosphor',
'PID_volume_fraction_green_phosphor',
'PID_conductivity_red_phosphor',
'PID_conductivity_green_phosphor',
'PID_mean_radius_red_phosphor',
'PID_mean_radius_green_phosphor',
'PID_standard_deviation_red_phosphor',
'PID_standard_deviation_green_phosphor',
'PID_RefractiveIndex',
'PID_NumberOfRays',
'PID_LEDSpectrum',
'PID_ChipSpectrum',
'PID_LEDColor_x',
'PID_LEDColor_y',
'PID_LEDCCT',
'PID_LEDRadiantPower',
'PID_ParticleNumberDensity',
'PID_ParticleRefractiveIndex',
'PID_EmissionSpectrum',
'PID_ExcitationSpectrum',
'PID_AsorptionSpectrum',
'PID_ScatteringCrossSections',
'PID_InverseCumulativeDist',
'PID_NumberOfFluorescentParticles',
'PID_ParticleMu',
'PID_ParticleSigma',
'PID_PhosphorEfficiency',
'PID_Length',
'PID_Height',
'PID_Thickness',
'PID_Deflection',
'PID_EModulus',
'PID_PoissonRatio',
'PID_YoungModulus1',
'PID_YoungModulus2',
'PID_YoungModulus3',
'PID_PoissonRatio23',
'PID_PoissonRatio13',
'PID_PoissonRatio12',
'PID_ShearModulus23',
'PID_ShearModulus13',
'PID_ShearModulus12',
'PID_CriticalLoadLevel',
'PID_ExtensionalInPlaneStiffness',
'PID_ExtensionalOutOfPlaneStiffness',
'PID_ShearInPlaneStiffness',
'PID_ShearOutOfPlaneStiffness',
'PID_LocalBendingStiffness',
'PID_CriticalForce',
'PID_CriticalMoment',
'PID_MatrixYoung',
'PID_MatrixPoisson',
'PID_InclusionYoung',
'PID_InclusionPoisson',
'PID_InclusionVolumeFraction',
'PID_InclusionAspectRatio',
'PID_MatrixOgdenModulus',
'PID_MatrixOgdenExponent',
'PID_InclusionSizeNormalized',
'PID_CompositeAxialYoung',
'PID_CompositeInPlaneYoung',
'PID_CompositeInPlaneShear',
'PID_CompositeTransverseShear',
'PID_CompositeInPlanePoisson',
'PID_CompositeTransversePoisson',
'PID_CompositeStrain11Tensor',
'PID_CompositeStrain22Tensor',
'PID_CompositeStress11Tensor',
'PID_MatrixDensity',
'PID_CompositeDensity',
'PID_InclusionDensity',
'PID_Position',
'PID_Direction',
'PID_Status',
'PID_Label',
'PID_Chemical_specie',
'PID_Material_type',
'PID_Shape_center',
'PID_Shape_length',
'PID_Shape_radius',
'PID_Shape_side',
'PID_Crystal_storage',
'PID_Name_UC',
'PID_Lattice_vectors',
'PID_Symmetry_lattice_vectors',
'PID_Occupancy',
'PID_Bond_label',
'PID_Bond_type',
'PID_Dimension',
'PID_Acceleration',
'PID_Radius',
'PID_Size',
'PID_Mass',
'PID_Volume',
'PID_Angular_velocity',
'PID_Angular_acceleration',
'PID_Simulation_domain_dimensions',
'PID_Simulation_domain_origin',
'PID_Dynamic_viscosity',
'PID_Kinematic_viscosity',
'PID_Diffusion_coefficient',
'PID_Probability_coefficient',
'PID_Friction_coefficient',
'PID_Scaling_coefficient',
'PID_Equation_of_state_coefficient',
'PID_Contact_angle',
'PID_Amphiphilicity',
'PID_Phase_interaction_strength',
'PID_Hamaker_constant',
'PID_Zeta_potential',
'PID_Ion_valence_effect',
'PID_Debye_length',
'PID_Smoothing_length',
'PID_Lattice_spacing',
'PID_Time_step',
'PID_Number_of_time_steps',
'PID_Force',
'PID_Torque',
'PID_Density',
'PID_Pressure',
'PID_Temperature',
'PID_Distribution',
'PID_Order_parameter',
'PID_Original_position',
'PID_Current',
'PID_Final',
'PID_Delta_displacement',
'PID_External_applied_force',
'PID_Euler_angles',
'PID_Sphericity',
'PID_Young_modulus',
'PID_Poisson_ratio',
'PID_Restitution_coefficient',
'PID_Rolling_friction',
'PID_Volume_fraction',
'PID_Coupling_time',
'PID_Cutoff_distance',
'PID_Energy_well_depth',
'PID_Van_der_Waals_radius',
'PID_Dielectric_constant',
'PID_Dynamic_pressure',
'PID_Flux',
'PID_Homogenized_stress_tensor',
'PID_Strain_tensor',
'PID_Relative_velocity',
'PID_Diffusion_velocity',
'PID_Stress_tensor',
'PID_Volume_fraction_gradient',
'PID_Cohesion_energy_density',
'PID_Major',
'PID_Minor',
'PID_Patch',
'PID_Full',
'PID_Charge',
'PID_Charge_density',
'PID_Description',
'PID_Electric_field',
'PID_Electron_mass',
'PID_Electrostatic_field',
'PID_Energy',
'PID_Heat_conductivity',
'PID_Initial_viscosity',
'PID_Linear_constant',
'PID_Maximum_viscosity',
'PID_Minimum_viscosity',
'PID_Momentum',
'PID_Moment_inertia',
'PID_Potential_energy',
'PID_Power_law_index',
'PID_Relaxation_time',
'PID_Surface_tension',
'PID_Time',
'PID_Viscosity',
'PID_Collision_operator',
'PID_Reference_density',
'PID_External_forcing',
'PID_Flow_type',
'PID_Vector',
'PID_Index',
'PID_Thermodynamic_ensemble',
'PID_Variable',
'PID_None',
'PID_Lattice_parameter',
'PID_Steady_state',
'PID_Maximum_Courant_number',
'PID_Number_of_cores',
'PID_Magnitude',
'PID_Number_of_physics_states',
'PID_Cohesive_group',
'PID_FillingTime',
'PID_Demo_Min',
'PID_Demo_Max',
'PID_Demo_Integral',
'PID_Demo_Volume',
'PID_Demo_Value',
'PID_UserTimeStep',
'PID_KPI01',
'PID_ESI_VPS_TEND',
'PID_ESI_VPS_PLY1_E0t1',
'PID_ESI_VPS_PLY1_E0t2',
'PID_ESI_VPS_PLY1_E0t3',
'PID_ESI_VPS_PLY1_G012',
'PID_ESI_VPS_PLY1_G023',
'PID_ESI_VPS_PLY1_G013',
'PID_ESI_VPS_PLY1_NU12',
'PID_ESI_VPS_PLY1_NU23',
'PID_ESI_VPS_PLY1_NU13',
'PID_ESI_VPS_PLY1_E0c1',
'PID_ESI_VPS_PLY1_RHO',
'PID_ESI_VPS_hPLY',
'PID_ESI_VPS_PLY1_XT',
'PID_ESI_VPS_PLY1_XC',
'PID_ESI_VPS_PLY1_YT',
'PID_ESI_VPS_PLY1_YC',
'PID_ESI_VPS_PLY1_S12',
'PID_ESI_VPS_FIRST_FAILURE_VAL',
'PID_ESI_VPS_FIRST_FAILURE_MOM',
'PID_ESI_VPS_FIRST_FAILURE_ROT',
'PID_ESI_VPS_CRIMP_STIFFNESS',
'PID_ESI_VPS_FIRST_FAILURE_ELE',
'PID_ESI_VPS_FIRST_FAILURE_PLY',
'PID_ESI_VPS_TOTAL_MODEL_MASS',
'PID_ESI_VPS_BUCKL_LOAD',
'PID_ESI_VPS_MOMENT_CURVE',
'PID_ESI_VPS_ROTATION_CURVE',
'PID_ESI_VPS_MOMENT',
'PID_ESI_VPS_ROTATION',
'PID_ESI_VPS_THNOD_1',
'PID_ESI_VPS_THNOD_2',
'PID_ESI_VPS_SECFO_1',
'PID_ESI_VPS_SECFO_2',
'PID_BoundaryConfiguration',
'PID_SMILE_MOLECULAR_STRUCTURE',
'PID_MOLECULAR_WEIGHT',
'PID_POLYDISPERSITY_INDEX',
'PID_CROSSLINKER_TYPE',
'PID_FILLER_DESIGNATION',
'PID_SMILE_MODIFIER_MOLECULAR_STRUCTURE',
'PID_SMILE_FILLER_MOLECULAR_STRUCTURE',
'PID_CROSSLINKONG_DENSITY',
'PID_FILLER_CONCENTRATION',
'PID_DENSITY_OF_FUNCTIONALIZATION',
'PID_TEMPERATURE',
'PID_PRESSURE',
'PID_DENSITY',
'PID_TRANSITION_TEMPERATURE',
'PID_HyperelasticPotential',
'PID_ForceCurve',
'PID_DisplacementCurve',
'PID_CorneringAngle',
'PID_CorneringStiffness',
'PID_dirichletBC',
'PID_conventionExternalTemperature',
'PID_conventionCoefficient',
'PID_Footprint',
'PID_Braking_Force',
'PID_Stiffness',
'PID_Hyper1',
'PID_maxDisplacement',
'PID_maxMisesStress',
'PID_maxPrincipalStress',
'PID_Hyper2',
'PID_NrOfComponents',
'PID_Self_Diffusivity',
'PID_Mass_density',
'PID_Interface_width',
'PID_Degree_of_polymerization',
'PID_Interaction_parameter',
'PID_Molar_volume',
'PID_GrainState',
'PID_HOMO',
'PID_LUMO',
'PID_EnvTemperature',
'PID_HeaterTemperature',
'PID_BeltTemperature',
'PID_BeltVelocity',
'PID_InletFlowRate',
'PID_InletTemperature',
'PID_OutletVelocity',
'PID_TinflowSolvent',
'PID_TinflowBackground',
'PID_TinflowModelID',
'PID_TinflowModelType',
'PID_TinflowPolymer',
'PID_PolymerConcentration',
'PID_TinflowResultFile',
'PID_TinflowReportFile',
'PID_FilmThickness',
'PID_FilmTemperature',
'PID_InletFlowRateChamber1',
'PID_InletFlowRateChamber2',
'PID_InletFlowRateChamber3',
'PID_InletTemperatureChamber1',
'PID_InletTemperatureChamber2',
'PID_InletTemperatureChamber3',
'PID_ExhaustFlowRateChamber1',
'PID_ExhaustFlowRateChamber2',
'PID_ExhaustFlowRateChamber3',
'FID_FilmThickness',
'FID_FilmTemperature',
'FID_FilmConcentration',
'FID_FilmEvaporationRate',
'PID_SubstrateTemperature',
'PID_ProcessPressure',
'PID_InletFlowRateBackground',
'PID_InletFlowRateSolvent',
'PID_DepositionRate',
'PID_DepositionRateType',
'FID_DepositionRate',
'PID_Material',
'PID_MaterialCard',
'PID_MaterialList',
'PID_MaterialPlot',
'PID_DynamicViscosityGaseous',
'PID_DynamicViscosityLiquid',
'PID_HeatCapacityGaseous',
'PID_HeatCapacityLiquid',
'PID_HeatConductivityGaseous',
'PID_HeatConductivityLiquid',
'PID_SurfaceTension',
'PID_EvaporationEnthalpy',
'PID_EbullitionTemperature',
'PID_IdealGasDensity',
'PID_MolarMass',
'PID_MeltingTemperature',
'PID_MeltingEnthalpy',
'PID_CriticalTemperature',
'PID_CriticalPressure',
'PID_CriticalDensity',
'PID_AcentricFactor',
'PID_LennardJonesEnergy',
'PID_CollisionDiameter',
'PID_DoFMotion',
'PID_ThermalAccomodation',
'PID_Width',
'ID_Displacement',
'ID_Strain',
'ID_Stress',
'ID_Temperature',
'ID_Humidity',
'ID_MoistureContent',
'ID_Concentration',
'ID_Thermal_absorption_volume',
'ID_Thermal_absorption_surface',
'ID_Material_number',
'ID_Permeability',
'ID_Velocity',
'ID_Pressure',
'ID_Porosity',
'ID_Curvature',
'ID_BucklingLoad',
'ID_CompositeLongitudinalYoungModulus',
'ID_CompositeTransverseYoungModulus',
'ID_CompositeLongitudinalShearModulus',
'ID_CompositeTransverseShearModulus',
'ID_CompositeLongitudinalPoissonRatio',
'ID_CompositeTransversePoissonRatio',
'ID_VTKFile',
'ID_EnergyGap',
'ID_EnergeticDisorder'
];



let mupif_Units = [
    'm', 'kg', 's', 'A', 'K', 'mol', 'cd', 'rad', 'sr',
    'g', 'none',
    'Hz',
    'N',
    'Pa',
    'J',
    'W',
    'C',
    'V',
    'F',
    'ohm',
    'S',
    'Wb',
    'T',
    'H',
    'lm',
    'lx',
    'Bq',
    'Gy',
    'Sv',
    'deg_C',
    'deg_F',
];

let myquery_temp_instance = null;

function myQuery_show(html_content='', type='query'){
    let elem_container = document.getElementById('myQuery_container');
    let elem_curtain = document.getElementById('myQuery_curtain');
    let elem_input = document.getElementById('myQuery_input');

    elem_container.style.display = 'block';
    elem_input.innerHTML = html_content;
    elem_input.onclick = null;
    if(type === 'note')
        elem_input.onclick = myQuery_hide;
}
function myQuery_hide(){
    let elem_container = document.getElementById('myQuery_container');
    let elem_curtain = document.getElementById('myQuery_curtain');
    let elem_input = document.getElementById('myQuery_input');

    elem_container.style.display = 'none';
    elem_input.innerHTML = '';
    myquery_temp_instance = null;
}

function myQuery_show_note(text){
    let html = '<p style="color:black;">' + text + '</p>';
    html += '';
    myQuery_show(html, 'note');
}

function myQuery_show_error(text){
    let html = '<p style="color:red;">' + text + '</p>';
    html += '';
    myQuery_show(html, 'note');
}

let slot_id = 1;

function generateNewSlotID(){
    let found = false;
    let name = '';
    while (!found) {
        slot_id += 1;
        name = 's'+slot_id;
        found = true;
        let slots = editor.workflowblock.getSlotsRecursive();
        for(let i=0;i<slots.length;i++) {
            if (slots[i].id === name) {
                found = false;
            }
        }
    }
    return name;
}

class Slot{
    /**
     * 
     * @param {Block} parent_block
     * @param {string} inout
     * @param {string} name
     * @param {string} text
     * @param {string} type
     * @param {boolean} required
     * @param {string|null} obj_type
     * @param {string} obj_id
     * @param {string} uid
     * @param {string} set_at
     * @param {string} units
     * @param {string} value_type
     */
    constructor(parent_block, inout, name, text, type, required=true, obj_type=null, obj_id='', uid='', set_at='', units='', value_type=''){
        this.id = generateNewSlotID();
        if(uid !== '')
            this.id = uid;

        this.code_name = name;
        this.name = name;
        this.text = text;
        this.parent_block = parent_block;
        this.units = units;
        this.value_type = value_type;

        this.type = type;
        this.required = required;
        this.obj_id = obj_id;
        this.obj_type = obj_type;
        this.inout = inout;
        this.max_connections = 999;
        if(this.inout === 'in')
            this.max_connections = 1;
        this.external = false;
        /** @type {Slot} */
        this.redirect_for_slot_params = null
        
        this.set_at = set_at;
    }

    /** @returns {boolean} */
    getRedirectionForParams(){
        return this.redirect_for_slot_params !== null;
    }

    /** @param slot {Slot} */
    setRedirectionForParams(slot){
        this.redirect_for_slot_params = slot;
    }
    
    /** @returns {Slot|null} */
    getRedirectedSlot(){
        if(this.redirect_for_slot_params){
            return this.redirect_for_slot_params.getLinkedDataSlot();
        }
        return null;
    }

    /** @returns {boolean} */
    connected(){
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++)
            if(all_datalinks[i].slot1 === this || all_datalinks[i].slot2 === this)
                return true;
        return false;
    }

    getNumConnections(){
        let num = 0;
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++)
            if(all_datalinks[i].slot1 === this || all_datalinks[i].slot2 === this)
                num++;
        return num;
    }

    getLinkedDataSlot(){
        if(this.inout === 'out' && this.external === false)
            console.log('Warning: function getLinkedDataSlot should be used only for input dataslots!');
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++) {

            if (all_datalinks[i].slot2 === this)
                return all_datalinks[i].slot1;
            // following two lines should never be used due to the fact, that slot1 of each datalink should be an output dataslot
            if (all_datalinks[i].slot1 === this)
                return all_datalinks[i].slot2;
        }
        return null;
    }

    getDataID(){
        if(this.getRedirectionForParams()){
            let s = this.getRedirectedSlot();
            if(s){
                return s.getDataID();
            }
        }
        return this.obj_type;
    }

    getObjectID(){return this.obj_id;}

    getDataType(){
        if(this.getRedirectionForParams()){
            let s = this.getRedirectedSlot();
            if(s){
                return s.getDataType();
            }
        }
        return this.type;
    }

    getSetAt(){
        if(this.getRedirectionForParams()){
            let s = this.getRedirectedSlot();
            if(s){
                return s.getSetAt();
            }
        }
        return this.set_at;
    }

    getParentBlock(){return this.parent_block;}

    getCodeRepresentation(){return "self." + this.code_name;}
    
    getUnits(){
        if(this.getRedirectionForParams()){
            let s = this.getRedirectedSlot();
            if(s){
                return s.getUnits();
            }
        }
        return this.units;
    }

    getUID(){return this.id;}

    getName(){return this.name;}

    getClassName(){return 'Slot';}

    getValueType(){
        if(this.getRedirectionForParams()){
            let s = this.getRedirectedSlot();
            if(s){
                return s.getValueType();
            }
        }
        return this.value_type;
    }

    getDictForJSON(){
        return {
            'classname': this.getClassName(),
            'name': this.name,
            'type': this.type,
            'obj_type': this.obj_type,
            'obj_id': this.obj_id,
            'inout': this.inout,
            'uid': this.getUID()
        };
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getSlotHtml(){
        let temp_inout = inout_invertor(this.inout, this.external);

        let html = '';
        if(temp_inout === 'in')
            html = '<div class="slot_input" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;"><div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div><div class="slot_name">'+this.name+'</div></div>';
        if(temp_inout === 'out')
            html = '<div class="slot_output" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;"><div class="slot_name">'+this.name+'</div><div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div></div>';
        return html;
    }

    getDataslotDiv(){
        return document.getElementById(this.id);
    }
}

class SlotExt extends Slot{
    /**
     * 
     * @param {Block} parent_block
     * @param {string} inout
     * @param {string} name
     * @param {string} text
     * @param {string} type
     * @param {boolean} required
     * @param {string} obj_type
     * @param {string} uid
     */
    constructor(parent_block, inout, name, text, type, required=true, obj_type='None', uid=''){
        super(parent_block, inout, name, text, type, required, obj_type, name, uid);
        this.external = true;
    }

    getClassName(){return 'SlotExt';}
}

function inout_invertor(val, invert){
    if(val==='in'){
        if(invert)
            return 'out';
        return 'in';
    }
    if(val==='out'){
        if(invert)
            return 'in';
        return 'out';
    }
    return '';
}

class WorkflowEditor{
    constructor(){
        this.workflowblock = null;
        this.datalinks = [];

        this.list_of_model_metadata = [];

        this.one_elem_check_disabling_propagation = false;
        this.selected_block = null;
        this.selected_slot_1 = null;
        this.selected_slot_2 = null;
        this.selected_datalink = null;
        this.selected_slot_ext = null;

        this.visual = true;
    }

    /**
     * @param {Slot} s1
     * @param {Slot} s2
     * @returns {Datalink} */
    addDatalink(s1, s2){
        if(s1 && s2) {
            if (s1 !== s2) {
                if (s1.inout !== s2.inout) {
                    if (s1.getNumConnections() < s1.max_connections && s2.getNumConnections() < s2.max_connections) {
                        if (s1.parent_block !== s2.parent_block) {
                            if (s1.external === true || s2.external === true) {
                                if (s1.external === true && s2.external === true) {
                                    console.log('Two external slots can not be connected.');
                                    if(this.visual)
                                        myQuery_show_error('Two external slots can not be connected.');
                                    return null;
                                }

                            } else {
                                // // none of the slots is external
                                // if(s1.obj_type !== s2.obj_type){
                                //     myQuery_show_error('The slots must have identical ValueType to be connected.<br>('+s1.obj_type+' X '+s2.obj_type+')');
                                //     return null;
                                // }
                            }


                            let dl = new Datalink(s1, s2);
                            this.datalinks.push(dl);
                            return dl;
                        } else {
                            console.log('Slots within one block can not be connected.');
                            if(this.visual)
                                myQuery_show_error('Slots within one block can not be connected.');
                        }
                    } else {
                        let slot_naming = '';
                        if (s1.getNumConnections() === s1.max_connections)
                            slot_naming += '<br>(' + s1.name + ')';
                        if (s2.getNumConnections() === s2.max_connections)
                            slot_naming += '<br>(' + s2.name + ')';
                        console.log('One of the slots can not accept more connections.' + slot_naming);
                        if(this.visual)
                            myQuery_show_error('One of the slots can not accept more connections.' + slot_naming);
                    }
                } else {
                    console.log('Only input and output dataslot can be connected.<br>(Or input and external input or output and external output)');
                    if(this.visual)
                        myQuery_show_error('Only input and output dataslot can be connected.<br>(Or input and external input or output and external output)');
                }
            }
        }
        return null;
    }

    removeDatalink(dl) {
        let temp_datalinks = [];
        for (let i = 0; i < this.datalinks.length; i++)
            if (this.datalinks[i] !== dl)
                temp_datalinks.push(this.datalinks[i]);
        this.datalinks = temp_datalinks;
    }

    getExecutionCode(){
        return formatCodeToText(this.workflowblock.generateCode(false));
    }

    getClassCode(){
        return formatCodeToText(this.workflowblock.generateCode(true));
    }

    getMetadata(){
        return replaceAllInStr(replaceAllInStr(formatCodeToText(this.workflowblock.generateMetadataJson()), 'True', 'true'), 'False', 'false');
    }

    getServerCode(){
        return formatCodeToText(this.workflowblock.generateCodeForServer());
    }

    getJSON(){
        return this.workflowblock.getDictForJSON();
    }

    getBlockByUID(uid){
        if(this.workflowblock.getUID() === uid)
            return this.workflowblock;
        let blocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++)
            if(blocks[i].getUID() === uid)
                return blocks[i];
        return null;
    }

    getDatalinkByUID(uid){
        for(let i=0;i<this.datalinks.length;i++)
            if(this.datalinks[i].id === uid)
                return this.datalinks[i];
        return null;
    }

    getSlotByUID(uid){
        let slots = this.workflowblock.getSlotsRecursive();
        for(let i=0;i<slots.length;i++)
            if(slots[i].id === uid)
                return slots[i];
        return null;
    }

    // getSlotByUID(uid){
    //     let slots = this.workflowblock.getSlotsRecursive();
    //     for(let i=0;i<slots.length;i++)
    //         if(slots[i].id === uid)
    //             return slots[i];
    //     return null;
    // }

    addBlockByJsonRecord(json_data){
        let parent_block;
        let new_block = null;
        let slot;
        let slots;

        if(json_data['classname']==='BlockWorkflow'){
            this.workflowblock.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                this.workflowblock.child_block_sort = json_data['child_block_sort'];

            let inout = '';
            for(let i=0;i<json_data['ext_slots'].length;i++){
                slot = json_data['ext_slots'][i];
                if(slot['inout']==='in' || slot['inout']==='out') {
                    if(slot['inout']==='in')
                        inout = 'out';
                    if(slot['inout']==='out')
                        inout = 'in';
                    this.workflowblock.addExternalDataSlot(inout, slot['name'], slot['type'], slot['obj_type'], slot['uid']);
                }
            }
        }
        if(json_data['classname']==='BlockConstPhysicalQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPhysicalQuantity(this, parent_block, json_data['value'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockConstProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockProperty(this, parent_block, json_data['value'], json_data['propID'], json_data['valueType'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockInputFile'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockInputFile(this, parent_block, json_data['filename']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockTimeloop'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockTimeloop(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockAllocateModelAtRuntime'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockAllocateModelAtRuntime(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockRunInBackground'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockRunInBackground(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockDoWhile'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockDoWhile(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockModel'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockModel(this, parent_block, json_data['metadata'], json_data['model_working_directory']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockValueComparison'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockValueComparison(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockPropertyToQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPropertyToQuantity(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockQuantityToProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockQuantityToProperty(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockNumberToQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockNumberToQuantity(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockNumberToProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockNumberToProperty(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockDataListLength'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockDataListLength(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockVariable'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockVariable(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockGetItemFromDataList'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockGetItemFromDataList(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockWaitForBackgroundProcesses'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockWaitForBackgroundProcesses(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }

        if(new_block != null){
            slots = new_block.getSlots('in');
            for(let i=0;i<slots.length && i<json_data['slot_in_uids'].length;i++)
                slots[i].id = json_data['slot_in_uids'][i];

            slots = new_block.getSlots('out');
            for(let i=0;i<slots.length && i<json_data['slot_out_uids'].length;i++)
                slots[i].id = json_data['slot_out_uids'][i];
        }

    }

    addDatalinkByJsonRecord(json_data){
        let s1 = this.getSlotByUID(json_data['ds1_uid']);
        let s2 = this.getSlotByUID(json_data['ds2_uid']);
        if(s1 != null && s2 != null)
            this.addDatalink(s1, s2);
    }

    loadFromJsonData(json_data){
        this.workflowblock = new BlockWorkflow(this, null);
        console.log('Constructing project from JSON.');
        if(json_data.constructor === {}.constructor) {
            if('blocks' in json_data && 'datalinks' in json_data && 'settings' in json_data) {
                for (let i = 0; i < json_data['blocks'].length; i++)
                    this.addBlockByJsonRecord(json_data['blocks'][i]);
                for (let i = 0; i < json_data['datalinks'].length; i++)
                    this.addDatalinkByJsonRecord(json_data['datalinks'][i]);
                if('project_name' in json_data['settings'])
                    this.workflowblock.project_name = json_data['settings']['project_name'];
                else
                    console.log('Project name was not in settings.');
                if('project_classname' in json_data['settings'])
                    this.workflowblock.project_classname = json_data['settings']['project_classname'];
                else
                    console.log('Project classname was not in settings.');
                if('project_modulename' in json_data['settings'])
                    this.workflowblock.project_modulename = json_data['settings']['project_modulename'];
                else
                    console.log('Project modulename was not in settings.');
                if('project_id' in json_data['settings'])
                    this.workflowblock.project_id = json_data['settings']['project_id'];
                else
                    console.log('Project ID was not in settings.');
                if('project_nshost' in json_data['settings'])
                    this.workflowblock.project_nshost = json_data['settings']['project_nshost'];
                if('project_nsport' in json_data['settings'])
                    this.workflowblock.project_nsport = json_data['settings']['project_nsport'];
                if('jobman_settings' in json_data['settings']){
                    this.workflowblock.jobman_name = json_data['settings']['jobman_settings']['name'];
                }
                if('connection_type' in json_data['settings'])
                    this.workflowblock.exec_type = json_data['settings']['connection_type'];
                if('script_name_base' in json_data['settings'])
                    this.workflowblock.script_name_base = json_data['settings']['script_name_base'];
            }else{
                console.log('ERROR: The JSON does not contain keys \'blocks\' or/and \'datalinks\' or/and \'settings\'!');
            }
        }else{
            console.log('ERROR: Passed variable must be a dictionary!');
        }
    }

    setProjectName(val){
        this.workflowblock.project_name = val;
    }

    setProjectClassName(val){
        this.workflowblock.project_classname = val;
    }

    setProjectModuleName(val){
        this.workflowblock.project_modulename = val;
    }

    setProjectID(val){
        this.workflowblock.project_id = val;
    }

    setProjectNSHost(val){
        this.workflowblock.project_nshost = val;
    }

    setProjectNSPort(val){
        this.workflowblock.project_nsport = val;
    }
    
    getJobmanName(){
        return this.workflowblock.jobman_name;
    }

    selectSettingsAndUpdate(){
        this.updateHtmlOfProjectSettings();
        focusOnProjectSettings();
    }

    updateHtmlOfProjectSettings(){
        let slots;
        let slot;
        
        let html = '';

        html += '<div class="settings_section">';
        
        html += '<h2><b>Project settings</b></h2>';
        html += '<table cellspacing="0" class="settings">';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>Name:</td>';
        html += '<td><b>'+this.workflowblock.project_name+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_name+'" id="new_project_name"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ClassName:</td>';
        html += '<td><b>'+this.workflowblock.project_classname+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_classname+'" id="new_project_classname"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ModuleName:</td>';
        html += '<td><b>'+this.workflowblock.project_modulename+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_modulename+'" id="new_project_modulename"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ID:</td>';
        html += '<td><b>'+this.workflowblock.project_id+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_id+'" id="new_project_id"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';
        html += '<tr><td colspan="10" style="height:10px;border-top:1px solid black"></td>';

        html += '<tr>';
        html += '<td>Default NameServer host:</td>';
        html += '<td><b>'+this.workflowblock.project_nshost+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_nshost+'" id="new_project_nshost"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>Default NameServer port:</td>';
        html += '<td><b>'+this.workflowblock.project_nsport+'</b></td>';
        html += '<td><input type="text" value="'+this.workflowblock.project_nsport+'" id="new_project_nsport"></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';
        html += '<tr><td colspan="10" style="height:10px;border-top:1px solid black"></td>';

        

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td><button onclick="editor.save_project_detials();">Save</button></td>';
        html += '</tr>';

        html += '</table>';

        html += '</div>';

        //

        html += '<div class="settings_section">';
        
        html += '<h2><b>External data slots</b></h2>';
        html += '<table class="tbl_ext_slots" cellspacing="0">';

        html += '<tr><td colspan="10" style="height:10px;"></td>';
        html += '<tr>';
        html += '<td>#</td>';
        html += '<td>name</td>';
        html += '</tr>';
        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td colspan="10"><b>Inputs:</b></td>';
        html += '</tr>';

        slots = this.workflowblock.output_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            html += '<tr>';
            html += '<td>'+i+']</td>';

            html += '<td><input id="in_slot_'+i+'_name" value="' + slot.name + '"></td>';

            html += '</tr>';
        }

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td colspan="10"><b>Outputs:</b></td>';
        html += '</tr>';

        slots = this.workflowblock.input_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            html += '<tr>';
            html += '<td>'+i+']</td>';

            html += '<td><input id="out_slot_'+i+'_name"  value="' + slot.name + '"></td>';
            html += '</tr>';
        }

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td><button onclick="editor.save_external_data_slots();">Save</button></td>';

        html += '</tr>';

        html += '</table>';

        html += '</div>';

        document.getElementById('block_list_of_settings').innerHTML = html;
    }

    save_external_data_slots(){
        let slots;
        let slot;

        slots = this.workflowblock.output_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            slot.name = document.getElementById('in_slot_'+i+'_name').value;
        }

        slots = this.workflowblock.input_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            slot.name = document.getElementById('out_slot_'+i+'_name').value;
        }

        console.log('External data slots saved');
        this.generateWorkflowHtml();
    }

    save_project_detials(){
        let val;
        val = document.getElementById('new_project_name').value;
        this.setProjectName(val);
        val = document.getElementById('new_project_classname').value;
        this.setProjectClassName(val);
        val = document.getElementById('new_project_modulename').value;
        this.setProjectModuleName(val);
        val = document.getElementById('new_project_id').value;
        this.setProjectID(val);
        val = document.getElementById('new_project_nshost').value;
        this.setProjectNSHost(val);
        val = document.getElementById('new_project_nsport').value;
        this.setProjectNSPort(val);
        
        this.updateHtmlOfProjectSettings();
        console.log('Project settings saved');
        this.generateWorkflowHtml();
    }

    download(filename, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    menu_download_exec_code(){
        let code = this.getExecutionCode();
        if(code !== '')
            this.download(this.workflowblock.project_modulename + ".py", code);
    }

    menu_download_class_code(){
        let code = this.getClassCode();
        if(code !== '')
            this.download(this.workflowblock.project_modulename + ".py", code);
    }

    menu_download_json(){
        let code = this.getJSON();
        this.download("project.json", JSON.stringify(code, null, 4));
    }

    download_ith_metadata(md_id){
        this.download("md.json", JSON.stringify(editor.list_of_model_metadata[md_id]));
    }

    generateWorkflowHtml(){
        // workflow content
        this.workflowblock.generateAllElementCodeNames();
        // this.generateAllDatalinksCodeNames();

        let code = '';
        code += this.workflowblock.getBlockHtml();
        let container = document.getElementById('workflowSubContainer');
        code += '';
        container.innerHTML = code;

        // datalinks
        for(let i=0;i<this.datalinks.length;i++)
            container.innerHTML += this.datalinks[i].getDatalinkHtml();
    }

    getAllBlocks(){
        let blocks = [];
        blocks.push(this.workflowblock);
        let subblocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<subblocks.length;i++){
            blocks.push(subblocks[i]);
        }
        return blocks;
    }

    deleteDatalinksLinkedToSlot(slot){
        let dls_to_remove = [];
        for(let j=0;j<this.datalinks.length;j++){
            if(this.datalinks[j].slot1 === slot || this.datalinks[j].slot2 === slot)
                dls_to_remove.push(this.datalinks[j]);
        }

        for(let i=0;i<dls_to_remove.length;i++) {
            this.removeDatalink(dls_to_remove[i]);
        }
    }

    deleteExtSlot(slot){
        this.deleteDatalinksLinkedToSlot(slot);
        this.workflowblock.deleteSlot(slot);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='delete_selected_datalink') {
            if(this.selected_datalink)
                this.removeDatalink(this.selected_datalink);
        }
        if(action==='delete_selected_block') {
            if(this.selected_block)
                this.selected_block.deleteSelf();
        }
        if(action==='delete_selected_ext_slot') {
            if(this.selected_slot_ext)
                this.deleteExtSlot(this.selected_slot_ext);
        }
        myQuery_hide();
        this.generateWorkflowHtml();
    }


}
