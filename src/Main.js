
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
    // moving blocks up
    if(e.which === 38){
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            editor.selected_block.moveMeUp();
            editor.generateWorkflowHtml();
        }
    }
    // moving blocks down
    if(e.which === 40){
        if(editor.selected_block && editor.selected_block !== editor.workflowblock){
            editor.selected_block.moveMeDown();
            editor.generateWorkflowHtml();
        }
    }
    // changing the sorting
    if(e.which === 79){
        if(editor.selected_block){
            if(editor.selected_block.child_block_sort === 'vertical')
                editor.selected_block.child_block_sort = 'horizontal';
            else if(editor.selected_block.child_block_sort === 'horizontal')
                editor.selected_block.child_block_sort = 'vertical';
            editor.generateWorkflowHtml();
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
            '<input type="file" id="form_metadata_file_selector" name="metadata_file" style="display:none;width:100px;" onchange="loadJsonMetaDataFileContent();">' +
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

function loadJsonProjectFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        editor.loadFromJsonData(json_dict);
        editor.generateWorkflowHtml();
    });
    reader.readAsText(document.getElementById('form_json_file_selector').files[0]);
}

function loadJsonMetaDataFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        if(checkMetaDataValidity(json_dict))
            editor.list_of_model_metadata.push(json_dict);
        else
            console.log('MetaData JSON is not valid for usage.');
        updateHtmlOfListOfModels();
    });
    reader.readAsText(document.getElementById('form_metadata_file_selector').files[0]);
}

function loadMetaDataFromJSONOnServer(filename){
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

function loadTextFileFromServer(filename){
    let result = null;
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filename, false);
    xmlhttp.send();
    if (xmlhttp.status===200) {
        result = xmlhttp.responseText;
    }
    return result;
}

function checkMetaDataValidity(md){
    // if(!("ClassName" in md))
    //     return false;
    // if(!("ModuleName" in md))
    //     return false;
    if(!("Name" in md))
        return false;
    if(!("ID" in md))
        return false;
    if(!("Inputs" in md))
        return false;
    if(!("Outputs" in md))
        return false;
    if(!("Execution_settings" in md))
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
        loadMetaDataFromJSONOnServer('examples/metadata/md01.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md02.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md03.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md04.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md05.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md06.json');
    }
    
    if (example_id === 1) {
        let json_data = JSON.parse(loadTextFileFromServer('examples/example01.json'));
        editor.loadFromJsonData(json_data);
    }
    if (example_id === 2) {
        let json_data = JSON.parse(loadTextFileFromServer('examples/example02.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 3){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example03.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 4){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example04.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 5){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example05.json'));
        editor.loadFromJsonData(json_data);
    }
    if(example_id === 6){
        let json_data = JSON.parse(loadTextFileFromServer('examples/example06.json'));
        editor.loadFromJsonData(json_data);
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