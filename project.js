
let editor;// The Workflow Editor instance

let example_id = 0;// Global defining optional example

let loaded_json = null;

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

        this.child_block_sort = 'horizontal';

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
            this.addInputSlot(new SlotExt(this, 'in', name, name, type, true, obj_type));
        }
        if(inout === 'in') {
            if(name === null)
                name = 'external_input';
            this.addOutputSlot(new SlotExt(this, 'out', name, name, type, true, obj_type));
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

    getBlocks(){
        return this.blocks;
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
            block = new BlockPhysicalQuantity(this.editor, this, 0, 'None');
        if (name === "property")
            block = new BlockProperty(this.editor, this, '(0.,)', 'mupif.PropertyID.PID_None', 'mupif.ValueType.Scalar', 'none', '0');
        if (name === "timeloop")
            block = new BlockTimeloop(this.editor, this);
        if (name === "dowhile")
            block = new BlockDoWhile(this.editor, this);
        if (name === "model")
            block = new BlockModel(this.editor, this, {});


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

    setDataSlotText(slot, val){
        let text = val;
        if(slot.inout === 'out')
            text = val+' --';
        slot.text = text;
        this.graph.model.setValue(slot.instance, slot.text);
    }

    getUID(){
        return this.getCodeName();
    }

    getClassName(){
        return 'Block';
    }

    getDictForJSON(){
        let slot_dict = {};
        let slots = this.getSlots();
        for (let i = 0; i < slots.length; i++)
            slot_dict[i] = slots[i].getUID();
        // slot_dict[slots[i].getName()] = slots[i].getUID();

        return {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': this.parent_block.getUID(),
            'slot_uids': slot_dict
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
        html += '<table cellspacing="0" class="table_over_content">';
        html += '<tr><td>';
        html += this.getBlockHtml_slots_input();
        html += '</td><td>';
        html += this.getBlockHtml_slots_output();
        html += '</td></tr>';
        html += '</table>';
        html += this.getBlockHtml_content();
        html += this.getBlockHtml_footer();
        html += this.getBlockHtml_menu();
        return html;

        // let html = '';
        // html += this.getBlockHtml_header();
        // html += this.getBlockHtml_params();
        // html += this.getBlockHtml_slots_input();
        // html += this.getBlockHtml_slots_output();
        // html += this.getBlockHtml_content();
        // html += this.getBlockHtml_footer();
        // html += this.getBlockHtml_menu();
        // return html;
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
        let html = '<div class="bl_content">';
        let n_blocks = this.blocks.length;
        for(let i=0;i<n_blocks;i++) {
            html += this.blocks[i].getBlockHtml();
            if(this.child_block_sort === 'vertical')
                html += '<br>';
        }
        html += '</div>';
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

        this.addInputSlot(new Slot(this, 'in', 'do', 'do', 'mupif.Property', true));
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

    getDo(time){
        let connected_slot = this.getDataSlotWithName("do").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot, time);
        return 'False';
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_compute = this.code_name + "_compute";

        code.push(var_compute + " = True");

        code.push("while " + var_compute + ":");
        let while_code = [];

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            while_code = while_code.concat(blocks[i].getExecutionCode(1, timestep, solvefunc));
        }

        code = code.concat(while_code);

        code.push("\t");
        let ts = this.getTimestepVariableNameFromSelfOrParent();
        if(timestep !== "")
            ts = timestep;

        let ti;
        if(ts !== "None")
            ti = ts + ".getTime()";
        else
            ti = "0*mupif.Q.s";
        code.push("\t" + var_compute + " = "+this.getDo(ti));

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
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Do While';
    }

}

class BlockModel extends Block {
    constructor(editor, parent_block, md = {}, input_file_name="", input_file_directory="") {
        super(editor, parent_block);
        // this.md = md;

        this.input_file_name = input_file_name;
        this.input_file_directory = input_file_directory;

        this.exec_type = "";
        this.exec_settings_jobmanagername = "";

        // this.loadDataFromMetadata();
        this.setMetadata(md);

        if ('Inputs' in this.md && 'Outputs' in this.md)
            this.constructSlots();


    }

    loadDataFromMetadata() {
        if ('ClassName' in this.md) {
            this.name = this.md['ClassName'];
            this.model_name = this.md['ClassName'];
        } else {
            if ('ID' in this.md)
                this.name = 'Model | ' + this.md['ID'];// + ' | ' + this.md['Name']
            else
                this.name = 'Model';
        }
        if ('Name' in this.md) {
            this.name = this.md['Name'];
        }
        if ('ModuleName' in this.md)
            this.model_module = this.md['ModuleName'];
        if ('Execution_type' in this.md)
            if(this.md['Execution_type'] === 'Distributed'){
                this.exec_type = this.md['Execution_type'];
                if('Execution_settings_jobManagerName' in this.md)
                    this.exec_settings_jobmanagername = this.md['Execution_settings_jobManagerName'];
            }else{
                this.exec_type = 'Local';
            }

    }

    constructSlots() {
        this.input_slots = [];
        this.output_slots = [];
        let md = this.md;
        let name;
        for (let i = 0; i < md['Inputs'].length; i++) {
            if ('Obj_ID' in md['Inputs'][i]) {
                if (md['Inputs'][i]['Obj_ID'].length === 0)
                    md['Inputs'][i]['Obj_ID'] = [0];
            } else
                md['Inputs'][i]['Obj_ID'] = [0];
            for (let ii = 0; ii < md['Inputs'][i]['Obj_ID'].length; ii++) {
                name = md['Inputs'][i]['Name'];
                if (md['Inputs'][i]['Obj_ID'][ii] !== '')
                    name += ' [' + md['Inputs'][i]['Obj_ID'][ii] + ']';
                this.addInputSlot(new Slot(this, 'in', name, name, md['Inputs'][i]['Type'], md['Inputs'][i]['Required'], md['Inputs'][i]['Type_ID'], md['Inputs'][i]['Obj_ID'][ii]));// + '(' + md['Inputs'][i]['Type'] + ', ' + md['Inputs'][i]['Type_ID'] + ')'
            }
        }

        for (let i = 0; i < md['Outputs'].length; i++) {
            if ('Obj_ID' in md['Outputs'][i]) {
                if (md['Outputs'][i]['Obj_ID'].length === 0)
                    md['Outputs'][i]['Obj_ID'] = [0];
            } else
                md['Outputs'][i]['Obj_ID'] = [0];
            for (let ii = 0; ii < md['Outputs'][i]['Obj_ID'].length; ii++) {
                name = md['Outputs'][i]['Name'];
                if (md['Outputs'][i]['Obj_ID'][ii] !== '')
                    name += ' [' + md['Outputs'][i]['Obj_ID'][ii] + ']';
                this.addOutputSlot(new Slot(this, 'out', name, name, md['Outputs'][i]['Type'], md['Outputs'][i]['Required'], md['Outputs'][i]['Type_ID'], md['Outputs'][i]['Obj_ID'][ii]));// + '(' + md['Outputs'][i]['Type'] + ', ' + md['Outputs'][i]['Type_ID'] + ')'
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

    getJobmanagerName(){
        return this.code_name+"_jobman"
    }

    getInitCode(indent = 0) {
        let code = super.getInitCode();
        if(this.exec_type === "Distributed"){
            code.push("self." + this.code_name + " = None");
        }else {
            if (this.model_module !== "undefined" && this.model_module !== "")
                code.push("self." + this.code_name + " = " + this.model_module + "." + this.model_name + "()");
            else
                code.push("self." + this.code_name + " = " + this.model_name + "()");
        }
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent = 0, metaDataStr = "{}") {
        let code = super.getInitializationCode();
        if(this.exec_type === "Distributed"){
            code.push("ns = mupif.PyroUtil.connectNameServer('172.30.0.1', 9090, 'mupif-secret-key')");
            code.push("self."+this.getJobmanagerName()+" = mupif.PyroUtil.connectJobManager(ns, '"+this.exec_settings_jobmanagername+"', 'mupif-secret-key')");
            code.push("try:");
            code.push("\tself."+this.code_name+" = mupif.PyroUtil.allocateApplicationWithJobManager( ns, self."+this.getJobmanagerName()+", None, 'mupif-secret-key')");
            code.push("\tlog.info('Created "+this.name+" job')");
            code.push("except Exception as e:");
            code.push("\tlog.exception(e)");
            code.push("else:");
            code.push("\tif self."+this.code_name+" is not None:");
            code.push("\t\tsignature = self."+this.code_name+".getApplicationSignature()");
            code.push("\t\tlog.info('Working "+this.name+" solver on server ' + signature)");
            code.push("\telse:");
            code.push("\t\tlog.debug('Connection to server failed, exiting')");
        }

        if(this.exec_type === "Distributed"){
            code.push("loc_workdir = self." + this.code_name + ".getWorkDir() + '/' + self." + this.code_name + ".getJobID()");
            code.push("self." + this.code_name + ".initialize(workdir=loc_workdir, metadata=" + metaDataStr + ")");
        }else{
            code.push("self." + this.code_name + ".initialize(file='" + this.input_file_name + "', workdir='" + this.input_file_directory + "', metadata=" + metaDataStr + ")");
        }

        return push_indents_before_each_line(code, indent)
    }

    getExecutionCode(indent = 0, timestep = "", solvefunc=false) {
        if(timestep === "")
            timestep = this.getTimestepVariableNameFromSelfOrParent();

        let code = super.getExecutionCode();

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
                obj_id = this.input_slots[i].obj_id;
                if (typeof obj_id === 'string')
                    obj_id = "'" + obj_id + "'";
                code.push("self." + this.code_name + ".set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
            }
        }

        code.push("self." + this.code_name + ".solveStep(" + timestep + ")");

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
            return "self." + this.code_name + ".get(" + slot.getObjType() + ", " + time + ", " + obj_id + ")";
        }
        return "None";
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_input_file') {
            this.input_file_name = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Input file was set to "'+this.input_file_name+'"', 'green');
        }
        if(action==='set_work_dir') {
            this.input_file_directory = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Working directory was set to "'+this.input_file_directory+'"', 'green');
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
        if (keyword === 'set_input_file') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Input file:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.input_file_name+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
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
        dict['model_input_file_name'] = this.input_file_name;
        dict['model_input_file_directory'] = this.input_file_directory;
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
            html += 'Input file = <b>\'' + this.input_file_name + '\'</b>';
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

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.PhysicalQuantity', false, 'mupif.ValueType.Scalar'));
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

    setValue(val){
        this.value = val;
        this.setDataSlotText(this.output_slots[0], "value = "+this.value);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_value') {
            this.value = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Value set to "'+this.value+'"', 'green');
        }
        if(action==='set_units') {
            this.units = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Units set to "'+this.units+'"', 'green');
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
        return 'we_block we_block_physicalquantity';
    }

    getBlockHtmlName(){
        return 'Physical Quantity';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>\'' + this.value + '\'</b>';
        html += '<br>';
        html += 'Units = <b>\'' + this.units + '\'</b>';

        html += '</div>';
        return html;
    }

}

class BlockProperty extends Block{
    constructor(editor, parent_block, value, property_id, value_type, units, object_id){
        super(editor, parent_block);
        this.value = value;
        this.property_id = property_id;
        this.value_type = value_type;
        this.units = units;
        this.object_id = object_id;
        this.name = 'Property';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.Property', false, this.value_type));
    }

    generateCodeName(all_blocks, base_name='constant_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.property.ConstantProperty(value="+this.value+", propID="+this.property_id+", valueType="+this.value_type+", unit=mupif.U."+this.units+", time=None, objectID="+this.object_id+")");
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
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_obj_id', '', 'Object&nbsp;ID'), 'Set');
    }

    setValue(val){
        this.value = val;
        this.setDataSlotText(this.output_slots[0], "value = "+this.value);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_value') {
            this.value = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Value set to "'+this.value+'"', 'green');
        }
        if(action==='set_units') {
            this.units = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Units set to "'+this.units+'"', 'green');
        }
        if(action==='set_property_id') {
            this.property_id = 'mupif.PropertyID.'+document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Property ID set to "'+this.property_id+'"', 'green');
        }
        if(action==='set_value_type') {
            this.value_type = 'mupif.ValueType.'+document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Value type set to "'+this.value_type+'"', 'green');
        }
        if(action==='set_obj_id') {
            this.object_id = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Object ID set to "'+this.object_id+'"', 'green');
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
            for(let i=0;i<mupif_PropertyID.length;i++) {
                q_html += '<option value="'+mupif_PropertyID[i]+'"';
                if(this.property_id === 'mupif.PropertyID.'+mupif_PropertyID[i])
                    q_html += ' selected';
                q_html += '>'+mupif_PropertyID[i]+'</option>';
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

        if(keyword === 'set_obj_id'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set ObjectID:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.object_id+'" style="width:100px;">';
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
        dict['objectID'] = this.object_id;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_property';
    }

    getBlockHtmlName(){
        return 'Property';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>\'' + this.value + '\'</b>';
        html += '<br>';
        html += 'Units = <b>\'' + this.units + '\'</b>';
        html += '<br>';
        html += 'ValueType = <b>\'' + this.value_type.replace('mupif.ValueType.', '') + '\'</b>';
        html += '<br>';
        html += 'PropertyID = <b>\'' + this.property_id.replace('mupif.PropertyID.', '') + '\'</b>';
        html += '<br>';
        html += 'ObjectID = <b>\'' + this.object_id + '\'</b>';

        html += '</div>';
        return html;
    }

}

class BlockTimeloop extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = 'TimeLoop';
        this.defines_timestep = true;

        this.addInputSlot(new Slot(this, 'in', 'start_time', 'start_time', 'mupif.PhysicalQuantity', false));
        this.addInputSlot(new Slot(this, 'in', 'target_time', 'target_time', 'mupif.PhysicalQuantity', false));
        this.addInputSlot(new Slot(this, 'in', 'max_dt', 'max_dt', 'mupif.PhysicalQuantity', true));
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

        let model_blocks = this.getBlocks(BlockModel.BlockModel);
        for(let i=0;i<model_blocks.length;i++) {
            if (!first)
                dt_code += ", ";
            dt_code += "self." + model_blocks[i].code_name + ".getCriticalTimeStep()";
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

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Time Loop';
    }

}

class BlockWorkflow extends Block{
    constructor(editor, parent_block){
        super(editor, null);
        this.name = 'Workflow';

        this.settings_project_name = 'My unnamed project';
        this.settings_project_classname = 'MyUnnamedProject';
        this.settings_project_modulename = 'MyModuleName';
        this.settings_project_id = 'my_unnamed_project_01';

    }

    getAllExternalDataSlots(inout){
        return this.getSlots(inout);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return slot.getCodeRepresentation();
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
            slots[i].id = '';
        slot_id = 0;
        for(let i=0;i<slots.length;i++)
            if(!slots[i].external)
                slots[i].id = generateNewSlotID();
        slots = this.getAllExternalDataSlots('in');
        for(let i=0;i<slots.length;i++)
            slots[i].id = 'external_output_'+(i+1);
        slots = this.getAllExternalDataSlots('out');
        for(let i=0;i<slots.length;i++)
            slots[i].id = 'external_input_'+(i+1);
    }

    generateCode(class_code){
        console.log('Generating Python code.');

        let num_of_external_input_dataslots = 0;

        this.generateAllElementCodeNames();

        let all_model_blocks = this.getBlocksRecursive(BlockModel);
        let child_blocks = this.getBlocks();

        let code = ["import mupif", "import copy"];

        let model_blocks = this.getBlocksRecursive(BlockModel);
        let imported_modules = [];
        for(let i=0;i<model_blocks.length;i++) {
            if(model_blocks[i].model_module !== "") {
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
        code.push("class " + this.settings_project_classname + "(mupif.workflow.Workflow):");

        // __init__ function

        code.push("\t");
        code.push("\tdef __init__(self, metadata={}):");

        code.push("\t\tMD = {");
        code.push("\t\t\t\"ClassName\": \"" + this.settings_project_classname + "\",");
        code.push("\t\t\t\"ModuleName\": \"" + this.settings_project_modulename + "\",");
        code.push("\t\t\t\"Name\": \"" + this.settings_project_name + "\",");
        code.push("\t\t\t\"ID\": \"" + this.settings_project_id + "\",");
        code.push("\t\t\t\"Description\": \"\",");


        let slots;
        let params;
        let s;
        code.push("\t\t\t\"Inputs\": [");
        slots = this.getAllExternalDataSlots("out");
        for (let i=0;i<slots.length;i++) {
            s = slots[i];
            if (s.connected()) {
                num_of_external_input_dataslots += 1;
                params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.type + "\", " +
                    "\"Required\": True, \"description\": \"\", " +
                    "\"Type_ID\": \"" + s.getLinkedDataSlot().getObjType() + "\", " +
                    "\"Obj_ID\": [\"" + s.getObjID() + "\"], " +
                    "\"Units\": \"\"";
                code.push("\t\t\t\t{" + params + "},");
            }
        }
        code.push("\t\t\t],");

        code.push("\t\t\t\"Outputs\": [");
        slots = this.getAllExternalDataSlots("in");
        for (let i=0;i<slots.length;i++) {
            s = slots[i];
            if (s.connected()) {
                num_of_external_input_dataslots += 1;
                params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.type + "\", " +
                    "\"description\": \"\", " +
                    "\"Type_ID\": \"" + s.getLinkedDataSlot().getObjType() + "\", " +
                    "\"Obj_ID\": [\"" + s.getObjID() + "\"], " +
                    "\"Units\": \"\"";
                code.push("\t\t\t\t{" + params + "},");
            }
        }
        code.push("\t\t\t],");

        code.push("\t\t}");

        code.push("\t\tmupif.workflow.Workflow.__init__(self, metadata=MD)");

        // metadata
        // code.push("\t\tself.setMetadata('Name', '" + this.settings_project_name + "')");
        // code.push("\t\tself.setMetadata('ID', '" + this.settings_project_id + "')");
        // code.push("\t\tself.setMetadata('Description', '')");

        code.push("\t\tself.updateMetadata(metadata)");

        let code_add;
        if(class_code) {
            // initialization of workflow inputs
            slots = this.getAllExternalDataSlots("out");
            for (let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected()) {
                    code.push("\t");
                    code.push("\t\t# initialization code of external input");
                    code.push("\t\t" + s.getCodeRepresentation() + " = None");
                    code.push("\t\t# It should be defined from outside using set() method.");
                }
            }
        }

        // init codes of child blocks

        let allBlocksRecursive = this.getBlocksRecursive();
        for(let i=0;i<allBlocksRecursive.length;i++)
            extend_array(code, allBlocksRecursive[i].getInitCode(2));

        code.push("");

        // TODO temporarily disabled in master branch
        let model;
        code.push("\t\tself.setMetadata('Model_refs_ID', [])");

        for (let i=0;i<all_model_blocks.length;i++) {
            model = all_model_blocks[i];
            if(model.exec_type === "Local")
                code.push("\t\tself.registerModel(self." + model.getCodeName() + ")");
        }

        // initialize function

        code.push("\t");
        code.push("\tdef initialize(self, file='', workdir='', targetTime=0*mupif.Q.s, metadata={}, validateMetaData=True, **kwargs):");

        code.push("\t\t");

        code.push("\t\tself.updateMetadata(dictionary=metadata)");

        code.push("\t\t");
        code.push("\t\texecMD = {");
        code.push("\t\t\t'Execution': {");
        code.push("\t\t\t\t'ID': self.getMetadata('Execution.ID'),");
        code.push("\t\t\t\t'Use_case_ID': self.getMetadata('Execution.Use_case_ID'),");
        code.push("\t\t\t\t'Task_ID': self.getMetadata('Execution.Task_ID')");
        code.push("\t\t\t}");
        code.push("\t\t}");

        for (let i=0;i<all_model_blocks.length;i++) {
            extend_array(code, all_model_blocks[i].getInitializationCode(2, "execMD"));
        }

        code.push("\t\t");

        code.push("\t\tmupif.workflow.Workflow.initialize(self, file=file, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)");

        // get critical time step function

        if(class_code) {
            code.push("\t");
            code.push("\tdef getCriticalTimeStep(self):");
            code_add = "";
            let ii = 0;
            for (let i=0;i<child_blocks.length;i++) {
                model = child_blocks[i];
                if(model instanceof BlockModel) {
                    if (ii)
                        code_add += ", ";
                    code_add += "self." + model.code_name + ".getCriticalTimeStep()";
                    ii += 1;
                }
            }
            code.push("\t\treturn min([" + code_add + "])");

            //
            //
            // set method

            code.push("\t");
            code.push("\t# set method for all external inputs");
            code.push("\tdef set(self, obj, objectID=0):");

            code.push("\t\t\t");
            code.push("\t\t# in case of Property");
            code.push("\t\tif isinstance(obj, mupif.property.Property):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("out");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if (s.connected())
                    if (s.type === 'mupif.Property') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                    }
            }

            code.push("\t\t\t");
            code.push("\t\t# in case of Field");
            code.push("\t\tif isinstance(obj, mupif.field.Field):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("out");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if (s.connected())
                    if (s.type === 'mupif.Field') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                    }
            }

            //
            //
            // get method

            code.push("\t");
            code.push("\t# get method for all external outputs");
            code.push("\tdef get(self, objectType, time=None, objectID=0):");
            code.push("\t\t\t");
            code.push("\t\t# in case of Property");
            code.push("\t\tif isinstance(objectType, mupif.PropertyID):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("in");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected())
                    if(s.type === 'mupif.Property') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\treturn self." + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'))
                    }
            }

            code.push("\t\t\t");
            code.push("\t\t# in case of Field");
            code.push("\t\tif isinstance(objectType, mupif.FieldID):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("in");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected())
                    if(s.type === 'mupif.Field') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\treturn " + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'))
                    }
            }

            code.push("\t\t");
            code.push("\t\treturn None");
        }

        // terminate method

        code.push("\t");
        code.push("\tdef terminate(self):");
        code.push("\t\tpass");
        for(let i=0;i<all_model_blocks.length;i++) {
            model = all_model_blocks[i];
            code.push("\t\tself." + model.code_name + ".terminate()");
        }
        code.push("\t");

        // solve or solveStep function

        if(class_code)
            code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
        else
            code.push("\tdef solve(self, runInBackground=False):");

        code.push("\t\tpass");

        for(let i=0;i<child_blocks.length;i++) {
            model = child_blocks[i];
            if(class_code)
                code = code.concat(model.getExecutionCode(2, "tstep", false));
            else
                code = code.concat(model.getExecutionCode(2, "", true));
        }

        code.push("");
        code.push("");

        // execution

        if(!class_code || num_of_external_input_dataslots === 0) {
            code.push("if __name__ == '__main__':");
            code.push("\tproblem = " + this.settings_project_classname + "()");
            code.push("\t");
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
            code.push("\t");
            code.push("\tprint('Simulation has finished.')");
            code.push("");
        }

        return replace_tabs_with_spaces_for_each_line(code);
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
        let slot_dict = {};
        let slots = this.getSlots();
        for (let i = 0; i < slots.length; i++)
            slot_dict[slots[i].getName()] = slots[i].getUID();

        for(let i=0;i<slots.length;i++)
            ext_slots.push(slots[i].getDictForJSON());

        let elem_self = {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': 'None',
            'slot_uids': slot_dict,
            'ext_slots': ext_slots
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
            'settings_project_name': this.settings_project_name,
            'settings_project_classname': this.settings_project_classname,
            'settings_project_modulename': this.settings_project_modulename,
            'settings_project_id': this.settings_project_id
        };

        return {'blocks': data_blocks, 'datalinks': data_datalinks, 'settings': settings};
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_workflow';
    }

    getBlockHtmlName(){
        return 'Workflow';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Name = <b>\'' + this.settings_project_name + '\'</b>';
        html += '<br>';
        html += 'ClassName = <b>\'' + this.settings_project_classname + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.settings_project_id + '\'</b>';

        html += '</div>';
        return html;
    }

    getBlockHtmlContent(){
        let html = '';
        html += this.getBlockHtml_header();
        html += this.getBlockHtml_params();
        html += '<table cellspacing="0" class="table_over_content">';
        html += '<tr><td>';
        html += this.getBlockHtml_slots_output();
        html += '</td><td>';
        html += this.getBlockHtml_content();
        html += '</td><td>';
        html += this.getBlockHtml_slots_input();
        html += '</td></tr>';
        html += '</table>';
        html += this.getBlockHtml_footer();
        html += this.getBlockHtml_menu();
        return html;
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



let metaDataThermalStat = {
    'ClassName': 'ThermalModel',
    'ModuleName': 'mupif_examples_models',
    'Name': 'Stationary thermal problem',
    'ID': 'ThermalModel-1',
    'Description': 'Stationary heat conduction using finite elements on rectangular domain',
    'Version_date': '1.0.0, Feb 2019',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet, Neumann',
    'Inputs': [
        {
            'Name': 'edge temperature',
            'Type': 'mupif.Property',
            'Required': false,
            'Type_ID': 'mupif.PropertyID.PID_Temperature',
            'Obj_ID': [
                'Cauchy top',
                'Cauchy bottom',
                'Cauchy left',
                'Cauchy right',
                'Dirichlet top',
                'Dirichlet bottom',
                'Dirichlet left',
                'Dirichlet right'
            ]
        }
    ],
    'Outputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaDataThermalNonStat = {
    'ClassName': 'ThermalNonstatModel',
    'ModuleName': 'mupif_examples_models',
    'Name': 'Non-stationary thermal problem',
    'ID': 'ThermalNonstatModel-1',
    'Description': 'Non-stationary heat conduction using finite elements on a rectangular domain',
    'Version_date': '1.0.0, Feb 2019',
    'Representation': 'Finite volumes',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet, Neumann',
    'Inputs': [
        {
            'Name': 'edge temperature',
            'Type': 'mupif.Property',
            'Required': false,
            'Type_ID': 'mupif.PropertyID.PID_Temperature',
            'Obj_ID': [
                'Cauchy top',
                'Cauchy bottom',
                'Cauchy left',
                'Cauchy right',
                'Dirichlet top',
                'Dirichlet bottom',
                'Dirichlet left',
                'Dirichlet right'
            ]
        }
    ],
    'Outputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaDataMechanical = {
    'ClassName': 'MechanicalModel',
    'ModuleName': 'mupif_examples_models',
    'Name': 'Plane stress linear elastic',
    'ID': 'MechanicalModel-1',
    'Description': 'Plane stress problem with linear elastic thermo-elastic material',
    'Version_date': '1.0.0, Feb 2019',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet',
    'Inputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': true
        }
    ],
    'Outputs': [
        {
            'Name': 'displacement',
            'Type_ID': 'mupif.FieldID.FID_Displacement',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaData_digimatMFAirbus = {
    "ClassName": "",
    "ModuleName": "",
    "Name": "Digimat-MF AIRBUS",
    "ID": "N/A",
    "Description": "Mean Field Homogenization for Airbus case",
    "Version_date": "05/2019",
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time_step", "Name": "Time step", "Description": "Time step", "Units": "s", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixYoung", "Name": "Young matrix", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionYoung", "Name": "Young inclusion", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixPoisson", "Name": "Poisson ratio matrix", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionPoisson", "Name": "Poisson ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionAspectRatio", "Name": "Aspect ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionVolumeFraction", "Name": "Volume fraction inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionDensity", "Name": "density inclusion", "Units": "kg/m**3", "Required": false},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixDensity", "Name": "density matrix", "Units": "kg/m**3", "Required": false}
    ],
    "Outputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time", "Name": "Cummulative time", "Description": "Cummulative time", "Units": "s", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeAxialYoung", "Name": "Composite Axial Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneYoung", "Name": "Composite In-plane Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneShear", "Name": "Composite In-plane Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransverseShear", "Name": "Composite Transverse Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlanePoisson", "Name": "Composite In-plane Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransversePoisson", "Name": "Composite Transverse Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeDensity", "Name": "Composite density", "Units": "kg/m**3"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "eX_DigimatMF_JobManager"
};

let metaData_MUL2 = {
    "ClassName": "",
    "ModuleName": "",
    "Name": "MUL2",
    "Description": "MUL2-FEM code for structural analysis",
    "Inputs": [
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus1", "Type": "mupif.Property", "Name": "YoungModulus1"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus2", "Type": "mupif.Property", "Name": "YoungModulus2"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus3", "Type": "mupif.Property", "Name": "YoungModulus3"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio12", "Type": "mupif.Property", "Name": "PoissonRatio12"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio13", "Type": "mupif.Property", "Name": "PoissonRatio13"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio23", "Type": "mupif.Property", "Name": "PoissonRatio23"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus12", "Type": "mupif.Property", "Name": "ShearModulus12"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus13", "Type": "mupif.Property", "Name": "ShearModulus13"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus23", "Type": "mupif.Property", "Name": "ShearModulus23"},
        {"Description": "Material Property", "Units": "kg/mm**3", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_Density", "Type": "mupif.Property", "Name": "Density"}
    ],
    "ID": "MUL2-ID-1",
    "Outputs": [
        {"Description": "First buckling load of the analyzed structure", "Units": "Nm", "Origin": "Simulated", "Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CriticalLoadLevel", "Name": "Buckling load"},
        {"Description": "Mass of the structure", "Units": "kg", "Origin": "Simulated", "Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Structural Mass"},
        {"Description": "Three dimensional shape of first buckling load of the analyzed structure", "Units": "-", "Origin": "Simulated", "Type": "mupif.Field", "Type_ID": "mupif.FieldID.FID_BucklingShape", "Name": "Buckling shape"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "MUL2.JobManager@UseCase1"
};


let metaData_LAMMPS = {
    "ClassName": "LAMMPS_API",
    "ModuleName": "",
    "Name": "LAMMPS",
    "ID": "LAMMPS",
    "Description": "Moluecular dynamics simulation for the Airbus case",
    "Physics": {
        "Type": "Molecular"
    },
    "Solver": {
        "Software": "LAMMPS",
        "Language": "C++",
        "License": "Open-source",
        "Creator": "Borek Patzak",
        "Version_date": "lammps-12dec18",
        "Type": "Atomistic/Mesoscopic",
        "Documentation": "https://lammps.sandia.gov/doc/Manual.html",
        "Estim_time_step_s": 1,
        "Estim_comp_time_s": 0.01,
        "Estim_execution_cost_EUR": 0.01,
        "Estim_personnel_cost_EUR": 0.01,
        "Required_expertise": "None",
        "Accuracy": "High",
        "Sensitivity": "High",
        "Complexity": "Low",
        "Robustness": "High"
    },
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_MOLECULAR_STRUCTURE", "Name": "Monomer Molecular Structure", "Description": "Monomer Molecular Structure", "Units": "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MOLECULAR_WEIGHT", "Name": "Polymer Molecular Weight", "Description": "Polymer Molecular Weight",  "Units": "mol", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CROSSLINKER_TYPE", "Name": "CROSSLINKER TYPE", "Description": "CROSSLINKER TYPE",  "Units": "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_FILLER_DESIGNATION", "Name": "FILLER DESIGNATION", "Description": "FILLER DESIGNATION", "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CROSSLINKONG_DENSITY", "Name": "CROSSLINKONG DENSITY", "Description": "CROSSLINKONG DENSITY",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_FILLER_CONCENTRATION", "Name": "FILLER CONCENTRATION", "Description": "FILLER CONCENTRATION",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_TEMPERATURE", "Name": "TEMPERATURE", "Description": "TEMPERATURE",  "Units":  "deg_C", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PRESSURE", "Name": "PRESSURE", "Description": "TEMPERATURE",  "Units":  "atm", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_POLYDISPERSITY_INDEX", "Name": "POLYDISPERSITY INDEX", "Description": "POLYDISPERSITY INDEX",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_MODIFIER_MOLECULAR_STRUCTURE", "Name": "SMILE MODIFIER MOLECULAR STRUCTURE", "Description": "SMILE MODIFIER MOLECULAR STRUCTURE",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_FILLER_MOLECULAR_STRUCTURE", "Name": "SMILE FILLER MOLECULAR STRUCTURE", "Description": "SMILE FILLER MOLECULAR STRUCTURE", "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_DENSITY_OF_FUNCTIONALIZATION", "Name": "DENSITY OF FUNCTIONALIZATION", "Description": "DENSITY OF FUNCTIONALIZATION", "Units":  "None", "Origin": "Simulated", "Required": true}
    ],
    "Outputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_DENSITY", "Name": "density", "Description": "density", "Units": "g/cm^3", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_EModulus", "Name": "Young modulus", "Description": "Young modulus", "Units": "GPa", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_effective_conductivity", "Name": "Thermal Conductivity", "Description": "Thermal Conductivity", "Units": "W/m.??C", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_TRANSITION_TEMPERATURE", "Name": "Glass Transition Temperature", "Description": "Glass Transition Temperature", "Units": "K", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio", "Name": "Poisson Ratio", "Description": "Poisson Ratio", "Units": "None", "Origin": "Simulated"}
    ]
};

let metaData_DIGIMAT = {
    "ClassName": "",
    "ModuleName": "",
    "callID": "eX_DigimatMF_JobManager",
    "Username": "root",
    "Hostname": "centos7-dev.e-xstream.local",
    "Status": "Initialized",
    "Date_time_start": "2020-09-29 14:23:52",
    "Execution": {},
    "Solver": {"Software": "Digimat-MF-2018.1", "Type": "Mean Field Homogenization", "Language": "C++", "License": "Commercial", "Creator": "Vincent Regnier", "Version_date": "05/2019", "Documentation": "See Digimat official documentation", "Estim_time_step_s": 1.0, "Estim_comp_time_s": 1.0, "Estim_execution_cost_EUR": 1.0, "Estim_personnel_cost_EUR": 1.0, "Required_expertise": "None", "Accuracy": "High", "Sensitivity": "High", "Complexity": "Low", "Robustness": "High"},
    "Name": "Digimat-MF AIRBUS",
    "ID": "N/A",
    "Description": "Mean Field Homogenization for Airbus case",
    "Physics": {"Type": "Continuum", "Entity": "Other"},
    "Inputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time_step", "Name": "Time step", "Description": "Time step", "Units": "s", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixYoung", "Name": "Young matrix", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionYoung", "Name": "Young inclusion", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixPoisson", "Name": "Poisson ratio matrix", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionPoisson", "Name": "Poisson ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionAspectRatio", "Name": "Aspect ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionVolumeFraction", "Name": "Volume fraction inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionDensity", "Name": "density inclusion", "Units": "kg/m**3", "Required": false},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixDensity", "Name": "density matrix", "Units": "kg/m**3", "Required": false}
    ],
    "Outputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time", "Name": "Cummulative time", "Description": "Cummulative time", "Units": "s", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeAxialYoung", "Name": "Composite Axial Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneYoung", "Name": "Composite In-plane Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneShear", "Name": "Composite In-plane Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransverseShear", "Name": "Composite Transverse Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlanePoisson", "Name": "Composite In-plane Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransversePoisson", "Name": "Composite Transverse Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeDensity", "Name": "Composite density", "Units": "kg/m**3"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "eX_DigimatMF_JobManager"
};

