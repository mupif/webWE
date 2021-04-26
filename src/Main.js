
function keyPress(e){
    if(e.which === 46){
        if(editor.selected_datalink){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected datalink?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_datalink\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected block?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_block\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
        if(editor.selected_slot_ext){
            myquery_temp_instance = editor;
            let q_html = '';
            q_html += '<b>Delete selected external dataslot?</b><br>';
            q_html += '<button onclick="myquery_temp_instance.myquery_proceed(\'delete_selected_ext_slot\');">Yes</button>';
            q_html += '&nbsp;<button onclick="myQuery_hide();">No</button>';

            myQuery_show(q_html);
        }
    }
}

function anyClick(event, block_uid=null, datalink_uid=null, ext_dataslot_uid=null){
    if(editor.one_elem_check_disabling_propagation === false) {
        editor.one_elem_check_disabling_propagation = true;

        let block_instance = editor.getBlockByUID(block_uid);
        let datalink_instance = editor.getDatalinkByUID(datalink_uid);
        let ext_dataslot_instance = editor.getSlotByUID(ext_dataslot_uid);
        if(ext_dataslot_instance)
            if(ext_dataslot_instance.external === false)
                ext_dataslot_instance = null;

        // 0 = left
        // 1 = middle
        // 2 = right

        if (event.button === 0 || event.button === 2) {
            // block
            editor.selected_block = block_instance;
            let blocks = editor.getAllBlocks();
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].getBlockDiv().classList.remove('we_block_selected');
                blocks[i].getBlockMenuDiv().style.display = 'none';
            }
            if (editor.selected_block) {
                editor.selected_block.getBlockDiv().classList.add('we_block_selected');
            }

            if (event.button === 2 && editor.selected_block) {
                let block_menu = editor.selected_block.getBlockMenuDiv();
                block_menu.style.display = 'block';
            }

            // datalink
            editor.selected_datalink = null;
            for (let i = 0; i < editor.datalinks.length; i++)
                editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_selected');
            if (datalink_instance) {
                editor.selected_datalink = datalink_instance;
                datalink_instance.getDatalinkDiv().classList.add('we_datalink_selected');
            }

            // external dataslot
            editor.selected_slot_ext = null;
            let slots = editor.workflowblock.getAllExternalDataSlots();
            for (let i = 0; i < slots.length; i++)
                slots[i].getDataslotDiv().classList.remove('slot_selected');
            if (ext_dataslot_instance) {
                editor.selected_slot_ext = ext_dataslot_instance;
                ext_dataslot_instance.getDataslotDiv().classList.add('slot_selected');
            }
        }
    }
}

function datalinkHoverOut(){
    for (let i = 0; i < editor.datalinks.length; i++)
        editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_hover');
}

function datalinkHoverIn(datalink_uid){
    let datalink_instance = editor.getDatalinkByUID(datalink_uid);
    for (let i = 0; i < editor.datalinks.length; i++)
        editor.datalinks[i].getDatalinkDiv().classList.remove('we_datalink_hover');
    if (datalink_instance) {
        datalink_instance.getDatalinkDiv().classList.add('we_datalink_hover');
    }
}

function datalink_creation_begin(slot_uid){
    editor.selected_slot_1 = editor.getSlotByUID(slot_uid);
}

function datalink_creation_finalize(slot_uid){
    editor.selected_slot_2 = editor.getSlotByUID(slot_uid);

    if(editor.selected_slot_1 && editor.selected_slot_2){
        editor.addDatalink(editor.selected_slot_1, editor.selected_slot_2);
        editor.selected_slot_1 = null;
        editor.selected_slot_2 = null;
    }
    editor.generateWorkflowHtml();
}

