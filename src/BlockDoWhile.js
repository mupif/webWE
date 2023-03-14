class BlockDoWhile extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = 'DoWhile';

        this.addInputSlot(new Slot(this, 'in', 'do', 'do', 'mupif.Property', true, null));
        this.addOutputSlot(new Slot(this, 'out', 'counter', 'counter', 'number'));
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

    generateOutputDataSlotGetFunction(slot, time=""){
        if(slot.name === 'counter') {
            return this.code_name + "_counter";
        }
        return 'None'
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_compute = this.code_name + "_compute";
        let var_counter = this.code_name + "_counter";
        
        code.push(var_counter + " = 0");
        
        let ts = this.getTimestepVariableNameFromSelfOrParent();
        if(timestep !== "")
            ts = timestep;
        let ti;
        if(ts !== "None")
            ti = ts + ".getTime()";
        else
            ti = "0*mupif.U.s";
        code.push(var_compute + " = True");
        
        code.push("while " + var_compute + ":");

        code.push("\t" + var_counter + " += 1")

        code.push("\t" + var_compute + " = " + this.getDo(ti));
        code.push("\tif " + var_compute + ":")

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            code = code.concat(blocks[i].getExecutionCode(2, timestep, solvefunc));
        }

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
        return 'we_block we_block_default';
    }

    getBlockHtmlName(){
        return 'Do While';
    }

}