let metaData_ABAQUS = {
    "ClassName": "",
    "ModuleName": "",
    "callID": "Abaqus@Mupif.LIST",
    "Username": "rauchs",
    "Hostname": "MRT-GRA-30488",
    "Status": "Initialized",
    "Date_time_start": "2020-09-29 13:20:06",
    "Execution": {"ID": "none", "Use_case_ID": "Dow", "Task_ID": "none"},
    "Solver": {"Software": "ABAQUS Solver using ABAQUS", "Language": "FORTRAN, C/C++", "License": "proprietary code", "Creator": "Dassault systemes", "Version_date": "03/2019", "Type": "Summator", "Documentation": "extensive", "Estim_time_step_s": 1, "Estim_comp_time_s": 0.01, "Estim_execution_cost_EUR": 0.01, "Estim_personnel_cost_EUR": 0.01, "Required_expertise": "User", "Accuracy": "High", "Sensitivity": "High", "Complexity": "Low", "Robustness": "High"},
    "Name": "ABAQUS finite element solver",
    "ID": "N/A",
    "Description": "multi-purpose finite element software",
    "Physics": {"Type": "Other", "Entity": "Other"},
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus1", "Name": "E_1", "Description": "Young modulus 1", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus2", "Name": "E_2", "Description": "Young modulus 2", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus3", "Name": "E_3", "Description": "Young modulus 3", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio12", "Name": "nu_12", "Description": "Poisson\'s ration 12", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio13", "Name": "nu_13", "Description": "Poisson\'s ration 13", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio23", "Name": "nu_23", "Description": "Poisson\'s ration 23", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus12", "Name": "G_12", "Description": "Shear modulus 12", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus13", "Name": "G_13", "Description": "Shear modulus 13", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus23", "Name": "G_23", "Description": "Shear modulus 23", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "PropertyID.PID_Density", "Name": "rho_c", "Description": "Density of the composite", "Units": "kg/m**3", "Required": true}
    ],
    "Outputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CriticalLoadLevel", "Name": "M_crit", "Description": "Buckling load of the structure", "Units": "none"},
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Mass", "Description": "Mass of the structure", "Units": "kg"},

        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Stiffness",  "Name": "stiffness", "Description": "rotational stiffness of the structure", "Units": "Nmm"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Mass", "Description": "Mass of the structure", "Units": "kg"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_maxPrincipalStress", "Name": "maxStress", "Description": "maximum principal Stress", "Units": "MPa"}
    ],
    "refPoint": "none",
    "componentID": "none",
    "geomUnit": "",
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "Abaqus@Mupif.LIST"
};