function focusOnEditor(){
    document.getElementById('workflowContainer').style.display = 'block';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'black';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnProjectSettings(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'block';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'black';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnModelList(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'block';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'black';
}

function deleteMetaDataByListID(list_id){
    editor.list_of_model_metadata.splice(list_id, 1);
    updateHtmlOfListOfModels();
}

function updateHtmlOfListOfModels(){
    if(editor.visual) {
        let elem_list_of_models = document.getElementById('block_list_of_models');
        let temp_html = '<h2 style="margin-bottom:20px;"><b>Project models</b>' +
            '<form action="" method="post" enctype="multipart/form-data" style="margin:0;padding:0;display:inline-block;" id="form_metadata_data">' +
            '<label for="form_metadata_file_selector" id="label_form_metadata_file_selector" style="display:none;">' +
            'Load MetaData JSON from file' +
            '<input type="file" id="form_metadata_file_selector" name="metadata_file" style="display:none;width:100px;" onchange="loadMetaDataFromJSONFileUsingAjax();">' +
            '</label>' +
            '<input type="hidden" value="Load from JSON" name="file_upload">' +
            '</form>' +
            '<button onclick="document.getElementById(\'label_form_metadata_file_selector\').click();" style="margin-left:30px;">Load MetaData JSON from file</button>' +
            '</h2>';

        temp_html += '<table style="color:black;">';
        for (let i = 0; i < editor.list_of_model_metadata.length; i++) {
            temp_html += '' +
                '<tr>' +
                '<td>' + (i + 1) + ']</td><td style="padding:3px 10px 3px 10px;"><b>' + editor.list_of_model_metadata[i]['Name'] + '</b></td>' +
                '<td><button onclick="editor.download_ith_metadata(' + i + ');">download</button></td>' +
                '<td><button onclick="deleteMetaDataByListID(' + i + ');">delete</button></td>' +
                '</tr>';
        }
        temp_html += '</table>';

        elem_list_of_models.innerHTML = temp_html;
    }
}

function loadMetaDataFromJSONFileUsingAjax(){
    let fileSelect = document.getElementById('form_metadata_file_selector');
    let files = fileSelect.files;
    let formData = new FormData();
    for(let i = 0; i < files.length; i++){
        let file = files[i];

        // Add the file to the form's data
        formData.append('myfiles[]', file, file.name);
    }

    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            let answer = this.responseText.trim();
            // console.log(answer);
            let model_json = JSON.parse(answer);
            if(checkMetaDataValidity(model_json))
                editor.list_of_model_metadata.push(model_json);
            else
                console.log('MetaData JSON is not valid for usage.');
            updateHtmlOfListOfModels();
        }else{
            console.log('fail');
        }
    };

    xmlhttp.open('POST', 'do.php?action=get_metadata_from_json_file', true);
    xmlhttp.send(formData);
}

function loadMetaDataFromJSONOnServer(filename){
//     let xmlhttp = new XMLHttpRequest();
//
//     xmlhttp.onload = function () {
//         if (this.readyState === 4 && this.status === 200) {
//             let answer = this.responseText.trim();
//             // console.log(answer);
//             let model_json = JSON.parse(answer);
//             if(checkMetaDataValidity(model_json))
//                 editor.list_of_model_metadata.push(model_json);
//             else
//                 console.log('MetaData JSON is not valid for usage.');
//             updateHtmlOfListOfModels();
//         }else{
//             console.log('fail');
//         }
//     };
//
// xmlhttp.open('POST', 'do.php?action=get_metadata_from_json_file_on_server&myfilename='+filename, true);
// xmlhttp.send();


    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                let answer = rawFile.responseText;
                let model_json = JSON.parse(answer);
                if(checkMetaDataValidity(model_json))
                    editor.list_of_model_metadata.push(model_json);
                else
                    console.log('MetaData JSON is not valid for usage.');
                updateHtmlOfListOfModels();
            }
        }
    };
    rawFile.send(null);

}

function checkMetaDataValidity(md){
    if(!("ClassName" in md))
        return false;
    if(!("ModuleName" in md))
        return false;
    if(!("Name" in md))
        return false;
    if(!("ID" in md))
        return false;
    if(!("Inputs" in md))
        return false;
    if(!("Outputs" in md))
        return false;
    return true;
}


