class BlockExtractorPhysicalQuantityFromProperty extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'property', 'property', 'mupif.Property', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'quantity', 'quantity', 'mupif.PhysicalQuantity', false));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        let prop_slot = this.getDataSlotWithName("property").getLinkedDataSlot();
        if(prop_slot != null) {
            let prop = prop_slot.getParentBlock().generateOutputDataSlotGetFunction(prop_slot);
            return prop + '.getValue()';
        }
        return 'None'
    }

    generateCodeName(all_blocks, base_name='quantity_from_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockExtractorPhysicalQuantityFromProperty';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Quantity from Property';
    }

}