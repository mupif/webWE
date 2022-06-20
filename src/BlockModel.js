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
        if ('ClassName' in this.md) {
            this.name = this.md['ClassName'];
            this.model_name = this.md['ClassName'];
        } else {
            if ('ID' in this.md)
                this.name = 'Model | ' + this.md['ID'];// + ' | ' + this.md['Name']
            else
                this.name = 'Model';
        }
        if ('Name' in this.md) {
            this.name = this.md['Name'];
        }
        if ('ModuleName' in this.md)
            this.model_module = this.md['ModuleName'];

        this.exec_type = 'Local';
        if ('Execution_settings' in this.md) {
            if ('Type' in this.md['Execution_settings']) {
                if (this.md['Execution_settings']['Type'] === 'Distributed') {
                    this.exec_type = this.md['Execution_settings']['Type'];
                    if ('jobManName' in this.md['Execution_settings'])
                        this.exec_settings_jobmanagername = this.md['Execution_settings']['jobManName'];
                }
            }
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
                vt = md['Inputs'][i]['ValueType'];
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

    getInitCode(indent = 0) {
        return [];
        let code = super.getInitCode();
        code.push("self." + this.code_name + " = None  # instances of models are created in the initialize function");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent = 0, metaDataStr = "{}") {
        let code = super.getInitializationCode();

        // if(this.exec_type === "Distributed"){
        //     code.push("loc_workdir = self." + this.code_name + ".getWorkDir() + '/' + self." + this.code_name + ".getJobID()");
        //     code.push("self." + this.code_name + ".initialize(workdir=loc_workdir, metadata=" + metaDataStr + ")");
        // }else{
        //     code.push("self." + this.code_name + ".initialize(file='" + this.input_file_name + "', workdir='" + this.input_file_directory + "', metadata=" + metaDataStr + ")");
        // }

        if(this.exec_type === "Distributed"){
            let conn_info = "";
            if(this.editor.workflowblock.project_nshost && this.editor.workflowblock.project_nsport)
                conn_info = "nshost='" + this.editor.workflowblock.project_nshost + "', nsport=" + this.editor.workflowblock.project_nsport + "";
            code.push("self." + this.code_name + "_nameserver = mupif.pyroutil.connectNameServer(" + conn_info + ")");
            code.push("self." + this.code_name + "_jobman = mupif.pyroutil.connectJobManager(self." + this.code_name + "_nameserver, '" + this.exec_settings_jobmanagername + "')");
            code.push("try:");
            code.push("\tself." + this.code_name + " = mupif.pyroutil.allocateApplicationWithJobManager(ns=self."+this.code_name+"_nameserver, jobMan=self."+this.code_name+"_jobman)");
            code.push("\tlog.info(self." + this.code_name + ")");
            code.push("except Exception as e:");
            code.push("\tlog.exception(e)");
            
        }else{
            if (this.model_module !== "undefined" && this.model_module !== "")
                code.push("self." + this.code_name + " = " + this.model_module + "." + this.model_name + "()");
            else
                code.push("self." + this.code_name + " = " + this.model_name + "()");
        }
        
        code.push("self." + this.code_name + ".initialize(workdir='" + this.input_file_directory + "', metadata=" + metaDataStr + ")");
        
        
        

        return push_indents_before_each_line(code, indent)
    }

    getExecutionCode(indent = 0, timestep = "", solvefunc=false) {
        if(timestep === "")
            timestep = this.getTimestepVariableNameFromSelfOrParent();

        let code = super.getExecutionCode();

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
                    code.push("self.getModel('" + this.code_name + "').set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
                }
            }
        }

        code.push("self.getModel('" + this.code_name + "').solveStep(" + timestep + ")");

        return push_indents_before_each_line(code, indent);
    }

    getAllocationMetadata(indent=0){
        let code;
        if(this.exec_type === "Distributed") {
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Jobmanager\": \"" + this.exec_settings_jobmanagername + "\"",
                "}"
            ];
        }else{
            code = [
                "{",
                "\t\"Name\": \"" + this.code_name + "\",",
                "\t\"Module\": \"" + this.model_module + "\",",
                "\t\"Class\": \"" + this.model_name + "\"",
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

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_work_dir') {
            this.input_file_directory = document.getElementById('myQuery_temp_val').value;
            console.log('Working directory was set to "'+this.input_file_directory+'"');
        }
        if(action==='set_md') {
            let md_list = this.editor.list_of_model_metadata;
            for (let i = 0; i < md_list.length; i++) {
                if (p1 === md_list[i]['ID']) {
                    this.setMetadataAndUpdate(md_list[i]);
                }
            }
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        // if (keyword === 'set_metadata') {
        //     let md_list = this.editor.list_of_model_metadata;
        //     for (let i = 0; i < md_list.length; i++) {
        //         if (value === md_list[i]['ID']) {
        //             this.setMetadataAndUpdate(md_list[i]);
        //         }
        //     }
        // }
        if (keyword === 'set_work_dir') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Working directory:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.input_file_directory+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
        if (keyword === 'set_md') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Metadata:</b>&nbsp;';
            let md_list = this.editor.list_of_model_metadata;
            for (let i = 0; i < md_list.length; i++)
                q_html += '<br><button style="margin-top:2px;" onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\', \''+md_list[i]['ID']+'\');">'+md_list[i]['Name']+'</button>';

            q_html += '<br><button style="margin-top:2px;color:red;" onclick="myQuery_hide();">Cancel</button>';

            myQuery_show(q_html);
        }


        super.modificationQuery(keyword, value);
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_input_file', '', 'Input&nbsp;file'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_work_dir', '', 'Working&nbsp;directory'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_md', '', 'Metadata'), 'Set');
        // let md_list = this.editor.list_of_model_metadata;
        // for (let i = 0; i < md_list.length; i++)
        //     this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_metadata', md_list[i]['ID'], md_list[i]['Name']), 'Set.MD');
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