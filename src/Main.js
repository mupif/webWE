
/**
 * @returns {boolean} true when the keyboard focus is in a text field or a dialog is open; editor shortcuts are
 *          not handled then (e.g., Ctrl+Z undoes the typing in the field)
 */
function keyboardFocusIsElsewhere(){
    let el = document.activeElement;
    if(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable))
        return true;
    let dialog = document.getElementById('myQuery_container');
    return dialog !== null && dialog.style.display === 'block';
}

function keyPress(e){
    // undo: Ctrl+Z, redo: Ctrl+Y or Ctrl+Shift+Z (Cmd on macOS)
    if((e.ctrlKey || e.metaKey) && !e.altKey && (e.which === 90 || e.which === 89)){
        if(keyboardFocusIsElsewhere())
            return;
        e.preventDefault();
        if(e.which === 90 && !e.shiftKey)
            editor.undo();
        else
            editor.redo();
        return;
    }
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
    // changing the arrangement of child blocks (vertical -> horizontal -> data flow -> vertical)
    if(e.which === 79){
        if(editor.selected_block && editor.selected_block.isContainer()){
            let next = {'vertical': 'horizontal', 'horizontal': 'dataflow', 'dataflow': 'vertical'};
            editor.selected_block.arrangeChildren(next[editor.selected_block.child_block_sort] || 'vertical');
            editor.generateWorkflowHtml();
        }
    }
    // Escape closes the context menu of the canvas and clears the selection
    if(e.which === 27 && editor.canvas){
        editor.canvas.select(null);
    }
}

function focusOnEditor(){
    document.getElementById('workflowContainer').style.display = 'block';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'gray';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';

    editor.generateWorkflowHtml()
}

function focusOnProjectSettings(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'block';
    document.getElementById('modelListContainer').style.display = 'none';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'gray';
    document.getElementById('nav_models').style.backgroundColor = 'transparent';
}

function focusOnModelList(){
    document.getElementById('workflowContainer').style.display = 'none';
    document.getElementById('projectSettingsContainer').style.display = 'none';
    document.getElementById('modelListContainer').style.display = 'block';

    document.getElementById('nav_editor').style.backgroundColor = 'transparent';
    document.getElementById('nav_settings').style.backgroundColor = 'transparent';
    document.getElementById('nav_models').style.backgroundColor = 'gray';
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

    editor.workflowblock = new BlockWorkflow(editor, null);
    editor.visual = visual;

    if(visual) {
        editor.canvas = new CanvasView(editor, document.getElementById('workflowCanvas'));
        // the history records every redraw which changed the project (see WorkflowEditor.generateWorkflowHtml)
        editor.history = new EditHistory(editor);
        editor.history.onChange = () => editor.canvas.updateUndoButtons();
    }

    if(visual) {
        loadMetaDataFromJSONOnServer('examples/metadata/md01.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md02.json');
        loadMetaDataFromJSONOnServer('examples/metadata/md03.json');
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