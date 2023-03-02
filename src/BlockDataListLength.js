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
     * 
     * @param {Slot} slot
     * @param {string} time
     * @returns {string}*/
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
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'DataList Length';
    }

}