class BlockModel extends Block {
    constructor(editor, parent_block, md = {}, input_file_directory="") {
        super(editor, parent_block);
        // this.md = md;

        this.input_file_directory = input_file_directory;

        this.exec_type = "";
        this.exec_settings_jobmanagername = "";

        // this.loadDataFromMetadata();
        this.setMetadata(md);

        if ('Inputs' in this.md && 'Outputs' in this.md)
            this.constructSlots();
    }

    loadDataFromMetadata() {
        // backwards compatibitlity ?
        // if ('ClassName' in this.md) {
        //     this.name = this.md['ClassName'];
        //     this.model_name = this.md['ClassName'];
        // }
        // if ('ModuleName' in this.md)
        //     this.model_module = this.md['ModuleName'];

        if ('Name' in this.md)
            this.name = this.md['Name'];
        
        this.exec_type = 'Local';
        if ('Execution_settings' in this.md) {
            if ('Type' in this.md['Execution_settings'])
                if (this.md['Execution_settings']['Type'] === 'Distributed')
                    this.exec_type = this.md['Execution_settings']['Type'];
            if ('jobManName' in this.md['Execution_settings'])
                this.exec_settings_jobmanagername = this.md['Execution_settings']['jobManName'];
            if ('Module' in this.md['Execution_settings'])
                this.model_module = this.md['Execution_settings']['Module'];
            if ('Class' in this.md['Execution_settings'])
                this.model_name = this.md['Execution_settings']['Class'];
        }
    }

    constructSlots() {
        this.input_slots = [];
        this.output_slots = [];
        let md = this.md;
        let name;
        let objid;
        let vt;
        for (let i = 0; i < md['Inputs'].length; i++) {
            objid = [''];
            vt = '';
            if ('ValueType' in md['Inputs'][i])
                vt = md['Inputs'][i]['ValueType'];
            if ('Obj_ID' in md['Inputs'][i]) {
                if (typeof md['Inputs'][i]['Obj_ID'] == "string"){
                    objid = [md['Inputs'][i]['Obj_ID']];
                } else if (typeof md['Inputs'][i]['Obj_ID'] == "object"){
                    if (md['Inputs'][i]['Obj_ID'].length === 0)
                        objid = [''];
                    else
                        objid = md['Inputs'][i]['Obj_ID'];
                }
            }
            for (let ii = 0; ii < objid.length; ii++) {
                name = md['Inputs'][i]['Name'];
                if (objid[ii] !== '')
                    name += ' [' + objid[ii] + ']';
                this.addInputSlot(new Slot(this, 'in', name, name, md['Inputs'][i]['Type'], md['Inputs'][i]['Required'], md['Inputs'][i]['Type_ID'], objid[ii], '', md['Inputs'][i]['Set_at'], md['Inputs'][i]['Units'], vt));
            }
        }

        for (let i = 0; i < md['Outputs'].length; i++) {
            objid = [''];
            vt = '';
            if ('ValueType' in md['Outputs'][i])
                vt = md['Outputs'][i]['ValueType'];
            if ('Obj_ID' in md['Outputs'][i]) {
                if (typeof md['Outputs'][i]['Obj_ID'] == "string"){
                    objid = [md['Outputs'][i]['Obj_ID']];
                } else if (typeof md['Outputs'][i]['Obj_ID'] == "object"){
                    if (md['Outputs'][i]['Obj_ID'].length === 0)
                        objid = [''];
                    else
                        objid = md['Outputs'][i]['Obj_ID'];
                }
            }
            for (let ii = 0; ii < objid.length; ii++) {
                name = md['Outputs'][i]['Name'];
                if (objid[ii] !== '')
                    name += ' [' + objid[ii] + ']';
                this.addOutputSlot(new Slot(this, 'out', name, name, md['Outputs'][i]['Type'], md['Outputs'][i]['Required'], md['Outputs'][i]['Type_ID'], objid[ii], '', '', md['Outputs'][i]['Units'], vt));
            }
        }
    }

    setMetadata(md) {
        this.md = md;
        this.loadDataFromMetadata();
    }

    setMetadataAndUpdate(md) {
        this.deleteLinkedDatalinksToChildSlots();
        this.setMetadata(md);
        this.constructSlots();
    }

    generateCodeName(all_blocks, base_name = 'model_') {
        super.generateCodeName(all_blocks, base_name);
    }

    /** @returns {BlockAllocateModelAtRuntime} */
    getParentAllocateModelAtRuntimeBlock(){
        let res = null;
        let parent_blocks = this.getParentBlockChain();
        parent_blocks.forEach(b => {
            if(b.getClassName() === 'BlockAllocateModelAtRuntime'){res = b;}
        });
        return res;
    }

    /** @returns {BlockRunInBackground} */
    getParentRunInBackgroundBlock(){
        let res = null;
        let parent_blocks = this.getParentBlockChain();
        parent_blocks.forEach(b => {
            if(b.getClassName() === 'BlockRunInBackground'){res = b;}
        });
        return res;
    }

    getInitCode(indent = 0) {
        return [];
    }

    getInitializationCode(indent = 0, metaDataStr = "{}") {
        return [];
    }

