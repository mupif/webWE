class BlockWorkflow extends Block{
    constructor(editor, parent_block){
        super(editor, null);
        this.name = 'Workflow';

        this.project_name = 'My unnamed project';
        this.project_classname = 'MyUnnamedProject';
        this.project_modulename = 'MyModuleName';
        this.project_id = 'my_unnamed_project_01';


        this.exec_type = "Local";
        this.exec_settings_jobmanagername = "";

        this.project_nshost = '';// nshost is set by environment variables by default
        this.project_nsport = '';// nsport is set by environment variables by default

        this.jobman_name = '';
        
        this.script_name_base = '';
    }

    getAllExternalDataSlots(inout){
        return this.getSlots(inout);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return slot.getCodeRepresentation();
    }

    canGenerateCode(type){
        if(type === 'exec'){
            let result = true;
            if(this.getSlots().length) {
                result = false;
                console.log('Execution code cannot be generated with external inputs.');
                if(this.editor.visual)
                    myQuery_show_error('Execution code cannot be generated with external inputs.');
            }
            let blocks = this.getBlocksRecursive(BlockTimeloop);
            if(!blocks.length) {
                result = false;
                console.log('Execution code cannot be generated without a Timeloop or another block defining a timestep.');
                if(this.editor.visual)
                    myQuery_show_error('Execution code cannot be generated without a Timeloop or another block defining a timestep.');
            }
            return result;
        }
        if(type === 'class'){
            return true;
        }
        if(type === 'server'){
            return true;
        }
        console.log('Type of code is not valid!');
        return false;
    }

    generateAllElementCodeNames(){
        this.code_name = 'workflow';
        let blocks = this.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++)
            blocks[i].code_name = "";
        for(let i=0;i<blocks.length;i++)
            blocks[i].generateCodeName(blocks);
        let slots = this.getSlotsRecursive();
        for(let i=0;i<slots.length;i++)
            slots[i].id = '';
        slot_id = 0;
        for(let i=0;i<slots.length;i++)
            if(!slots[i].external)
                slots[i].id = generateNewSlotID();
        slots = this.getAllExternalDataSlots('in');
        for(let i=0;i<slots.length;i++)
            slots[i].id = 'external_output_'+(i+1);
        slots = this.getAllExternalDataSlots('out');
        for(let i=0;i<slots.length;i++)
            slots[i].id = 'external_input_'+(i+1);
    }

    generateCodeForServer(){
        console.log('Generating Python code for server.');
        if(this.canGenerateCode('server')) {
            let code = ["import mupif", "import copy"];
            code.push("import "+this.script_name_base);
            code.push("");
            code.push("if __name__ == '__main__':");
            code.push("\t# code to run the jobmanager server");
            code.push("");
            let conn_info = "";
            if(this.project_nshost && this.project_nsport)
                conn_info = "nshost='" + this.project_nshost + "', nsport=" + this.project_nsport + "";
            code.push("\tns = mupif.pyroutil.connectNameServer(" + conn_info + ")");
            code.push("");
            code.push("\tjobMan = mupif.SimpleJobManager(");
            code.push("\t\tns=ns,");
            code.push("\t\tappClass="+this.script_name_base+"."+this.project_classname+",");
            code.push("\t\tappName='"+this.editor.getJobmanName()+"',");
            code.push("\t\tjobManWorkDir='.',");
            code.push("\t\tmaxJobs=10");
            code.push("\t).runServer()");
            code.push("");

            return replace_tabs_with_spaces_for_each_line(code);
        }
        return '';
    }
    
    generateMetadata(class_code){
        if(this.canGenerateCode(class_code ? 'class' : 'exec')) {

            this.generateAllElementCodeNames();

            let all_model_blocks = this.getBlocksRecursive(BlockModel);
            let model;

            let code = [];

            // begin
            code.push("\t\t\t\"ClassName\": \"" + this.project_classname + "\",");
            code.push("\t\t\t\"ModuleName\": \"" + this.project_modulename + "\",");
            code.push("\t\t\t\"Name\": \"" + this.project_name + "\",");
            code.push("\t\t\t\"ID\": \"" + this.project_id + "\",");
            code.push("\t\t\t\"Description\": \"\",");

            if (class_code) {
                code.push("\t\t\t\"Execution_settings\": {");
                code.push("\t\t\t\t\"Type\": \"" + this.exec_type + "\"");
                if (this.exec_type === 'Distributed') {
                    code = addCommaToLastLine(code);
                    code.push("\t\t\t\t\"jobManName\": \"" + this.jobman_name + "\"");
                }
                code.push("\t\t\t},");
            }

            let slots;
            let params;
            let s;
            let n_slots_printed;
            n_slots_printed = 0;
            code.push("\t\t\t\"Inputs\": [");
            slots = this.getAllExternalDataSlots("out");
            for (let i = 0; i < slots.length; i++) {
                s = slots[i];
                if (s.connected()) {
                    if (n_slots_printed)
                        code = addCommaToLastLine(code);
                    params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.getLinkedDataSlot().type + "\", " +
                        "\"Required\": True, \"description\": \"\", " +
                        "\"Type_ID\": \"" + s.getLinkedDataSlot().getDataID() + "\", " +
                        "\"Obj_ID\": \"" + s.getObjectID() + "\", " +
                        "\"Units\": \"" + s.getLinkedDataSlot().getUnits() + "\", " +
                        "\"Set_at\": \""+(s.getLinkedDataSlot().set_at === 'initialization' ? 'initialization' : 'timestep')+"\"";
                    if(s.getLinkedDataSlot().type === 'mupif.Property')
                        params += ', "ValueType": "' + s.getLinkedDataSlot().getValueType() + '"';
                    code.push("\t\t\t\t{" + params + "}");
                    n_slots_printed += 1;
                }
            }
            code.push("\t\t\t],");

            n_slots_printed = 0;
            code.push("\t\t\t\"Outputs\": [");
            slots = this.getAllExternalDataSlots("in");
            for (let i = 0; i < slots.length; i++) {
                s = slots[i];
                if (s.connected()) {
                    if (n_slots_printed)
                        code = addCommaToLastLine(code);
                    params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.getLinkedDataSlot().type + "\", " +
                        "\"description\": \"\", " +
                        "\"Type_ID\": \"" + s.getLinkedDataSlot().getDataID() + "\", " +
                        "\"Obj_ID\": \"" + s.getObjectID() + "\", " +
                        "\"Units\": \"" + s.getLinkedDataSlot().getUnits() + "\"";
                    if(s.getLinkedDataSlot().type === 'mupif.Property')
                        params += ', "ValueType": "' + s.getLinkedDataSlot().getValueType() + '"';
                    code.push("\t\t\t\t{" + params + "}");
                    n_slots_printed += 1;
                }
            }
            code.push("\t\t\t],");

            code.push("\t\t\t\"Models\": [");
            for (let i = 0; i < all_model_blocks.length; i++) {
                if (i)
                    code = addCommaToLastLine(code);
                model = all_model_blocks[i];
                extend_array(code, all_model_blocks[i].getAllocationMetadata(4));
            }
            code.push("\t\t\t]");

            // end

            return code;
        }
        return [];
    }

    generateMetadataJson(){
        let code = ["{"];
        extend_array(code, replace_tabs_with_spaces_for_each_line(this.generateMetadata(true)));
        code.push("}");
        return code;
    }
    
    generateCode(class_code){
        
        console.log('Generating Python code.');
        if(this.canGenerateCode(class_code ? 'class' : 'exec')) {

            this.generateAllElementCodeNames();

            let child_blocks = this.getBlocks();
            let model;
            
            let code = [];
            
            code.push("import mupif");
            code.push("import copy");
            code.push("import Pyro5");
            code.push("import threading");
            
            let model_blocks = this.getBlocksRecursive(BlockModel);
            let imported_modules = [];
            for (let i = 0; i < model_blocks.length; i++) {
                if (model_blocks[i].model_module !== "" && model_blocks[i].exec_type === "Local") {
                    if (!imported_modules.includes(model_blocks[i].model_module)) {
                        code.push("import " + model_blocks[i].model_module);
                        imported_modules.push(model_blocks[i].model_module);
                    }
                }
            }

            code.push("import logging");

            code.push("log = logging.getLogger()");

            code.push("");
            code.push("");
            code.push("@Pyro5.api.expose");
            code.push("class " + this.project_classname + "(mupif.Workflow):");

            // --------------------------------------------------
            // __init__ function
            // --------------------------------------------------

            code.push("");
            code.push("\tdef __init__(self, metadata=None):");

            code.push("\t\tMD = {");

            extend_array(code, this.generateMetadata(class_code));

            let slots;
            let s;

            code.push("\t\t}");
            code.push("\t\tsuper().__init__(metadata=MD)");
            code.push("\t\tself.updateMetadata(metadata)");
            code.push("\t\tself.daemon = None");

            if (class_code) {
                // initialization of workflow inputs
                slots = this.getAllExternalDataSlots("out");
                for (let i = 0; i < slots.length; i++) {
                    s = slots[i];
                    if (s.connected()) {
                        code.push("");
                        code.push("\t\t# initialization code of external input ("+slots[i].obj_id+")");
                        code.push("\t\t" + s.getCodeRepresentation() + " = None");
                        code.push("\t\t# It should be defined from outside using set() method.");
                    }
                }
            }

            // init codes of child blocks

            let allBlocksRecursive = this.getBlocksRecursive();
            for (let i = 0; i < allBlocksRecursive.length; i++)
                extend_array(code, allBlocksRecursive[i].getInitCode(2));
            
            // --------------------------------------------------
            // initialize function
            // --------------------------------------------------

            code.push("");
            code.push("\tdef initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):");
            code.push("\t\tsuper().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)");

            code.push("");

            let conn_info = "";
            if(this.project_nshost && this.project_nsport)
                conn_info = "nshost='" + this.project_nshost + "', nsport=" + this.project_nsport + "";
            code.push("\t\tns = mupif.pyroutil.connectNameServer(" + conn_info + ")");
            code.push("\t\tself.daemon = mupif.pyroutil.getDaemon(ns)");
            
            // setting of the inputs for initialization
            let linked_slot;
            let timestep_time = "None";
            for (let i = 0; i < allBlocksRecursive.length; i++) {
                slots = allBlocksRecursive[i].getSlots('in');
                for (let si = 0; si < slots.length; si++) {
                    if (slots[si].set_at === 'initialization') {
                        let obj_id;
                        linked_slot = slots[si].getLinkedDataSlot();
                        if (linked_slot != null) {
                            if(!(linked_slot instanceof SlotExt)){
                                obj_id = slots[si].obj_id;
                                if (typeof obj_id === 'string')
                                    obj_id = "'" + obj_id + "'";
                                code.push("");
                                code.push("\t\tself.getModel('" + allBlocksRecursive[i].code_name + "').set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
                            }
                        }
                    }
                }
            }
            
            if (class_code) {
                
                // --------------------------------------------------
                // set method
                // --------------------------------------------------

                code.push("");
                code.push("\t# set method for all external inputs");
                code.push("\tdef set(self, obj, objectID=''):");

                let linked_model;
                let value_types = ["mupif.PyroFile", "mupif.Property", "mupif.Field"];
                for(let vi=0;vi<value_types.length;vi++){
                    code.push("");
                    code.push("\t\t# in case of " + value_types[vi]);
                    code.push("\t\tif obj.isInstance(" + value_types[vi] + "):");
                    code.push("\t\t\tpass");
                    slots = this.getAllExternalDataSlots("out");
                    for (let i = 0; i < slots.length; i++) {
                        s = slots[i];
                        if (s.connected()) {
                            if (s.getLinkedDataSlot().type === value_types[vi]) {
                                code.push("\t\t\tif objectID == '" + s.name + "':");
                                if (s.getLinkedDataSlot().type === "mupif.PyroFile") {
                                    code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                                    linked_model = s.getLinkedDataSlot().getParentBlock();
                                    code.push("\t\t\t\tself.getModel('" + linked_model.getCodeName() + "').set(" + s.getCodeRepresentation() + ", '" + s.getLinkedDataSlot().obj_id + "')"); //s.getCodeRepresentation() + " = obj");
                                } else
                                    code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                            }
                        }
                    }
                }
                
                // --------------------------------------------------
                // get method
                // --------------------------------------------------

                code.push("");
                code.push("\t# get method for all external outputs");
                code.push("\tdef get(self, objectTypeID, time=None, objectID=''):");

                slots = this.getAllExternalDataSlots("in");
                for (let i = 0; i < slots.length; i++) {
                    s = slots[i];
                    if (s.connected()) {
                        code.push("\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\treturn " + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'));
                    }
                }

                code.push("");
                code.push("\t\treturn None");
            }

            // --------------------------------------------------
            // solve or solveStep function
            // --------------------------------------------------

            code.push("");
            if (class_code)
                code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
            else
                code.push("\tdef solve(self, runInBackground=False):");

            code.push("\t\tpass");

            for (let i = 0; i < child_blocks.length; i++) {
                model = child_blocks[i];
                if (class_code)
                    code = code.concat(model.getExecutionCode(2, "tstep", false));
                else
                    code = code.concat(model.getExecutionCode(2, "", true));
            }

            code.push("");
            code.push("");

            // --------------------------------------------------
            // execution part
            // --------------------------------------------------

            if (!class_code) {
                code.push("if __name__ == '__main__':");
                code.push("\tproblem = " + this.project_classname + "()");
                code.push("");
                code.push("\t# these metadata are supposed to be filled before execution");
                code.push("\tmd = {");
                code.push("\t\t'Execution': {");
                code.push("\t\t\t'ID': 'N/A',");
                code.push("\t\t\t'Use_case_ID': 'N/A',");
                code.push("\t\t\t'Task_ID': 'N/A'");
                code.push("\t\t}");
                code.push("\t}");
                code.push("\tproblem.initialize(metadata=md)");
                code.push("\tproblem.solve()");
                code.push("\tproblem.terminate()");
                code.push("");
                code.push("\tprint('Simulation has finished.')");
                code.push("");
            }

            return replace_tabs_with_spaces_for_each_line(code);
        }
        return '';
    }

    defineMenu() {
        super.defineMenu();
        this.addAddBlockItems();
        this.addAddExternalSlotItems();
        this.addOrderingMenuItems();
    }

    getClassName() {
        return 'BlockWorkflow';
    }

    getDictForJSON(){
        this.generateAllElementCodeNames();

        let ext_slots = [];
        let data_blocks = [];
        let data_datalinks = [];
        let slots;

        slots = this.getSlots();
        for(let i=0;i<slots.length;i++)
            ext_slots.push(slots[i].getDictForJSON());

        let elem_self = {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': 'None',
            'ext_slots': ext_slots,
            'child_block_sort': this.child_block_sort
        };

        data_blocks.push(elem_self);

        let blocks = this.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++){
            data_blocks.push(blocks[i].getDictForJSON());
        }

        for(let i=0;i<this.editor.datalinks.length;i++){
            data_datalinks.push(this.editor.datalinks[i].getDictForJSON());
        }

        let settings = {
            'project_name': this.project_name,
            'project_classname': this.project_classname,
            'project_modulename': this.project_modulename,
            'project_id': this.project_id,
            'project_nshost': this.project_nshost,
            'project_nsport': this.project_nsport,
            'script_name_base': this.script_name_base,
            'connection_type': this.exec_type
        };
        
        let jobman_settings = {};
        let jobman_to_save = false;
        if(this.jobman_name) {
            jobman_to_save = true;
            jobman_settings['name'] = this.jobman_name;
        }
        
        if(jobman_to_save)
            settings['jobman_settings'] = jobman_settings;
        
        return {'blocks': data_blocks, 'datalinks': data_datalinks, 'settings': settings};
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_workflow';
    }

    getBlockHtmlName(){
        return 'Workflow';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Name = <b>\'' + this.project_name + '\'</b>';
        html += '<br>';
        html += 'ClassName = <b>\'' + this.project_classname + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.project_id + '\'</b>';

        html += '</div>';
        return html;
    }

    getBlockHtmlContent(){
        let html = '';
        html += this.getBlockHtml_header();
        html += this.getBlockHtml_params();
        html += '<table cellspacing="0" class="table_over_content">';
        html += '<tr><td>';
        html += this.getBlockHtml_slots_output();
        html += '</td><td>';
        html += this.getBlockHtml_content();
        html += '</td><td>';
        html += this.getBlockHtml_slots_input();
        html += '</td></tr>';
        html += '</table>';
        html += this.getBlockHtml_footer();
        html += this.getBlockHtml_menu();
        return html;
    }

}