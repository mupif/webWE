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

    getExecutionCode(indent=0, time="", timestep="tstep"){
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
            'uuid': this.getUID(),
            'parent_uuid': this.parent_block.getUID(),
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
        html += '<div id="blockdiv_'+this.getUID()+'" class="'+this.getBlockHtmlClass()+'" onmousedown="anyClick(event, \''+this.getUID()+'\');" onmouseup="one_elem_check_disabling_propagation=false;" oncontextmenu="return false;">';

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
            html += '<div class="block_menu_item" onclick="editor.getBlockByUID(\''+this.getUID()+'\').modificationQuery(\''+items[i].getKeyword()+'\', \''+items[i].getValue()+'\');" onmousedown="one_elem_check_disabling_propagation=true;" onmouseup="one_elem_check_disabling_propagation=false;">'+items[i].getText()+'</div>';
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