    getExecutionCode(indent = 0, timestep = "", solvefunc=false) {
        if(timestep === "")
            timestep = this.getTimestepVariableNameFromSelfOrParent();

        let code = super.getExecutionCode();
        
        let model_name = "'" + this.code_name + "'";
        
        let parent_allocate_at_runtime_block = this.getParentAllocateModelAtRuntimeBlock();
        if(parent_allocate_at_runtime_block !== null){
            model_name = "model_name";
            code.push(model_name + " = self._generateNewModelName(base='" + this.code_name + "')");
            code.push("self._allocateModelByName(name='" + this.code_name + "', name_new=" + model_name + ")");
            code.push("self.getModel(" + model_name + ").initialize(metadata=self._getInitializationMetadata())");
            code.push(parent_allocate_at_runtime_block.getModelNamesVariable() + ".append(" + model_name + ")");
        }

        let run_in_background = "False"
        let parent_run_in_background_block = this.getParentRunInBackgroundBlock();
        if(parent_run_in_background_block !== null){
            run_in_background = "True"
            code.push(parent_run_in_background_block.getModelNamesVariable() + ".append(" + model_name + ")");
        }

        if(timestep === "None" && solvefunc) {
            code.push(this.code_name + "_virtual_timestep = mupif.timestep.TimeStep(time=0*mupif.Q.s, dt=1*mupif.Q.s, targetTime=1*mupif.Q.s)");
            timestep = this.code_name + "_virtual_timestep"
        }
        let timestep_time = timestep + ".getTime()";

        let linked_slot;
        let obj_id;
        for (let i = 0; i < this.input_slots.length; i++) {
            linked_slot = this.input_slots[i].getLinkedDataSlot();
            if (linked_slot != null) {
                if(this.input_slots[i].set_at !== 'initialization') {
                    obj_id = this.input_slots[i].obj_id;
                    if (typeof obj_id === 'string')
                        obj_id = "'" + obj_id + "'";
                    code.push("self.getModel(" + model_name + ").set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
                }
            }
        }

        code.push("self.getModel(" + model_name + ").solveStep(tstep=" + timestep + ", runInBackground=" + run_in_background + ")");

        return push_indents_before_each_line(code, indent);
    }

    getAllocationMetadata(indent=0){
        let instantiate = this.getParentAllocateModelAtRuntimeBlock() === null;
        let code;
        if(this.exec_type === "Distributed") {
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Jobmanager\": \"" + this.exec_settings_jobmanagername + "\",",
                "\t\"Instantiate\": " + (instantiate ? "True" : "False") + "",
                "}"
            ];
        }else{
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Module\": \"" + this.model_module + "\",",
                "\t\"Class\": \"" + this.model_name + "\",",
                "\t\"Instantiate\": " + (instantiate ? "True" : "False") + "",
                "}"
            ];
        }
        return push_indents_before_each_line(code, indent);
    }

    generateOutputDataSlotGetFunction(slot, time = "None") {
        //todo check if slot is mine
        // if (slot in self.getSlots(DataSlot.OutputDataSlot)) {
        if (true) {
            let obj_id;
            if (typeof slot.obj_id === 'string')
                obj_id = "'" + slot.obj_id + "'";
            else
                obj_id = slot.obj_id;
            return "self.getModel('" + this.code_name + "').get(" + slot.getDataID() + ", " + time + ", " + obj_id + ")";
        }
        return "None";
    }

    /**
     * @returns {EditableParameter[]} the model metadata (chosen from the models loaded in the editor) and the
     *          working directory
     */
    getParameters(){
        let md_list = this.editor.list_of_model_metadata;
        let options = md_list.map(md => ({value: md['ID'], label: md['Name']}));
        let current = this.md['ID'] || '';
        if(!options.some(o => o.value === current))
            options.unshift({value: current, label: this.md['Name'] || '(no metadata)'});
        return [
            {key: 'metadata', label: 'Model', type: 'select', value: current, options: options},
            {key: 'working_directory', label: 'Working directory', type: 'text', value: this.input_file_directory}
        ];
    }

    /**
     * @param {string} key - 'metadata' (the ID of a model loaded in the editor; replacing the metadata
     *        rebuilds the slots and removes their data links) or 'working_directory'
     * @param {string} value
     * @returns {boolean} true when the value was accepted
     */
    setParameter(key, value){
        if(key === 'working_directory'){
            this.input_file_directory = String(value).trim();
            return true;
        }
        if(key === 'metadata'){
            if(value === (this.md['ID'] || ''))
                return true;
            let md = this.editor.list_of_model_metadata.find(m => m['ID'] === value);
            if(!md)
                return false;
            this.setMetadataAndUpdate(md);
            return true;
        }
        return false;
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockModel';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['metadata'] = this.md;
        dict['model_working_directory'] = this.input_file_directory;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_model';
    }

    getBlockHtmlName(){
        return 'Model';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Name = <b>\'' + this.md['Name'] + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.md['ID'] + '\'</b>';

        if(this.exec_type !== "Distributed") {
            html += '<br>';
            html += 'Working directory = <b>\'' + this.input_file_directory + '\'</b>';
        }
        html += '</div>';
        return html;
    }

}