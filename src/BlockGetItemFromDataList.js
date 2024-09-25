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