function main(visual=false)
{



    editor = new WorkflowEditor();

    // ====================================================================================================
    // ====================================================================================================
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====

    // MAIN CODE

    let workflow = new BlockWorkflow(editor, null);
    editor.workflowblock = workflow;
    editor.visual = visual;

    if(visual) {
        loadMetaDataFromJSONOnServer('md1.json');
        loadMetaDataFromJSONOnServer('md2.json');
        loadMetaDataFromJSONOnServer('md3.json');
        loadMetaDataFromJSONOnServer('md4.json');
        loadMetaDataFromJSONOnServer('md5.json');
        loadMetaDataFromJSONOnServer('md6.json');
    }

    if(loaded_json != null){
        editor.loadFromJsonData(loaded_json);
    }
    else {
        if (example_id === 1) {
            let b_pq1 = new BlockPhysicalQuantity(editor, workflow, '0.0', 's');
            workflow.addBlock(b_pq1);
            let b_pq2 = new BlockPhysicalQuantity(editor, workflow, '10.0', 's');
            workflow.addBlock(b_pq2);
            let b_pq3 = new BlockPhysicalQuantity(editor, workflow, '0.5', 's');
            workflow.addBlock(b_pq3);
            let b_pr1 = new BlockProperty(editor, workflow, '(10.0,)', 'mupif.PropertyID.PID_Temperature', 'mupif.ValueType.Scalar', 'degC', 0);
            workflow.addBlock(b_pr1);

            let b_tl = new BlockTimeloop(editor, workflow);
            workflow.addBlock(b_tl);

            let b_m1 = new BlockModel(editor, b_tl, metaDataThermalNonStat);
            b_m1.input_file_name = 'inputT13.in';
            b_tl.addBlock(b_m1);
            let b_m2 = new BlockModel(editor, b_tl, metaDataMechanical);
            b_m2.input_file_name = 'inputM13.in';
            b_tl.addBlock(b_m2);

            let s1;
            let s2;

            s1 = b_pq1.output_slots[0];
            s2 = b_tl.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_pq2.output_slots[0];
            s2 = b_tl.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = b_pq3.output_slots[0];
            s2 = b_tl.input_slots[2];
            editor.addDatalink(s1, s2);

            s1 = b_pr1.output_slots[0];
            s2 = b_m1.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = b_m2.input_slots[0];
            editor.addDatalink(s1, s2);

        }
        if (example_id === 2) {
            workflow.addExternalDataSlot('in', 'top_temperature', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'temperature', 'mupif.Field');
            workflow.addExternalDataSlot('out', 'displacement', 'mupif.Field');

            let b_pr1 = new BlockProperty(editor, workflow, '(0.0,)', 'mupif.PropertyID.PID_Temperature', 'mupif.ValueType.Scalar', 'degC', 0);
            workflow.addBlock(b_pr1);

            let b_m1 = new BlockModel(editor, workflow, metaDataThermalNonStat);
            b_m1.input_file_name = 'inputT13.in';
            workflow.addBlock(b_m1);
            let b_m2 = new BlockModel(editor, workflow, metaDataMechanical);
            b_m2.input_file_name = 'inputM13.in';
            workflow.addBlock(b_m2);

            let s1;
            let s2;

            s1 = b_pr1.output_slots[0];
            s2 = b_m1.input_slots[5];
            editor.addDatalink(s1, s2);

            s1 = b_pr1.output_slots[0];
            s2 = b_m1.input_slots[6];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = b_m2.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = workflow.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[0];
            s2 = workflow.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = b_m1.input_slots[0];
            s2 = workflow.output_slots[0];
            editor.addDatalink(s1, s2);
        }
        if (example_id === 3) {

            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_SMILE_MOLECULAR_STRUCTURE', 'Name': 'monomerMolStructure',
            //     'Description': 'Monomer molecular structure (SMILE representation)', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_MOLECULAR_WEIGHT', 'Name': 'polymerMolWeight',
            //     'Description': 'Polymer molecular weight', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_CROSSLINKER_TYPE', 'Name': 'crosslinkerType',
            //     'Description': 'Crosslinker type (SMILE representation)', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_FILLER_DESIGNATION', 'Name': 'fillerDesignation',
            //     'Description': 'Filler designation', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_CROSSLINKONG_DENSITY', 'Name': 'crosslinkingDens',
            //     'Description': 'Crosslinking density', 'Units': '%', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_FILLER_CONCENTRATION', 'Name': 'fillerConc',
            //     'Description': 'Filler concentration', 'Units': '%w/w', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_TEMPERATURE', 'Name': 'temperature',
            //     'Description': 'Temperature', 'Units': '°C', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_PRESSURE', 'Name': 'pressure',
            //     'Description': 'Pressure', 'Units': 'atm', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_POLYDISPERSITY_INDEX', 'Name': 'polyIndex',
            //     'Description': 'Polydispersity index', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_SMILE_MODIFIER_MOLECULAR_STRUCTURE', 'Name': 'fillerModMolStructure',
            //     'Description': 'Polymer/Filler compatibilizer molecular structure (SMILE representation)', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_SMILE_FILLER_MOLECULAR_STRUCTURE', 'Name': 'polFilCompatibilizerMolStructure',
            //     'Description': 'Filler modifier molecular structure (SMILE representation)', 'Units': 'None', 'Required': True},
            // {'Type': 'mupif.Property', 'Type_ID': 'mupif.PropertyID.PID_DENSITY_OF_FUNCTIONALIZATION', 'Name': 'functionalizationDens',
            //     'Description': 'Density of functionalization', 'Units': 'n/nm**2', 'Required': True}

            workflow.addExternalDataSlot('in', 'monomerMolStructure', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'polymerMolWeight', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'crosslinkerType', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'fillerDesignation', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'crosslinkingDens', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'fillerConc', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'temperature', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'pressure', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'polyIndex', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'fillerModMolStructure', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'polFilCompatibilizerMolStructure', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'functionalizationDens', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'E_i', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'nu_i', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'aspectratio', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'vof', 'mupif.Property');
            workflow.addExternalDataSlot('in', 'rho_i', 'mupif.Property');


            workflow.addExternalDataSlot('out', 'E_m', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'nu_m', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'rho_m', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'cond_m', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'T_c_m', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'E_axial', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'E_plane', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'G_plane', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'G_transverse', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'nu_plane', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'nu_transverse', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'rho_c', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'Stiffness', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'Mass', 'mupif.Property');
            workflow.addExternalDataSlot('out', 'maxStress', 'mupif.Property');

            // let b_pr1 = new BlockProperty(editor, workflow, '(0.0,)', 'mupif.PropertyID.PID_Temperature', 'mupif.ValueType.Scalar', 'degC', 0);
            // workflow.addBlock(b_pr1);

            let b_m1 = new BlockModel(editor, workflow, metaData_LAMMPS);
            workflow.addBlock(b_m1);

            let b_m2 = new BlockModel(editor, workflow, metaData_DIGIMAT);
            workflow.addBlock(b_m2);

            let b_m3 = new BlockModel(editor, workflow, metaData_ABAQUS);
            workflow.addBlock(b_m3);

            let s1;
            let s2;

            // ------------------------------
            // external inputs
            for(let i=0;i<=11;i++) {
                s1 = workflow.output_slots[i];
                s2 = b_m1.input_slots[i];
                editor.addDatalink(s1, s2);
            }

            s1 = workflow.output_slots[15];
            s2 = b_m2.input_slots[5];
            editor.addDatalink(s1, s2);

            s1 = workflow.output_slots[12];
            s2 = b_m2.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = workflow.output_slots[13];
            s2 = b_m2.input_slots[3];
            editor.addDatalink(s1, s2);

            s1 = workflow.output_slots[16];
            s2 = b_m2.input_slots[6];
            editor.addDatalink(s1, s2);

            s1 = workflow.output_slots[14];
            s2 = b_m2.input_slots[4];
            editor.addDatalink(s1, s2);

            // ------------------------------
            // external outputs
            s1 = b_m1.output_slots[1];
            s2 = workflow.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[4];
            s2 = workflow.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = workflow.input_slots[2];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[2];
            s2 = workflow.input_slots[3];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[3];
            s2 = workflow.input_slots[4];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[0];
            s2 = workflow.input_slots[5];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[1];
            s2 = workflow.input_slots[6];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[2];
            s2 = workflow.input_slots[7];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[3];
            s2 = workflow.input_slots[8];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[4];
            s2 = workflow.input_slots[9];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[5];
            s2 = workflow.input_slots[10];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[6];
            s2 = workflow.input_slots[11];
            editor.addDatalink(s1, s2);

            s1 = b_m3.output_slots[1];
            s2 = workflow.input_slots[13];
            editor.addDatalink(s1, s2);

            s1 = b_m3.output_slots[0];
            s2 = workflow.input_slots[12];
            editor.addDatalink(s1, s2);

            s1 = b_m3.output_slots[2];
            s2 = workflow.input_slots[14];
            editor.addDatalink(s1, s2);



            // ------------------------------
            // linking inside
            s1 = b_m1.output_slots[1];
            s2 = b_m2.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[4];
            s2 = b_m2.input_slots[2];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = b_m2.input_slots[7];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[0];
            s2 = b_m3.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[1];
            s2 = b_m3.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[1];
            s2 = b_m3.input_slots[2];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[2];
            s2 = b_m3.input_slots[8];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[3];
            s2 = b_m3.input_slots[7];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[3];
            s2 = b_m3.input_slots[6];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[4];
            s2 = b_m3.input_slots[5];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[5];
            s2 = b_m3.input_slots[3];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[5];
            s2 = b_m3.input_slots[4];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[6];
            s2 = b_m3.input_slots[9];
            editor.addDatalink(s1, s2);

            // s1 = b_pr1.output_slots[0];
            // s2 = b_m1.input_slots[6];
            // editor.addDatalink(s1, s2);
            //
            // s1 = b_m1.output_slots[0];
            // s2 = b_m2.input_slots[0];
            // editor.addDatalink(s1, s2);
            //
            // s1 = b_m1.output_slots[0];
            // s2 = workflow.input_slots[0];
            // editor.addDatalink(s1, s2);
            //
            // s1 = b_m2.output_slots[0];
            // s2 = workflow.input_slots[1];
            // editor.addDatalink(s1, s2);
            //
            // s1 = b_m1.input_slots[0];
            // s2 = workflow.output_slots[0];
            // editor.addDatalink(s1, s2);
        }
        if (example_id === 4) {
            workflow.settings_project_name = 'User Case 1';
            workflow.settings_project_classname = 'UserCase1Workflow';
            workflow.settings_project_id = 'user_case_1';
            workflow.child_block_sort = 'vertical';

            workflow.addExternalDataSlot('in', 'atomic_set', 'mupif.AtomicSet');
            workflow.addExternalDataSlot('out', 'atomic_set', 'mupif.AtomicSet');
            workflow.addExternalDataSlot('out', 'hopping_sites', 'mupif.HoppingSites');
            workflow.addExternalDataSlot('out', 'neighbor_list', 'mupif.NeighborList');

            //

            let b_it = new BlockDoWhile(editor, workflow);
            workflow.addBlock(b_it);
            b_it.child_block_sort = 'vertical';

            let b_m1 = new BlockModel(editor, b_it, md_p1);
            b_it.addBlock(b_m1);

            let b_m2 = new BlockModel(editor, b_it, md_p2);
            b_it.addBlock(b_m2);

            let b_m3 = new BlockModel(editor, workflow, md_p3);
            workflow.addBlock(b_m3);

            let b_m4 = new BlockModel(editor, workflow, md_p4);
            workflow.addBlock(b_m4);

            let s1, s2;

            s1 = b_m1.output_slots[0];
            s2 = b_m2.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m1.output_slots[0];
            s2 = b_m3.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m3.output_slots[0];
            s2 = b_m4.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m2.output_slots[0];
            s2 = b_it.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = workflow.output_slots[0];
            s2 = b_m1.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m4.output_slots[0];
            s2 = workflow.input_slots[0];
            editor.addDatalink(s1, s2);

            s1 = b_m4.output_slots[1];
            s2 = workflow.input_slots[1];
            editor.addDatalink(s1, s2);

            s1 = b_m4.output_slots[2];
            s2 = workflow.input_slots[2];
            editor.addDatalink(s1, s2);

        }
    }

    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // =====                                                                                          =====
    // ====================================================================================================
    // ====================================================================================================

    if(visual) {
        updateHtmlOfListOfModels();
        focusOnEditor();
        editor.generateWorkflowHtml();
    }

    return editor;
}