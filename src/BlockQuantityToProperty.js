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