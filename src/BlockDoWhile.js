class BlockDoWhile extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = 'DoWhile';

        this.addInputSlot(new Slot(this, 'in', 'do', 'do', 'mupif.Property', true, null));
    }

    generateCodeName(all_blocks, base_name='dowhile_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getDo(time){
        let connected_slot = this.getDataSlotWithName("do").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot, time);
        return 'False';
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_compute = this.code_name + "_compute";

        code.push(var_compute + " = True");

        code.push("while " + var_compute + ":");
        let while_code = [];

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            while_code = while_code.concat(blocks[i].getExecutionCode(1, timestep, solvefunc));
        }

        code = code.concat(while_code);

        code.push("\t");
        let ts = this.getTimestepVariableNameFromSelfOrParent();
        if(timestep !== "")
            ts = timestep;

        let ti;
        if(ts !== "None")
            ti = ts + ".getTime()";
        else
            ti = "0*mupif.Q.s";
        code.push("\t" + var_compute + " = "+this.getDo(ti));

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockDoWhile';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Do While';
    }

}