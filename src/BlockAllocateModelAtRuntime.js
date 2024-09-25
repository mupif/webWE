class BlockAllocateModelAtRuntime extends Block{
    constructor(editor, parent_block){
        super(editor, parent_block);
        this.name = this.getClassName().replace('Block', '');

        this.addOutputSlot(new Slot(this, 'out', 'model_names', 'model_names', 'string[]', false));
    }

    generateCodeName(all_blocks, base_name='allocate_model_at_runtime_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return this.getModelNamesVariable();
    }
    
    getModelNamesVariable(){return "self."+this.code_name+"_model_names";}

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push(this.getModelNamesVariable() + " = []");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        let var_time_step = "tstep";
        if(timestep !== ""){
            var_time_step = timestep
        }
        let code = [];
        code.push(this.getModelNamesVariable() + " = []");

        let blocks = this.getBlocks();
        for(let i=0;i<blocks.length;i++){
            code = code.concat(blocks[i].getExecutionCode(0, var_time_step, solvefunc));
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
        return 'BlockAllocateModelAtRuntime';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['child_block_sort'] = this.child_block_sort;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_allocate_model_at_runtime';
    }

    getBlockHtmlName(){
        return 'Allocate Model At Runtime';
    }

}