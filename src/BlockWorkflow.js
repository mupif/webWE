class BlockWorkflow extends Block{
    constructor(editor, parent_block){
        super(editor, null);
        this.name = 'Workflow';

        this.settings_project_name = 'My unnamed project';
        this.settings_project_classname = 'MyUnnamedProject';
        this.settings_project_modulename = 'MyModuleName';
        this.settings_project_id = 'my_unnamed_project_01';

    }

    getAllExternalDataSlots(inout){
        return this.getSlots(inout);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return slot.getCodeRepresentation();
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

    generateCode(class_code){
        console.log('Generating Python code.');

        let num_of_external_input_dataslots = 0;

        this.generateAllElementCodeNames();

        let all_model_blocks = this.getBlocksRecursive(BlockModel);
        let child_blocks = this.getBlocks();

        let code = ["import mupif", "import copy"];

        let model_blocks = this.getBlocksRecursive(BlockModel);
        let imported_modules = [];
        for(let i=0;i<model_blocks.length;i++) {
            if(model_blocks[i].model_module !== "") {
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
        code.push("class " + this.settings_project_classname + "(mupif.workflow.Workflow):");

        // __init__ function

        code.push("\t");
        code.push("\tdef __init__(self, metadata={}):");

        code.push("\t\tMD = {");
        code.push("\t\t\t\"ClassName\": \"" + this.settings_project_classname + "\",");
        code.push("\t\t\t\"ModuleName\": \"" + this.settings_project_modulename + "\",");
        code.push("\t\t\t\"Name\": \"" + this.settings_project_name + "\",");
        code.push("\t\t\t\"ID\": \"" + this.settings_project_id + "\",");
        code.push("\t\t\t\"Description\": \"\",");


        let slots;
        let params;
        let s;
        code.push("\t\t\t\"Inputs\": [");
        slots = this.getAllExternalDataSlots("out");
        for (let i=0;i<slots.length;i++) {
            s = slots[i];
            if (s.connected()) {
                num_of_external_input_dataslots += 1;
                params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.type + "\", " +
                    "\"Required\": True, \"description\": \"\", " +
                    "\"Type_ID\": \"" + s.getLinkedDataSlot().getObjType() + "\", " +
                    "\"Obj_ID\": [\"" + s.getObjID() + "\"], " +
                    "\"Units\": \"\"";
                code.push("\t\t\t\t{" + params + "},");
            }
        }
        code.push("\t\t\t],");

        code.push("\t\t\t\"Outputs\": [");
        slots = this.getAllExternalDataSlots("in");
        for (let i=0;i<slots.length;i++) {
            s = slots[i];
            if (s.connected()) {
                num_of_external_input_dataslots += 1;
                params = "\"Name\": \"" + s.name + "\", \"Type\": \"" + s.type + "\", " +
                    "\"description\": \"\", " +
                    "\"Type_ID\": \"" + s.getLinkedDataSlot().getObjType() + "\", " +
                    "\"Obj_ID\": [\"" + s.getObjID() + "\"], " +
                    "\"Units\": \"\"";
                code.push("\t\t\t\t{" + params + "},");
            }
        }
        code.push("\t\t\t],");

        code.push("\t\t}");

        code.push("\t\tmupif.workflow.Workflow.__init__(self, metadata=MD)");

        // metadata
        // code.push("\t\tself.setMetadata('Name', '" + this.settings_project_name + "')");
        // code.push("\t\tself.setMetadata('ID', '" + this.settings_project_id + "')");
        // code.push("\t\tself.setMetadata('Description', '')");

        code.push("\t\tself.updateMetadata(metadata)");

        let code_add;
        if(class_code) {
            // initialization of workflow inputs
            slots = this.getAllExternalDataSlots("out");
            for (let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected()) {
                    code.push("\t");
                    code.push("\t\t# initialization code of external input");
                    code.push("\t\t" + s.getCodeRepresentation() + " = None");
                    code.push("\t\t# It should be defined from outside using set() method.");
                }
            }
        }

        // init codes of child blocks

        let allBlocksRecursive = this.getBlocksRecursive();
        for(let i=0;i<allBlocksRecursive.length;i++)
            extend_array(code, allBlocksRecursive[i].getInitCode(2));

        code.push("");

        // TODO temporarily disabled in master branch
        let model;
        code.push("\t\tself.setMetadata('Model_refs_ID', [])");

        for (let i=0;i<all_model_blocks.length;i++) {
            model = all_model_blocks[i];
            if(model.exec_type === "Local")
                code.push("\t\tself.registerModel(self." + model.getCodeName() + ")");
        }

        // initialize function

        code.push("\t");
        code.push("\tdef initialize(self, file='', workdir='', targetTime=0*mupif.Q.s, metadata={}, validateMetaData=True, **kwargs):");

        code.push("\t\t");

        code.push("\t\tself.updateMetadata(dictionary=metadata)");

        code.push("\t\t");
        code.push("\t\texecMD = {");
        code.push("\t\t\t'Execution': {");
        code.push("\t\t\t\t'ID': self.getMetadata('Execution.ID'),");
        code.push("\t\t\t\t'Use_case_ID': self.getMetadata('Execution.Use_case_ID'),");
        code.push("\t\t\t\t'Task_ID': self.getMetadata('Execution.Task_ID')");
        code.push("\t\t\t}");
        code.push("\t\t}");

        for (let i=0;i<all_model_blocks.length;i++) {
            extend_array(code, all_model_blocks[i].getInitializationCode(2, "execMD"));
        }

        code.push("\t\t");

        code.push("\t\tmupif.workflow.Workflow.initialize(self, file=file, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)");

        // get critical time step function

        if(class_code) {
            code.push("\t");
            code.push("\tdef getCriticalTimeStep(self):");
            code_add = "";
            let ii = 0;
            for (let i=0;i<child_blocks.length;i++) {
                model = child_blocks[i];
                if(model instanceof BlockModel) {
                    if (ii)
                        code_add += ", ";
                    code_add += "self." + model.code_name + ".getCriticalTimeStep()";
                    ii += 1;
                }
            }
            code.push("\t\treturn min([" + code_add + "])");

            //
            //
            // set method

            code.push("\t");
            code.push("\t# set method for all external inputs");
            code.push("\tdef set(self, obj, objectID=0):");

            code.push("\t\t\t");
            code.push("\t\t# in case of Property");
            code.push("\t\tif isinstance(obj, mupif.property.Property):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("out");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if (s.connected())
                    if (s.type === 'mupif.Property') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                    }
            }

            code.push("\t\t\t");
            code.push("\t\t# in case of Field");
            code.push("\t\tif isinstance(obj, mupif.field.Field):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("out");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if (s.connected())
                    if (s.type === 'mupif.Field') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\t" + s.getCodeRepresentation() + " = obj");
                    }
            }

            //
            //
            // get method

            code.push("\t");
            code.push("\t# get method for all external outputs");
            code.push("\tdef get(self, objectType, time=None, objectID=0):");
            code.push("\t\t\t");
            code.push("\t\t# in case of Property");
            code.push("\t\tif isinstance(objectType, mupif.PropertyID):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("in");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected())
                    if(s.type === 'mupif.Property') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\treturn self." + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'))
                    }
            }

            code.push("\t\t\t");
            code.push("\t\t# in case of Field");
            code.push("\t\tif isinstance(objectType, mupif.FieldID):");
            code.push("\t\t\tpass");
            slots = this.getAllExternalDataSlots("in");
            for(let i=0;i<slots.length;i++) {
                s = slots[i];
                if(s.connected())
                    if(s.type === 'mupif.Field') {
                        code.push("\t\t\tif objectID == '" + s.name + "':");
                        code.push("\t\t\t\treturn " + s.getLinkedDataSlot().getParentBlock().generateOutputDataSlotGetFunction(s.getLinkedDataSlot(), 'time'))
                    }
            }

            code.push("\t\t");
            code.push("\t\treturn None");
        }

        // terminate method

        code.push("\t");
        code.push("\tdef terminate(self):");
        code.push("\t\tpass");
        for(let i=0;i<all_model_blocks.length;i++) {
            model = all_model_blocks[i];
            code.push("\t\tself." + model.code_name + ".terminate()");
        }
        code.push("\t");

        // solve or solveStep function

        if(class_code)
            code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
        else
            code.push("\tdef solve(self, runInBackground=False):");

        code.push("\t\tpass");

        for(let i=0;i<child_blocks.length;i++) {
            model = child_blocks[i];
            if(class_code)
                code = code.concat(model.getExecutionCode(2, "tstep", false));
            else
                code = code.concat(model.getExecutionCode(2, "", true));
        }

        code.push("");
        code.push("");

        // execution

        if(!class_code || num_of_external_input_dataslots === 0) {
            code.push("if __name__ == '__main__':");
            code.push("\tproblem = " + this.settings_project_classname + "()");
            code.push("\t");
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
            code.push("\t");
            code.push("\tprint('Simulation has finished.')");
            code.push("");
        }

        return replace_tabs_with_spaces_for_each_line(code);
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
        let slot_dict = {};
        let slots = this.getSlots();
        for (let i = 0; i < slots.length; i++)
            slot_dict[slots[i].getName()] = slots[i].getUID();

        for(let i=0;i<slots.length;i++)
            ext_slots.push(slots[i].getDictForJSON());

        let elem_self = {
            'classname': this.getClassName(),
            'uid': this.getUID(),
            'parent_uid': 'None',
            'slot_uids': slot_dict,
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
            'settings_project_name': this.settings_project_name,
            'settings_project_classname': this.settings_project_classname,
            'settings_project_modulename': this.settings_project_modulename,
            'settings_project_id': this.settings_project_id
        };

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
        html += 'Name = <b>\'' + this.settings_project_name + '\'</b>';
        html += '<br>';
        html += 'ClassName = <b>\'' + this.settings_project_classname + '\'</b>';
        html += '<br>';
        html += 'ID = <b>\'' + this.settings_project_id + '\'</b>';

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