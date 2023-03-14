class BlockWaitForBackgroundProcesses extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addInputSlot(new Slot(this, 'in', 'model_names', 'model_names', 'string[]', true, null));
        this.addInputSlot(new Slot(this, 'in', 'checking_period', 'checking_period', 'mupif.PhysicalQuantity', false, null));
    }

    generateCodeName(all_blocks, base_name='wait_for_background_processes_'){
        super.generateCodeName(all_blocks, base_name);
    }

    getInitCode(indent=0){
        return [];
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let code = super.getExecutionCode();
        let cn = this.getCodeName()
        let var_all_done = cn + "_all_done"
        let var_model_name = cn + "_model_name"

        let in_slot_model_names = this.getDataSlotWithName("model_names").getLinkedDataSlot();
        let model_names = "[]"
        if(in_slot_model_names != null) {
            model_names = in_slot_model_names.getParentBlock().generateOutputDataSlotGetFunction(in_slot_model_names);
        }

        code.push(var_all_done + " = False");
        code.push("while not " + var_all_done + ":");
        code.push("\ttime.sleep(60)");
        code.push("\t" + var_all_done + " = True");
        code.push("\tfor " + var_model_name + " in " + model_names + ":");
        code.push("\t\tif not self.getModel(" + var_model_name + ").isSolved():");
        code.push("\t\t\t" + var_all_done + " = False");
        code.push("\tfor " + var_model_name + " in " + model_names + ":");
        code.push("\t\tself.getModel(" + var_model_name + ").finishStep(tstep)");

        return push_indents_before_each_line(code, indent);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockWaitForBackgroundProcesses';
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Wait for background processes';
    }

}