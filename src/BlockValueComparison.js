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
            sa = this.getDataSlotWithName("a");
            sb = this.getDataSlotWithName("b");
            a = sa.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(sa);
            b = sb.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(sb);
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