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
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Property to Quantity';
    }

}