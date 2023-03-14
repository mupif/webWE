class BlockQuantityComparison extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'a', 'a', 'mupif.Property', true, null));
        this.addInputSlot(new Slot(this, 'in', 'b', 'b', 'mupif.Property', true, null));

        this.addOutputSlot(new Slot(this, 'out', 'a > b', 'a > b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a >= b', 'a >= b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a == b', 'a == b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a != b', 'a != b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a <= b', 'a <= b', 'Bool', false));
        this.addOutputSlot(new Slot(this, 'out', 'a < b', 'a < b', 'Bool', false));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        let a = 'None';
        let b = 'None';
        let cs;
        cs = this.getDataSlotWithName("a").getLinkedDataSlot();
        if(cs != null)
            a = cs.getParentBlock().generateOutputDataSlotGetFunction(cs);
        cs = this.getDataSlotWithName("b").getLinkedDataSlot();
        if(cs != null)
            b = cs.getParentBlock().generateOutputDataSlotGetFunction(cs);
        let operator = slot.name.replace('a', '').replace('b', '');
        return a + operator + b;
    }

    generateCodeName(all_blocks, base_name='quantity_comparison_'){
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
        return 'BlockQuantityComparison';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_helper';
    }

    getBlockHtmlName(){
        return 'Quantity Comparison';
    }

}