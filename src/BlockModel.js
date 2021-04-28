class BlockModel extends Block {
    constructor(editor, parent_block, md = {}, input_file_name="", input_file_directory="") {
        super(editor, parent_block);
        // this.md = md;

        this.input_file_name = input_file_name;
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
        if ('Execution_type' in this.md)
            if(this.md['Execution_type'] === 'Distributed'){
                this.exec_type = this.md['Execution_type'];
                if('Execution_settings_jobManagerName' in this.md)
                    this.exec_settings_jobmanagername = this.md['Execution_settings_jobManagerName'];
            }else{
                this.exec_type = 'Local';
            }

    }

    constructSlots() {
        this.input_slots = [];
        this.output_slots = [];
        let md = this.md;
        let name;
        for (let i = 0; i < md['Inputs'].length; i++) {
            if ('Obj_ID' in md['Inputs'][i]) {
                if (md['Inputs'][i]['Obj_ID'].length === 0)
                    md['Inputs'][i]['Obj_ID'] = [0];
            } else
                md['Inputs'][i]['Obj_ID'] = [0];
            for (let ii = 0; ii < md['Inputs'][i]['Obj_ID'].length; ii++) {
                name = md['Inputs'][i]['Name'];
                if (md['Inputs'][i]['Obj_ID'][ii] !== '')
                    name += ' [' + md['Inputs'][i]['Obj_ID'][ii] + ']';
                this.addInputSlot(new Slot(this, 'in', name, name, md['Inputs'][i]['Type'], md['Inputs'][i]['Required'], md['Inputs'][i]['Type_ID'], md['Inputs'][i]['Obj_ID'][ii]));// + '(' + md['Inputs'][i]['Type'] + ', ' + md['Inputs'][i]['Type_ID'] + ')'
            }
        }

        for (let i = 0; i < md['Outputs'].length; i++) {
            if ('Obj_ID' in md['Outputs'][i]) {
                if (md['Outputs'][i]['Obj_ID'].length === 0)
                    md['Outputs'][i]['Obj_ID'] = [0];
            } else
                md['Outputs'][i]['Obj_ID'] = [0];
            for (let ii = 0; ii < md['Outputs'][i]['Obj_ID'].length; ii++) {
                name = md['Outputs'][i]['Name'];
                if (md['Outputs'][i]['Obj_ID'][ii] !== '')
                    name += ' [' + md['Outputs'][i]['Obj_ID'][ii] + ']';
                this.addOutputSlot(new Slot(this, 'out', name, name, md['Outputs'][i]['Type'], md['Outputs'][i]['Required'], md['Outputs'][i]['Type_ID'], md['Outputs'][i]['Obj_ID'][ii]));// + '(' + md['Outputs'][i]['Type'] + ', ' + md['Outputs'][i]['Type_ID'] + ')'
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

    getJobmanagerName(){
        return this.code_name+"_jobman"
    }

    getInitCode(indent = 0) {
        let code = super.getInitCode();
        if(this.exec_type === "Distributed"){
            code.push("self." + this.code_name + " = None");
        }else {
            if (this.model_module !== "undefined" && this.model_module !== "")
                code.push("self." + this.code_name + " = " + this.model_module + "." + this.model_name + "()");
            else
                code.push("self." + this.code_name + " = " + this.model_name + "()");
        }
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent = 0, metaDataStr = "{}") {
        let code = super.getInitializationCode();
        if(this.exec_type === "Distributed"){
            code.push("ns = mupif.PyroUtil.connectNameServer('172.30.0.1', 9090, 'mupif-secret-key')");
            code.push("self."+this.getJobmanagerName()+" = mupif.PyroUtil.connectJobManager(ns, '"+this.exec_settings_jobmanagername+"', 'mupif-secret-key')");
            code.push("try:");
            code.push("\tself."+this.code_name+" = mupif.PyroUtil.allocateApplicationWithJobManager( ns, self."+this.getJobmanagerName()+", None, 'mupif-secret-key')");
            code.push("\tlog.info('Created "+this.name+" job')");
            code.push("except Exception as e:");
            code.push("\tlog.exception(e)");
            code.push("else:");
            code.push("\tif self."+this.code_name+" is not None:");
            code.push("\t\tsignature = self."+this.code_name+".getApplicationSignature()");
            code.push("\t\tlog.info('Working "+this.name+" solver on server ' + signature)");
            code.push("\telse:");
            code.push("\t\tlog.debug('Connection to server failed, exiting')");
        }

        if(this.exec_type === "Distributed"){
            code.push("loc_workdir = self." + this.code_name + ".getWorkDir() + '/' + self." + this.code_name + ".getJobID()");
            code.push("self." + this.code_name + ".initialize(workdir=loc_workdir, metadata=" + metaDataStr + ")");
        }else{
            code.push("self." + this.code_name + ".initialize(file='" + this.input_file_name + "', workdir='" + this.input_file_directory + "', metadata=" + metaDataStr + ")");
        }

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
                obj_id = this.input_slots[i].obj_id;
                if (typeof obj_id === 'string')
                    obj_id = "'" + obj_id + "'";
                code.push("self." + this.code_name + ".set(" + linked_slot.getParentBlock().generateOutputDataSlotGetFunction(linked_slot, timestep_time) + ", " + obj_id + ")");
            }
        }

        code.push("self." + this.code_name + ".solveStep(" + timestep + ")");

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
            return "self." + this.code_name + ".get(" + slot.getObjType() + ", " + time + ", " + obj_id + ")";
        }
        return "None";
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_input_file') {
            this.input_file_name = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Input file was set to "'+this.input_file_name+'"', 'green');
        }
        if(action==='set_work_dir') {
            this.input_file_directory = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Working directory was set to "'+this.input_file_directory+'"', 'green');
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
        if (keyword === 'set_input_file') {
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Input file:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.input_file_name+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
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
        dict['model_input_file_name'] = this.input_file_name;
        dict['model_input_file_directory'] = this.input_file_directory;
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
            html += 'Input file = <b>\'' + this.input_file_name + '\'</b>';
            html += '<br>';
            html += 'Working directory = <b>\'' + this.input_file_directory + '\'</b>';
        }
        html += '</div>';
        return html;
    }

}