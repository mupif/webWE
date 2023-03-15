class BlockVariable extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'in', 'in', '*', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'out', 'out', '*', false));
        this.getDataSlotWithName('out').setRedirectionForParams(this.getDataSlotWithName('in'));
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.code_name;
    }

    generateCodeName(all_blocks, base_name='variable_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        let code = super.getInitCode();

        let var_value = "self." + this.code_name;

        code.push(var_value + " = None");

        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let in_slot = this.getDataSlotWithName("in").getLinkedDataSlot();
        let val = "None"
        if(in_slot != null) {
            val = in_slot.getParentBlock().generateOutputDataSlotGetFunction(in_slot);
        }

        let var_value = this.code_name;

        code.push("self." + var_value + " = " + val);

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockVariable';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Variable';
    }

}