//
//
//

let md_p1 = {
    "ClassName": "ReplcaceHostMolsWithDopantMols",
    "ModuleName": "usercase1",
    "Name": "Replcace Host Mols With Dopant Mols",
    "ID": "RHMWDM-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "coordinates",
            "Type_ID": "mupif.AtomicSetID.all",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p2 = {
    "ClassName": "ContainsPatologiesChecker",
    "ModuleName": "usercase1",
    "Name": "Contains Patologies Checker",
    "ID": "Thermo-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "boolContainsPatology",
            "Type_ID": "mupif.PropertyID.PID_Bool",
            "Type": "mupif.Property",
            "Required": false,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p3 = {
    "ClassName": "MD",
    "ModuleName": "usercase1",
    "Name": "MD",
    "ID": "MD-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p4 = {
    "ClassName": "ExtractHoppingSitesAndNeighbors",
    "ModuleName": "usercase1",
    "Name": "Extract Hopping Sites and Neighbors",
    "ID": "EHSAN-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "coordinates",
            "Type_ID": "mupif.AtomicSetID.all",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Obj_ID": [
                0
            ]
        },
        {
            "Name": "hopping_sites",
            "Type_ID": "mupif.HoppingSitesID.all",
            "Type": "mupif.HoppingSites",
            "Required": false,
            "Obj_ID": [
                0
            ]
        },
        {
            "Name": "neighbor_list",
            "Type_ID": "mupif.NeighborListID.all",
            "Type": "mupif.NeighborList",
            "Required": false,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

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

function logToMyConsole(val, color=null, fontsize=null){
    let elem = document.getElementById('messageContainer');
    let color_add = '';
    let fontsize_add = '';
    if(color != null)
        color_add = 'color:' + color + ';';
    if(fontsize != null)
        fontsize_add = 'font-size:' + fontsize + ';';
    elem.innerHTML = '<b class="message" style="' + color_add + fontsize_add + '">' + val + '</b>' + '<br><br>' + elem.innerHTML;
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

    document.getElementById('nav_editor').style.backgroundColor = 'black';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnProjectSettings(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'block';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'black';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnModelList(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'block';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'black';
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
            '<input type="file" id="form_metadata_file_selector" name="metadata_file" style="display:none;width:100px;" onchange="loadMetaDataFromJSONFileUsingAjax();">' +
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

function loadMetaDataFromJSONFileUsingAjax(){
    let fileSelect = document.getElementById('form_metadata_file_selector');
    let files = fileSelect.files;
    let formData = new FormData();
    for(let i = 0; i < files.length; i++){
        let file = files[i];

        // Add the file to the form's data
        formData.append('myfiles[]', file, file.name);
    }

    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            let answer = this.responseText.trim();
            // console.log(answer);
            let model_json = JSON.parse(answer);
            if(checkMetaDataValidity(model_json))
                editor.list_of_model_metadata.push(model_json);
            else
                console.log('MetaData JSON is not valid for usage.');
            updateHtmlOfListOfModels();
        }else{
            console.log('fail');
        }
    };

    xmlhttp.open('POST', 'do.php?action=get_metadata_from_json_file', true);
    xmlhttp.send(formData);
}

function loadMetaDataFromJSONOnServer(filename){
//     let xmlhttp = new XMLHttpRequest();
//
//     xmlhttp.onload = function () {
//         if (this.readyState === 4 && this.status === 200) {
//             let answer = this.responseText.trim();
//             // console.log(answer);
//             let model_json = JSON.parse(answer);
//             if(checkMetaDataValidity(model_json))
//                 editor.list_of_model_metadata.push(model_json);
//             else
//                 console.log('MetaData JSON is not valid for usage.');
//             updateHtmlOfListOfModels();
//         }else{
//             console.log('fail');
//         }
//     };
//
// xmlhttp.open('POST', 'do.php?action=get_metadata_from_json_file_on_server&myfilename='+filename, true);
// xmlhttp.send();


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
    if(!("ClassName" in md))
        return false;
    if(!("ModuleName" in md))
        return false;
    if(!("Name" in md))
        return false;
    if(!("ID" in md))
        return false;
    if(!("Inputs" in md))
        return false;
    if(!("Outputs" in md))
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

    let workflow = new BlockWorkflow(editor, null);
    editor.workflowblock = workflow;
    editor.visual = visual;

    if(visual) {
        loadMetaDataFromJSONOnServer('examples/metadata/md01.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md02.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md03.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md04.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md05.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md06.json');
    }

    if(loaded_json != null){
        editor.loadFromJsonData(loaded_json);
    }
    else {
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

let mupif_FieldID = [
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
    'FID_ESI_VPS_Displacement',
];

let mupif_PropertyID = [
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
    // Mul2 properties
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
    // INSA properties
    'PID_ExtensionalInPlaneStiffness',
    'PID_ExtensionalOutOfPlaneStiffness',
    'PID_ShearInPlaneStiffness',
    'PID_ShearOutOfPlaneStiffness',
    'PID_LocalBendingStiffness',
    // Digimat Properties
    'PID_MatrixYoung',
    'PID_MatrixPoisson',
    'PID_InclusionYoung',
    'PID_InclusionPoisson',
    'PID_InclusionVolumeFraction',
    'PID_InclusionAspectRatio',
    'PID_CompositeAxialYoung',
    'PID_CompositeInPlaneYoung',
    'PID_CompositeInPlaneShear',
    'PID_CompositeTransverseShear',
    'PID_CompositeInPlanePoisson',
    'PID_CompositeTransversePoisson',
    // CUBA keywords from Jun 6, 2017 - https://github.com/simphony/simphony-common/blob/master/ontology/cuba.yml
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
    // 'PID_Velocity', Duplicate
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
    // 'PID_Concentration', Duplicity
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
    // End of CUBA keywords
    
    'PID_Demo_Min',
    'PID_Demo_Max',
    'PID_Demo_Integral',
    'PID_Demo_Volume',
    'PID_Demo_Value',
    'PID_UserTimeStep',
    'PID_KPI01',
    
    // ESI VPS properties
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
    
    // University of Trieste properties
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
    
    // Demo properties
    'PID_dirichletBC',
    'PID_conventionExternalTemperature',
    'PID_conventionCoefficient',
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
    'degF',
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

let slot_id = 0;
function generateNewSlotID(){
    slot_id += 1;
    return 'slot_'+slot_id;
}

class Slot{
    constructor(parent_block, inout, name, text, type, required=true, obj_type=null, obj_id=0){
        this.id = generateNewSlotID();

        this.name = name;
        this.text = text;
        this.parent_block = parent_block;
        // this.code_name = "";

        this.type = type;
        this.required = required;
        this.obj_id = obj_id;
        this.obj_type = obj_type;
        this.inout = inout;
        this.max_connections = 999;
        if(this.inout === 'in')
            this.max_connections = 1;
        this.external = false;
    }

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
        if(this.inout === 'out')
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

    getObjType(){
        return this.obj_type;
    }

    getObjID(){
        return this.obj_id;
    }

    getParentBlock(){
        return this.parent_block;
    }

    getCodeRepresentation() {
        return "self." + this.id;
    }

    getUID(){
        return this.id;
    }

    getName(){return this.name;}

    getClassName(){return 'Slot';}

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
            html = '<div class="slot_input" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;"><div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div>'+this.name+'</div>';
        if(temp_inout === 'out')
            html = '<div class="slot_output" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;">'+this.name+'<div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div></div>';
        return html;
    }

    getDataslotDiv(){
        return document.getElementById(this.id);
    }
}

class SlotExt extends Slot{
    constructor(parent_block, inout, name, text, type, required=true, obj_type='None'){
        super(parent_block, inout, name, text, type, required, obj_type, name);
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
     * @param s1
     * @param s2
     * @returns {Datalink}*/
    addDatalink(s1, s2){
        if(s1 && s2) {
            if (s1 !== s2) {
                if (s1.inout !== s2.inout) {
                    if (s1.getNumConnections() < s1.max_connections && s2.getNumConnections() < s2.max_connections) {
                        if (s1.parent_block !== s2.parent_block) {
                            if (s1.external === true || s2.external === true) {
                                if (s1.external === true && s2.external === true) {

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
                        } else
                            myQuery_show_error('Slots within one block can not be connected.');
                    } else {
                        let slot_naming = '';
                        if (s1.getNumConnections() === s1.max_connections)
                            slot_naming += '<br>(' + s1.name + ')';
                        if (s2.getNumConnections() === s2.max_connections)
                            slot_naming += '<br>(' + s2.name + ')';
                        myQuery_show_error('One of the slots can not accept more connections.' + slot_naming);
                    }
                } else
                    myQuery_show_error('Only input and output dataslot can be connected.<br>(Or input and external input or output and external output)');
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

    addBlockByJsonRecord(json_data){
        let parent_block;
        let new_block = null;
        let slot;

        if(json_data['classname']==='BlockWorkflow'){
            this.workflowblock.code_name = json_data['uid'];

            let inout = '';
            for(let i=0;i<json_data['ext_slots'].length;i++){
                slot = json_data['ext_slots'][i];
                if(slot['inout']==='in' || slot['inout']==='out') {
                    if(slot['inout']==='in')
                        inout = 'out';
                    if(slot['inout']==='out')
                        inout = 'in';
                    this.workflowblock.addExternalDataSlot(inout, slot['name'], slot['type'], slot['obj_type']);
                }
            }

            let slots = this.workflowblock.getSlots();
            for(let key in json_data['slot_uids'])
                for(let i=0;i<slots.length;i++)
                    if(slots[i].name === key)
                        slots[i].id = json_data['slot_uids'][key];
        }
        if(json_data['classname']==='BlockConstPhysicalQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPhysicalQuantity(this, parent_block, json_data['value'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockConstProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockProperty(this, parent_block, json_data['value'], json_data['propID'], json_data['valueType'], json_data['units'], json_data['objectID']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockTimeloop'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockTimeloop(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockModel'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockModel(this, parent_block, json_data['metadata'], json_data['model_input_file_name'], json_data['model_input_file_directory']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }

        if(new_block != null){
            let slots = new_block.getSlots();
            for(let i=0;i<slots.length;i++){
                slots[i].id = json_data['slot_uids'][i];
            }
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
                if('settings_project_name' in json_data['settings'])
                    this.workflowblock.settings_project_name = json_data['settings']['settings_project_name'];
                else
                    console.log('Project name was not in settings.');
                if('settings_project_classname' in json_data['settings'])
                    this.workflowblock.settings_project_classname = json_data['settings']['settings_project_classname'];
                else
                    console.log('Project classname was not in settings.');
                if('settings_project_modulename' in json_data['settings'])
                    this.workflowblock.settings_project_modulename = json_data['settings']['settings_project_modulename'];
                else
                    console.log('Project modulename was not in settings.');
                if('settings_project_id' in json_data['settings'])
                    this.workflowblock.settings_project_id = json_data['settings']['settings_project_id'];
                else
                    console.log('Project ID was not in settings.');
            }else{
                console.log('ERROR: The JSON does not contain keys \'blocks\' or/and \'datalinks\' or/and \'settings\'!');
            }
        }else{
            console.log('ERROR: Passed variable must be a dictionary!');
        }
    }

    setProjectName(val){
        this.workflowblock.settings_project_name = val;
    }

    setProjectClassName(val){
        this.workflowblock.settings_project_classname = val;
    }

    setProjectModuleName(val){
        this.workflowblock.settings_project_modulename = val;
    }

    setProjectID(val){
        this.workflowblock.settings_project_id = val;
    }

    selectSettingsAndUpdate(){
        this.updateHtmlOfProjectSettings();
        focusOnProjectSettings();
    }

    updateHtmlOfProjectSettings(){
        let slots;
        let slot;

        let html = '<h2><b>Project settings</b></h2>';
        html += '<table style="color:black;">';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>Name:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_name+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_name+'" id="new_project_name"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ClassName:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_classname+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_classname+'" id="new_project_classname"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ModuleName:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_modulename+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_modulename+'" id="new_project_modulename"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ID:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_id+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_id+'" id="new_project_id"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td></td>';
        html += '<td><button onclick="editor.save_project_detials();">Save</button></td>';
        html += '</tr>';

        html += '</table>';

        //

        html += '<h2 style="margin-top:15px;"><b>External data slots</b></h2>';
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
        html += '<td></td>';
        html += '<td><button onclick="editor.save_external_data_slots();">Save</button></td>';

        html += '</tr>';

        html += '</table>';

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

        logToMyConsole('External data slots saved','green');
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
        this.updateHtmlOfProjectSettings();
        logToMyConsole('Project settings saved','green');
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
        this.download(this.workflowblock.settings_project_modulename + ".py", this.getExecutionCode());
        let code = this.getExecutionCode();
        // console.log(code);
        let code_html = replaceAllInStr(code, '\t', '    ');
        code_html = replaceAllInStr(code_html, ' ', '&nbsp;&nbsp;');
        code_html = replaceAllInStr(code_html, '\n', '<br>');
        logToMyConsole(code_html, 'white', 12);
    }

    menu_download_class_code(){
        this.download(this.workflowblock.settings_project_modulename + ".py", this.getClassCode());
        let code = this.getClassCode();
        // console.log(code);
        let code_html = replaceAllInStr(code, '\t', ' ');
        code_html = replaceAllInStr(code_html, ' ', '&nbsp;&nbsp;');
        code_html = replaceAllInStr(code_html, '\n', '<br>');
        logToMyConsole(code_html, 'white', 12);
    }

    menu_download_json(){
        let code = this.getJSON();
        this.download("project.json", JSON.stringify(code, null, 4));
        // console.log(code);
        // logToMyConsole(JSON.stringify(code), 'white', 12);
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
