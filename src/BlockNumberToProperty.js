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