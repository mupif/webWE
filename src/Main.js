
/**
 * Ask for confirmation and delete the selected data link, block or external slot (Delete key, Edit menu).
 */
function confirmDeleteSelection(){
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

/**
 * Ask for confirmation and start a new, empty project (File menu). Unsaved changes are lost.
 */
function confirmNewProject(){
    let q_html = '<b>Start a new project?</b><br>Unsaved changes of the current project will be lost.<br>';
    q_html += '<button onclick="myQuery_hide();editor.newProject();">New project</button>';
    q_html += '&nbsp;<button onclick="myQuery_hide();">Cancel</button>';
    myQuery_show(q_html);
}

/**
 * Show the keyboard and mouse controls of the editor (Help menu).
 */
function showShortcutHelp(){
    let rows = [
        ['Drag a block', 'move it; drop it onto a container to nest it'],
        ['Drag from a slot', 'draw a data link'],
        ['Right click', 'context menu'],
        ['Wheel / drag the background', 'zoom / pan'],
        ['Delete', 'delete the selection'],
        ['&uarr; / &darr;', 'execute the selected block earlier / later'],
        ['O', 're-arrange the children of the selected container'],
        ['Ctrl+Z / Ctrl+Y', 'undo / redo'],
        ['Ctrl+S / Ctrl+O', 'save / open a project'],
        ['Esc', 'close menus, clear the selection']
    ];
    let html = '<b>Keyboard and mouse</b><table class="shortcut_table">';
    rows.forEach(r => { html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    html += '</table><button onclick="myQuery_hide();">Close</button>';
    myQuery_show(html);
}

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
    // the editor shortcuts do not apply while typing in a text field or with a dialog open
    if(keyboardFocusIsElsewhere())
        return;
    // undo: Ctrl+Z, redo: Ctrl+Y or Ctrl+Shift+Z (Cmd on macOS)
    if((e.ctrlKey || e.metaKey) && !e.altKey && (e.which === 90 || e.which === 89)){
        e.preventDefault();
        if(e.which === 90 && !e.shiftKey)
            editor.undo();
        else
            editor.redo();
        return;
    }
    if(e.which === 46)
        confirmDeleteSelection();
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

function deleteMetaDataByListID(list_id){
    editor.list_of_model_metadata.splice(list_id, 1);
    updateHtmlOfListOfModels();
}

/**
 * Show the current list of loaded model metadata in the block palette (after loading or removing metadata).
 */
function updateHtmlOfListOfModels(){
    if(editor.visual && editor.palette)
        editor.palette.renderModels();
}

function loadJsonProjectFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        editor.loadFromJsonData(json_dict);
        editor.generateWorkflowHtml();
    });
    let input = document.getElementById('form_json_file_selector');
    reader.readAsText(input.files[0]);
    input.value = '';// choosing the same file again triggers the change event again
}

function loadJsonMetaDataFileContent(){
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let json_dict = JSON.parse(event.target.result);
        if(checkMetaDataValidity(json_dict))
            editor.list_of_model_metadata.push(json_dict);
        else
            myQuery_show_error('The file does not contain valid model metadata<br>(Name, ID, Inputs, Outputs and Execution_settings are required).');
        updateHtmlOfListOfModels();
    });
    let input = document.getElementById('form_metadata_file_selector');
    reader.readAsText(input.files[0]);
    input.value = '';// choosing the same file again triggers the change event again
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
        editor.history.onChange = () => editor.emit('history');
        editor.shell = new AppShell(editor, document.getElementById('app_topbar'));
        editor.palette = new BlockPalette(editor, document.getElementById('app_palette'));
        editor.inspector = new Inspector(editor, document.getElementById('app_inspector'));
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
        editor.generateWorkflowHtml();
    }

    return editor;
}