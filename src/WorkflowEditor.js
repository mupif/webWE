class WorkflowEditor{
    constructor(){
        this.workflowblock = null;
        this.datalinks = [];

        this.list_of_model_metadata = [];

        this.one_elem_check_disabling_propagation = false;
        this.selected_block = null;
        this.selected_slot_1 = null;
        this.selected_slot_2 = null;
        this.selected_datalink = null;
        this.selected_slot_ext = null;

        this.visual = true;
    }

    /**
     * @param s1
     * @param s2
     * @returns {Datalink}*/
    addDatalink(s1, s2){
        if(s1 && s2) {
            if (s1 !== s2) {
                if (s1.inout !== s2.inout) {
                    if (s1.getNumConnections() < s1.max_connections && s2.getNumConnections() < s2.max_connections) {
                        if (s1.parent_block !== s2.parent_block) {
                            if (s1.external === true || s2.external === true) {
                                if (s1.external === true && s2.external === true) {

                                    myQuery_show_error('Two external slots can not be connected.');
                                    return null;
                                }

                            } else {
                                // // none of the slots is external
                                // if(s1.obj_type !== s2.obj_type){
                                //     myQuery_show_error('The slots must have identical ValueType to be connected.<br>('+s1.obj_type+' X '+s2.obj_type+')');
                                //     return null;
                                // }
                            }


                            let dl = new Datalink(s1, s2);
                            this.datalinks.push(dl);
                            return dl;
                        } else
                            myQuery_show_error('Slots within one block can not be connected.');
                    } else {
                        let slot_naming = '';
                        if (s1.getNumConnections() === s1.max_connections)
                            slot_naming += '<br>(' + s1.name + ')';
                        if (s2.getNumConnections() === s2.max_connections)
                            slot_naming += '<br>(' + s2.name + ')';
                        myQuery_show_error('One of the slots can not accept more connections.' + slot_naming);
                    }
                } else
                    myQuery_show_error('Only input and output dataslot can be connected.<br>(Or input and external input or output and external output)');
            }
        }
        return null;
    }

    removeDatalink(dl) {
        let temp_datalinks = [];
        for (let i = 0; i < this.datalinks.length; i++)
            if (this.datalinks[i] !== dl)
                temp_datalinks.push(this.datalinks[i]);
        this.datalinks = temp_datalinks;
    }

    getExecutionCode(){
        return formatCodeToText(this.workflowblock.generateCode(false));
    }

    getClassCode(){
        return formatCodeToText(this.workflowblock.generateCode(true));
    }

    getJSON(){
        return this.workflowblock.getDictForJSON();
    }

    getBlockByUID(uid){
        if(this.workflowblock.getUID() === uid)
            return this.workflowblock;
        let blocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++)
            if(blocks[i].getUID() === uid)
                return blocks[i];
        return null;
    }

    getDatalinkByUID(uid){
        for(let i=0;i<this.datalinks.length;i++)
            if(this.datalinks[i].id === uid)
                return this.datalinks[i];
        return null;
    }

    getSlotByUID(uid){
        let slots = this.workflowblock.getSlotsRecursive();
        for(let i=0;i<slots.length;i++)
            if(slots[i].id === uid)
                return slots[i];
        return null;
    }

    addBlockByJsonRecord(json_data){
        let parent_block;
        let new_block = null;
        let slot;

        if(json_data['classname']==='BlockWorkflow'){
            this.workflowblock.code_name = json_data['uid'];

            let inout = '';
            for(let i=0;i<json_data['ext_slots'].length;i++){
                slot = json_data['ext_slots'][i];
                if(slot['inout']==='in' || slot['inout']==='out') {
                    if(slot['inout']==='in')
                        inout = 'out';
                    if(slot['inout']==='out')
                        inout = 'in';
                    this.workflowblock.addExternalDataSlot(inout, slot['name'], slot['type'], slot['obj_type']);
                }
            }

            let slots = this.workflowblock.getSlots();
            for(let key in json_data['slot_uids'])
                for(let i=0;i<slots.length;i++)
                    if(slots[i].name === key)
                        slots[i].id = json_data['slot_uids'][key];
        }
        if(json_data['classname']==='BlockConstPhysicalQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPhysicalQuantity(this, parent_block, json_data['value'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockConstProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockProperty(this, parent_block, json_data['value'], json_data['propID'], json_data['valueType'], json_data['units'], json_data['objectID']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockTimeloop'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockTimeloop(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockModel'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockModel(this, parent_block, json_data['metadata'], json_data['model_input_file_name'], json_data['model_input_file_directory']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }

        if(new_block != null){
            let slots = new_block.getSlots();
            for(let i=0;i<slots.length;i++){
                slots[i].id = json_data['slot_uids'][i];
            }
        }

    }

    addDatalinkByJsonRecord(json_data){
        let s1 = this.getSlotByUID(json_data['ds1_uid']);
        let s2 = this.getSlotByUID(json_data['ds2_uid']);
        if(s1 != null && s2 != null)
            this.addDatalink(s1, s2);
    }

    loadFromJsonData(json_data){
        this.workflowblock = new BlockWorkflow(this, null);
        console.log('Constructing project from JSON.');
        if(json_data.constructor === {}.constructor) {
            if('blocks' in json_data && 'datalinks' in json_data && 'settings' in json_data) {
                for (let i = 0; i < json_data['blocks'].length; i++)
                    this.addBlockByJsonRecord(json_data['blocks'][i]);
                for (let i = 0; i < json_data['datalinks'].length; i++)
                    this.addDatalinkByJsonRecord(json_data['datalinks'][i]);
                if('settings_project_name' in json_data['settings'])
                    this.workflowblock.settings_project_name = json_data['settings']['settings_project_name'];
                else
                    console.log('Project name was not in settings.');
                if('settings_project_classname' in json_data['settings'])
                    this.workflowblock.settings_project_classname = json_data['settings']['settings_project_classname'];
                else
                    console.log('Project classname was not in settings.');
                if('settings_project_id' in json_data['settings'])
                    this.workflowblock.settings_project_id = json_data['settings']['settings_project_id'];
                else
                    console.log('Project ID was not in settings.');
            }else{
                console.log('ERROR: The JSON does not contain keys \'blocks\' or/and \'datalinks\' or/and \'settings\'!');
            }
        }else{
            console.log('ERROR: Passed variable must be a dictionary!');
        }
    }

    setProjectName(val){
        this.workflowblock.settings_project_name = val;
    }

    setProjectClassName(val){
        this.workflowblock.settings_project_classname = val;
    }

    setProjectID(val){
        this.workflowblock.settings_project_id = val;
    }

    selectSettingsAndUpdate(){
        this.updateHtmlOfProjectSettings();
        focusOnProjectSettings();
    }

    updateHtmlOfProjectSettings(){
        let slots;
        let slot;

        let html = '<h2><b>Project settings</b></h2>';
        html += '<table style="color:black;">';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>Name:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_name+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_name+'" id="new_project_name"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ClassName:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_classname+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_classname+'" id="new_project_classname"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td>ID:</td>';
        html += '<td><b>'+this.workflowblock.settings_project_id+'</b></td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td><i></i></td>';
        html += '<td><input type="text" value="'+this.workflowblock.settings_project_id+'" id="new_project_id"></b></td>';
        html += '</tr>';

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td></td>';
        html += '<td><button onclick="editor.save_project_detials();">Save</button></td>';
        html += '</tr>';

        html += '</table>';

        //

        html += '<h2 style="margin-top:15px;"><b>External data slots</b></h2>';
        html += '<table class="tbl_ext_slots" cellspacing="0">';

        html += '<tr><td colspan="10" style="height:10px;"></td>';
        html += '<tr>';
        html += '<td>#</td>';
        html += '<td>name</td>';
        html += '</tr>';
        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td colspan="10"><b>Inputs:</b></td>';
        html += '</tr>';

        slots = this.workflowblock.output_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            html += '<tr>';
            html += '<td>'+i+']</td>';

            html += '<td><input id="in_slot_'+i+'_name" value="' + slot.name + '"></td>';

            html += '</tr>';
        }

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td colspan="10"><b>Outputs:</b></td>';
        html += '</tr>';

        slots = this.workflowblock.input_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            html += '<tr>';
            html += '<td>'+i+']</td>';

            html += '<td><input id="out_slot_'+i+'_name"  value="' + slot.name + '"></td>';
            html += '</tr>';
        }

        html += '<tr><td colspan="10" style="height:10px;"></td>';

        html += '<tr>';
        html += '<td></td>';
        html += '<td><button onclick="editor.save_external_data_slots();">Save</button></td>';

        html += '</tr>';

        html += '</table>';

        document.getElementById('block_list_of_settings').innerHTML = html;
    }

    save_external_data_slots(){
        let slots;
        let slot;

        slots = this.workflowblock.output_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            slot.name = document.getElementById('in_slot_'+i+'_name').value;
        }

        slots = this.workflowblock.input_slots;
        for(let i=0;i<slots.length;i++) {
            slot = slots[i];
            slot.name = document.getElementById('out_slot_'+i+'_name').value;
        }

        logToMyConsole('External data slots saved','green');
        this.generateWorkflowHtml();
    }

    save_project_detials(){
        let val;
        val = document.getElementById('new_project_name').value;
        this.setProjectName(val);
        val = document.getElementById('new_project_classname').value;
        this.setProjectClassName(val);
        val = document.getElementById('new_project_id').value;
        this.setProjectID(val);
        this.updateHtmlOfProjectSettings();
        logToMyConsole('Project settings saved','green');
        this.generateWorkflowHtml();
    }

    download(filename, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    menu_download_exec_code(){
        this.download("execution_code.py", this.getExecutionCode());
        let code = this.getExecutionCode();
        // console.log(code);
        let code_html = replaceAllInStr(code, '\t', '    ');
        code_html = replaceAllInStr(code_html, ' ', '&nbsp;&nbsp;');
        code_html = replaceAllInStr(code_html, '\n', '<br>');
        logToMyConsole(code_html, 'white', 12);
    }

    menu_download_class_code(){
        this.download("class_code.py", this.getClassCode());
        let code = this.getClassCode();
        // console.log(code);
        let code_html = replaceAllInStr(code, '\t', ' ');
        code_html = replaceAllInStr(code_html, ' ', '&nbsp;&nbsp;');
        code_html = replaceAllInStr(code_html, '\n', '<br>');
        logToMyConsole(code_html, 'white', 12);
    }

    menu_download_json(){
        let code = this.getJSON();
        this.download("project.json", JSON.stringify(code, null, 4));
        // console.log(code);
        // logToMyConsole(JSON.stringify(code), 'white', 12);
    }

    download_ith_metadata(md_id){
        this.download("md.json", JSON.stringify(editor.list_of_model_metadata[md_id]));
    }

    generateWorkflowHtml(){
        // workflow content
        this.workflowblock.generateAllElementCodeNames();
        // this.generateAllDatalinksCodeNames();

        let code = '';
        code += this.workflowblock.getBlockHtml();
        let container = document.getElementById('workflowSubContainer');
        code += '';
        container.innerHTML = code;

        // datalinks
        for(let i=0;i<this.datalinks.length;i++)
            container.innerHTML += this.datalinks[i].getDatalinkHtml();
    }

    getAllBlocks(){
        let blocks = [];
        blocks.push(this.workflowblock);
        let subblocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<subblocks.length;i++){
            blocks.push(subblocks[i]);
        }
        return blocks;
    }

    deleteDatalinksLinkedToSlot(slot){
        let dls_to_remove = [];
        for(let j=0;j<this.datalinks.length;j++){
            if(this.datalinks[j].slot1 === slot || this.datalinks[j].slot2 === slot)
                dls_to_remove.push(this.datalinks[j]);
        }

        for(let i=0;i<dls_to_remove.length;i++) {
            this.removeDatalink(dls_to_remove[i]);
        }
    }

    deleteExtSlot(slot){
        this.deleteDatalinksLinkedToSlot(slot);
        this.workflowblock.deleteSlot(slot);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='delete_selected_datalink') {
            if(this.selected_datalink)
                this.removeDatalink(this.selected_datalink);
        }
        if(action==='delete_selected_block') {
            if(this.selected_block)
                this.selected_block.deleteSelf();
        }
        if(action==='delete_selected_ext_slot') {
            if(this.selected_slot_ext)
                this.deleteExtSlot(this.selected_slot_ext);
        }
        myQuery_hide();
        this.generateWorkflowHtml();
    }


}