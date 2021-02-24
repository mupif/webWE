class BlockTimeloop extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = 'TimeLoop';
        this.defines_timestep = true;

        this.addInputSlot(new Slot(this, 'in', 'start_time', 'start_time', 'mupif.PhysicalQuantity', false));
        this.addInputSlot(new Slot(this, 'in', 'target_time', 'target_time', 'mupif.PhysicalQuantity', false));
        this.addInputSlot(new Slot(this, 'in', 'max_dt', 'max_dt', 'mupif.PhysicalQuantity', true));
    }

    generateCodeName(all_blocks, base_name='timeloop_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getStartTime(){
        let connected_slot = this.getDataSlotWithName("start_time").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getTargetTime(){
        let connected_slot = this.getDataSlotWithName("target_time").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getMaxDt(){
        let connected_slot = this.getDataSlotWithName("max_dt").getLinkedDataSlot();
        if(connected_slot!=null)
            return connected_slot.getParentBlock().generateOutputDataSlotGetFunction(connected_slot);
        return 'None';
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();

        let var_time = this.code_name + "_time";
        let var_target_time = this.code_name + "_target_time";
        let var_dt = this.code_name + "_dt";
        let var_compute = this.code_name + "_compute";
        let var_time_step = this.code_name + "_time_step";
        let var_time_step_number = this.code_name + "_time_step_number";

        code.push(var_time + " = " + this.getStartTime());
        code.push(var_target_time + " = " + this.getTargetTime());

        code.push(var_compute + " = True");
        code.push(var_time_step_number + " = 0");

        code.push("while " + var_compute + ":");
        let while_code = [];

        code.push("\t" + var_time_step_number + " += 1");

        let dt_code = "\t" + var_dt + " = min([";
        let first = true;

        if(this.getMaxDt()) {
            dt_code += this.getMaxDt();
            first = false;
        }

        let model_blocks = this.getBlocks(BlockModel.BlockModel);
        for(let i=0;i<model_blocks.length;i++) {
            if (!first)
                dt_code += ", ";
            dt_code += "self." + model_blocks[i].code_name + ".getCriticalTimeStep()";
            first = false;
        }
        dt_code += "])";

        while_code.push("");
        while_code.push(dt_code);
        while_code.push("\t" + var_time + " = min(" + var_time + "+" + var_dt + ", " + var_target_time + ")");
        while_code.push("");

        while_code.push("\tif " + var_time + ".inUnitsOf('s').getValue() + 1.e-6 > " + var_target_time + ".inUnitsOf('s').getValue():");
        while_code.push("\t\t" + var_compute + " = False");

        while_code.push("\t");
        while_code.push("\t" + var_time_step + " = mupif.timestep.TimeStep(" + var_time + ", " + var_dt + ", " + var_target_time + ", n=" + var_time_step_number + ")");
        // while_code.push("\t");

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            while_code = while_code.concat(blocks[i].getExecutionCode(1, var_time_step, solvefunc));
        }

        code = code.concat(while_code);
        code.push("");

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.addAddBlockItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockTimeloop';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_timeloop';
    }

    getBlockHtmlName(){
        return 'Time Loop';
    }

}