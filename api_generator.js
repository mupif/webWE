let elem_input = document.getElementById('data_input');
let elem_output = document.getElementById('data_output');
let elem_error = document.getElementById('elem_error');

let elem_basic_editor = document.getElementById('basic_editor');
let elem_interactive_editor = document.getElementById('interactive_editor');
let elem_interactive_input_params = document.getElementById('interactive_input_params');
let elem_interactive_inputs = document.getElementById('interactive_inputs');
let elem_interactive_outputs = document.getElementById('interactive_outputs');

let interactive_json_data = {};

const setAtValues = ['initialization', 'timestep'];
const valueTypes = ['Scalar', 'Vector', 'Tensor', 'ScalarArray', 'VectorArray', 'TensorArray'];
const dataTypes = [
    'mupif.Property',
    'mupif.TemporalProperty',
    'mupif.Field',
    'mupif.TemporalField',
    'mupif.Function',
    'mupif.HeavyStruct',
    'mupif.PyroFile',
    'mupif.String',
    'mupif.GrainState',
    'mupif.DataList[mupif.Property]',
    'mupif.DataList[mupif.TemporalProperty]',
    'mupif.DataList[mupif.Field]',
    'mupif.DataList[mupif.TemporalField]',
    'mupif.DataList[mupif.Function]',
    'mupif.DataList[mupif.HeavyStruct]',
    'mupif.DataList[mupif.PyroFile]',
    'mupif.DataList[mupif.String]',
    'mupif.DataList[mupif.GrainState]'
];

let interactive_inputs = [
    {path: "Name", type: "text", nonempty: true},
    {path: "ID",  type: "text", nonempty: true},
    {path: "Execution_settings.Type",  type: "select", options: ["Local", "Distributed"], nonempty: true},
    {path: "Execution_settings.jobManName", type: "text", nonempty: true},
    {path: "Execution_settings.Class",  type: "text", nonempty: true},
    {path: "Execution_settings.Module",  type: "text", nonempty: true},
    {path: "Physics.Type",  type: "select", options: ["Electronic", "Atomistic", "Molecular", "Mesoscopic", "Continuum", "Other"], nonempty: true},
    {path: "Physics.Entity",  type: "select", options: ["Atom", "Electron", "Grains", "Finite volume", "Other"], nonempty: true},
    {path: "Solver.Required_expertise",  type: "select", options: ["None", "User", "Expert"], nonempty: true},
    {path: "Solver.Accuracy",  type: "select", options: ["Low", "Medium", "High", "Unknown"], nonempty: true},
    {path: "Solver.Sensitivity",  type: "select", options: ["Low", "Medium", "High", "Unknown"], nonempty: true},
    {path: "Solver.Complexity",  type: "select", options: ["Low", "Medium", "High", "Unknown"], nonempty: true},
    {path: "Solver.Robustness",  type: "select", options: ["Low", "Medium", "High", "Unknown"], nonempty: true},
    {path: "Solver.Software",  type: "text"},
    {path: "Solver.Language",  type: "text"},
    {path: "Solver.License",  type: "text"},
    {path: "Solver.Creator",  type: "text"},
    {path: "Solver.Version_date",  type: "text"},
    {path: "Solver.Documentation",  type: "text"},
    {path: "Solver.Estim_time_step_s",  type: "text"},
    {path: "Solver.Estim_comp_time_s",  type: "text"},
    {path: "Solver.Estim_execution_cost_EUR",  type: "text"},
    {path: "Solver.Estim_personnel_cost_EUR",  type: "text"},
];

let interactive_output_attributes = [
    {key: "Name", name: "Name", type: "text", nonempty: true},
    {key: "Type", name: "Type", type: "select", options: dataTypes, nonempty: true},
    {key: "ValueType", name: "ValueType", type: "select", options: valueTypes, nonempty: true},
    {key: "Type_ID", name: "DataID", type: "select", options: mupif_DataID, nonempty: true},
    {key: "Units", name: "Units", type: "text"},
    {key: "Obj_ID", name: "Obj_ID", type: "text"},
];
let interactive_input_attributes = structuredClone(interactive_output_attributes);
interactive_input_attributes.push(
    {key: "Required", name: "Required", type: "select", options: [true, false], nonempty: true, bool: true},
    {key: "Set_at", name: "Set_at", type: "select", options: setAtValues, nonempty: true},
);



function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

function textAreaAdjust(element) {
    element.style.height = "1px";
    element.style.height = (25+element.scrollHeight)+"px";
}

function fixMissingMDItems(){
    interactive_inputs.forEach(i => {
        let keywords = i.path.split('.');
        let k1 = null;
        let k2 = null;
        if(keywords.length > 0){k1 = keywords[0];}
        if(keywords.length > 1){k2 = keywords[1];}
        if(k2 !== null){
            if(!(k1 in interactive_json_data)){
                interactive_json_data[k1] = {};
            }
            if(!(k2 in interactive_json_data[k1])) {
                interactive_json_data[k1][k2] = '';
            }
        }
        else if(k1 !== null){
            if(!(k1 in interactive_json_data)){
                interactive_json_data[k1] = '';
            }
        }
    })
    if(!("Inputs" in interactive_json_data)){interactive_json_data["Inputs"] = [];}
    if(!("Outputs" in interactive_json_data)){interactive_json_data["Outputs"] = [];}
    saveInteractiveJsonData();
}

function highlightRequiredNonEmptyParams(){
    interactive_inputs.forEach(i => {
        if('nonempty' in i){
            if(i['nonempty'] === true){
                let elem_id = 'param_' + i.path;
                let elem = document.getElementById(elem_id);
                if(elem) {
                    if (getMDAttribute(i.path) === '') {
                        elem.style.border = '1px solid red';
                    } else {
                        elem.style.border = '1px solid gray';
                    }
                }
            }
        }

        let keywords = i.path.split('.');
        let k1 = null;
        let k2 = null;
        if(keywords.length > 0){k1 = keywords[0];}
        if(keywords.length > 1){k2 = keywords[1];}
        if(k2 !== null){
            if(!(k1 in interactive_json_data)){
                interactive_json_data[k1] = {};
            }
            if(!(k2 in interactive_json_data[k1])) {
                interactive_json_data[k1][k2] = '';
            }
        }
        else if(k1 !== null){
            if(!(k1 in interactive_json_data)){
                interactive_json_data[k1] = '';
            }
        }
    })

    let ioDirection = 'Inputs';
    let io_length = interactive_json_data[ioDirection].length;
    for (let ioidx = 0; ioidx < io_length; ioidx++) {
        let io = interactive_json_data[ioDirection][ioidx];
        interactive_input_attributes.forEach(ioa => {
            if('nonempty' in ioa){
                if(io[ioa.key] === ''){
                    let elem_id = 'inp_'+ioidx+'_param_'+ioa.key;
                    let elem = document.getElementById(elem_id);
                    if(elem) {
                        if (getMDIOAttribute(ioDirection, ioidx, ioa.key) === '') {
                            elem.style.border = '1px solid red';
                        } else {
                            elem.style.border = '1px solid gray';
                        }
                    }
                }
            }
        })
    }
    ioDirection = 'Outputs';
    io_length = interactive_json_data[ioDirection].length;
    for (let ioidx = 0; ioidx < io_length; ioidx++) {
        let io = interactive_json_data[ioDirection][ioidx];
        interactive_input_attributes.forEach(ioa => {
            if('nonempty' in ioa){
                if(io[ioa.key] === ''){
                    let elem_id = 'out_'+ioidx+'_param_'+ioa.key;
                    let elem = document.getElementById(elem_id);
                    if(elem) {
                        if (getMDIOAttribute(ioDirection, ioidx, ioa.key) === '') {
                            elem.style.border = '1px solid red';
                        } else {
                            elem.style.border = '1px solid gray';
                        }
                    }
                }
            }
        })
    }
}

function setInteractiveEditorVisibility(val){
    if(val){
        loadInteractiveJsonData();
        generateInteractiveInputs();
        highlightRequiredNonEmptyParams();
        elem_basic_editor.style.display = 'none';
        elem_interactive_editor.style.display = 'block';
    }else{
        elem_basic_editor.style.display = 'block';
        elem_interactive_editor.style.display = 'none';
        generateApiImplementation();
    }
}

function getMDAttribute(path){
    let data = interactive_json_data;
    let keywords = path.split('.');
    let k1 = null;
    let k2 = null;
    if(keywords.length > 0){k1 = keywords[0];}
    if(keywords.length > 1){k2 = keywords[1];}
    if(k2 !== null){
        if(k1 in data){
            if(k2 in data[k1]){
                return data[k1][k2];
            }
        }
    }
    if(k1 !== null){
        if(k1 in data){
            return data[k1];
        }
    }
    return '';
}

function setMDAttribute(path, value){
    let keywords = path.split('.');
    let k1 = null;
    let k2 = null;
    if(keywords.length > 0){k1 = keywords[0];}
    if(keywords.length > 1){k2 = keywords[1];}
    if(k2 !== null){
        if(!(k1 in interactive_json_data)){
            interactive_json_data[k1] = {};
        }
        interactive_json_data[k1][k2] = value;
    }
    else if(k1 !== null){
        interactive_json_data[k1] = value;
    }
    saveInteractiveJsonData();
    highlightRequiredNonEmptyParams();
}

function getMDIOAttribute(io, idx, key){
    let data = interactive_json_data;
    if(io in data){
        if(data[io].length >= idx+1){
            if(key in data[io][idx]){
                return data[io][idx][key];
            }
        }
    }
    return '';
}

function setMDIOAttribute(io, idx, key, value){
    let setval = value;
    if(key === 'Required'){
        setval = value === 'true' || value === true;
    }
    interactive_json_data[io][idx][key] = setval;
    saveInteractiveJsonData();
    highlightRequiredNonEmptyParams();
}

function generateInteractiveInputs(){
    let last_section = null;
    let res_html = '<div class="p2">Model info</div>';
    interactive_inputs.forEach(i => {
        let path_items = i.path.split('.');
        let section = path_items[0];
        if(path_items.length > 1) {
            if (section !== last_section) {
                last_section = section;
                res_html += '<div class="p2">' + section + '</div>';
            }
        }
        let attr_name = path_items[path_items.length-1];

        res_html += '<div class="hbox align_items_center">';
        res_html += '   <div class="param_section_tab"></div>';
        res_html += '   <div class="p3 param_name">'+attr_name+'</div>';
        res_html += '   <div class="param_input vbox align_items_stretch">';
        if(i.type === 'text') {
            res_html += '   <input id="param_'+i.path+'" type="text" onkeyup="setMDAttribute(\'' + i.path + '\', this.value)" value="' + getMDAttribute(i.path) + '">';
        }
        if(i.type === 'select') {
            let val = getMDAttribute(i.path);
            res_html += '   <select id="param_'+i.path+'" onchange="setMDAttribute(\'' + i.path + '\', this.value)">';
            res_html += '       <option value=""></option>';
            i.options.forEach(o => {
                res_html += '       <option value="'+o+'" '+(o === val ? 'selected' : '')+'>'+o+'</option>';
            })
            res_html += '   </select>';
        }
        res_html += '   </div>';
        res_html += '</div>';
    })
    elem_interactive_input_params.innerHTML = res_html;


    let inp_or_out = 'Inputs';
    res_html = '<div class="p2">Model Inputs</div>';
    let inp_length = interactive_json_data['Inputs'].length;
    for (let ioidx = 0; ioidx < inp_length; ioidx++) {
        let io = interactive_json_data['Inputs'][ioidx];
        res_html += '<div class="io_box vbox gap4">';
        interactive_input_attributes.forEach(ioa => {
            res_html += '   <div class="hbox io_line gap4 align_items_center">';
            res_html += '       <div class="p4 io_name">'+ioa.name+'</div>';
            res_html += '       <div class="io_value vbox">';
            if(ioa.type === 'text') {
                res_html += '           <input id="inp_'+ioidx+'_param_'+ioa.key+'" type="text" value="' + io[ioa.key] + '" onkeyup="setMDIOAttribute(\''+inp_or_out+'\', '+ioidx+', \'' + ioa.key + '\', this.value)">';
            } else {
                let val = io[ioa.key];
                res_html += '   <select id="inp_'+ioidx+'_param_'+ioa.key+'" onchange="setMDIOAttribute(\''+inp_or_out+'\', '+ioidx+', \'' + ioa.key + '\', this.value)">';
                res_html += '       <option value=""></option>';
                ioa.options.forEach(o => {
                    let oval = o;
                    if(ioa.key === 'Type_ID'){oval = 'mupif.DataID.'+o}
                    res_html += '       <option value="'+oval+'" '+(oval === val ? 'selected' : '')+'>'+o+'</option>';
                })
                res_html += '   </select>';
            }
            res_html += '       </div>';
            res_html += '   </div>';
        })

        res_html += '   <div class="hbox io_line gap4 align_items_center">';
        res_html += '       <div class="p4 io_name"></div>';
        res_html += '       <div class="io_value vbox align_items_flex_end"><button onclick="deleteInput('+ioidx+')">Delete</button></div>';
        res_html += '   </div>';
        res_html += '</div>';
    }
    res_html += '<div class="hbox"><div class="param_section_tab"></div><button onclick="addInput()">+</button></div>';
    elem_interactive_inputs.innerHTML = res_html;

    inp_or_out = 'Outputs';
    res_html = '<div class="p2">Model Outputs</div>';
    let out_length = interactive_json_data['Outputs'].length;
    for (let ioidx = 0; ioidx < out_length; ioidx++) {
        let io = interactive_json_data['Outputs'][ioidx];
        res_html += '<div class="io_box vbox gap4">';
        interactive_output_attributes.forEach(ioa => {
            res_html += '   <div class="hbox io_line gap4 align_items_center">';
            res_html += '       <div class="p4 io_name">'+ioa.name+'</div>';
            res_html += '       <div class="io_value vbox">';
            if(ioa.type === 'text') {
                res_html += '           <input id="out_'+ioidx+'_param_'+ioa.key+'" type="text" value="' + io[ioa.key] + '" onkeyup="setMDIOAttribute(\''+inp_or_out+'\', '+ioidx+', \'' + ioa.key + '\', this.value)">';
            } else {
                let val = io[ioa.key];
                res_html += '   <select id="out_'+ioidx+'_param_'+ioa.key+'" onchange="setMDIOAttribute(\''+inp_or_out+'\', '+ioidx+', \'' + ioa.key + '\', this.value)">';
                res_html += '       <option value=""></option>';
                ioa.options.forEach(o => {
                    let oval = o;
                    if(ioa.key === 'Type_ID'){oval = 'mupif.DataID.'+o}
                    res_html += '       <option value="'+oval+'" '+(oval === val ? 'selected' : '')+'>'+o+'</option>';
                })
                res_html += '   </select>';
            }
            res_html += '       </div>';
            res_html += '   </div>';
        })

        res_html += '   <div class="hbox io_line gap4 align_items_center">';
        res_html += '       <div class="p4 io_name"></div>';
        res_html += '       <div class="io_value vbox align_items_flex_end"><button onclick="deleteOutput('+ioidx+')">Delete</button></div>';
        res_html += '   </div>';
        res_html += '</div>';
    }
    res_html += '<div class="hbox"><div class="param_section_tab"></div><button onclick="addOutput()">+</button></div>';
    elem_interactive_outputs.innerHTML = res_html;

}

function deleteInput(idx){
    let io_data = interactive_json_data['Inputs'];
    io_data.splice(idx, 1);
    interactive_json_data['Inputs'] = io_data;
    saveInteractiveJsonData();
    generateInteractiveInputs();
    highlightRequiredNonEmptyParams();
}

function deleteOutput(idx){
    let io_data = interactive_json_data['Outputs'];
    io_data.splice(idx, 1);
    interactive_json_data['Outputs'] = io_data;
    saveInteractiveJsonData();
    generateInteractiveInputs();
    highlightRequiredNonEmptyParams();
}

function addInput(){
    let io_data = interactive_json_data['Inputs'];
    io_data.push({
        Name: "",
        Type: "mupif.Property",
        ValueType: "Scalar",
        Required: true,
        Type_ID: "",
        Units: "",
        Obj_ID: "",
        Set_at: "timestep",
    });
    interactive_json_data['Inputs'] = io_data;
    saveInteractiveJsonData();
    generateInteractiveInputs();
    highlightRequiredNonEmptyParams();
}

function addOutput(){
    let io_data = interactive_json_data['Outputs'];
    io_data.push({
        Name: "",
        Type: "mupif.Property",
        ValueType: "Scalar",
        Type_ID: "",
        Units: "",
        Obj_ID: "",
    });
    interactive_json_data['Outputs'] = io_data;
    saveInteractiveJsonData();
    generateInteractiveInputs();
    highlightRequiredNonEmptyParams();
}

function loadInteractiveJsonData(){
    if(isValidJson(elem_input.value)){
        interactive_json_data = JSON.parse(elem_input.value);
    }else{
        interactive_json_data = {};
    }
    fixMissingMDItems();
}

function saveInteractiveJsonData(){
    elem_input.value = JSON.stringify(interactive_json_data, null, 4);
}
false
function clearApiImplementation(){
    elem_output.value = '';
    setOutputElemVisibility(false);
}

function setOutputElemVisibility(val){
    // document.getElementById('data_output').style.visibility = val ? 'visible' : 'hidden';
    document.getElementById('download_output').style.visibility = val ? 'visible' : 'hidden';
}

function generateApiImplementation(){
    clearApiImplementation();
    elem_error.innerHTML = '<br>';
    
    if(isValidJson(elem_input.value)){
        let md = JSON.parse(elem_input.value);
        if(checkMetadataFormat(md)){
            elem_output.value = generateCodeFromMetadata(md);
            // textAreaAdjust(elem_output);
            setOutputElemVisibility(true);
        }
    } else {
        elem_error.innerHTML += '<h3>Invalid JSON format of inserted metadata</h3>';
    }
}

function getModuleNameFromMetaData(){
    if(isValidJson(elem_input.value)){
        let md = JSON.parse(elem_input.value);
        if(checkMetadataFormat(md)){
            return md['Execution_settings']['Module'];
        }
    }
    return "undefined"
}

// ====================================================================================================
// Metadata Validation
// ====================================================================================================

function insertEmptyTemplateMetadata(){
    let client = new XMLHttpRequest();
    client.open('GET', './empty_md.json');
    client.onreadystatechange = function() {
        elem_input.value = client.responseText;
        generateApiImplementation();
    }
    client.send();
}

function checkMetadataItem(md, key, obj_name, check_nonempty=false, enum_values=[]){
    if(!(key in md)){
        elem_error.innerHTML += '<div class="p4">' + obj_name + ' is missing key "' + key + '".</div>';
        return false;
    }
    if(check_nonempty && (md[key] === '' || md[key] === null)){
        elem_error.innerHTML += '<div class="p4">' + obj_name + ' item "' + key + '" cannot be empty.</div>';
        return false;
    }
    if(enum_values.length > 0 && !enum_values.includes(md[key])){
        elem_error.innerHTML += '<div class="p4">' + obj_name + ' item "' + key + '" must be chosen from [' + enum_values.map(v => '"'+v+'"').join(', ') + '].</div>';
        return false;
    }
    return true;
}

function checkMetadataInputOrOutput(md, inputOrOutput, num){
    const name = inputOrOutput + ' #' + num;
    let retval = true;
    const keys = inputOrOutput === 'Input' ? ['Name', 'Type_ID', 'Type', 'Required', 'Set_at'] : ['Name', 'Type_ID', 'Type'];
    
    keys.forEach(key => {
        if(!(key in md)){
            elem_error.innerHTML += '<div class="p4">' + name + ' is missing key "' + key + '".</div>';
            retval = false;
        }
    })
    if(retval){
        if(!dataTypes.includes(md['Type'])){
            elem_error.innerHTML += '<div class="p4">"Type" of ' + name + ' must be chosen from [' + dataTypes.map(v => '"'+v+'"').join(', ') + '].</div>';
            retval = false;
        }
        if('Required' in md) {
            if (![true, false].includes(md['Required'])) {
                elem_error.innerHTML += '<div class="p4">"Required" of ' + name + ' must be chosen from [true, false].</div>';
                retval = false;
            }
        }
        if('Set_at' in md) {
            if (!setAtValues.includes(md['Set_at'])) {
                elem_error.innerHTML += '<div class="p4">"Set_at" of ' + name + ' must be chosen from [' + setAtValues.map(v => '"'+v+'"').join(', ') + '].</div>';
                retval = false;
            }
        }
    }
    
    if("Type" in md){
        if(
            md["Type"] === "mupif.Property"
            || md["Type"] === "mupif.String"
            || md["Type"] === "mupif.TemporalProperty"
            || md["Type"] === "mupif.Field"
            || md["Type"] === "mupif.TemporalField"
            || md["Type"] === "mupif.Function"
            || md["Type"] === "mupif.DataList[mupif.Property]"
            || md["Type"] === "mupif.DataList[mupif.String]"
            || md["Type"] === "mupif.DataList[mupif.TemporalProperty]"
            || md["Type"] === "mupif.DataList[mupif.Field]"
            || md["Type"] === "mupif.DataList[mupif.TemporalField]"
            || md["Type"] === "mupif.DataList[mupif.Function]"
        ){
            if(!("ValueType" in md)){
                elem_error.innerHTML += '<div class="p4">' + name + ' is missing key "ValueType".</div>';
                retval = false;
            }else if(!valueTypes.includes(md["ValueType"])){
                elem_error.innerHTML += '<div class="p4">"ValueType" of ' + name + ' must be chosen from [' + valueTypes.map(v => '"'+v+'"').join(', ') + '].</div>';
                retval = false;
            }
        }
    }
    return retval;
}

function checkMetadataSubItem(obj, keys, obj_name, check_nonempty=false, enum_values=[]){
    let retval = true;
    keys.forEach(k => {
        if(!checkMetadataItem(obj, k, obj_name, check_nonempty, enum_values)){retval = false;}
    })
    return retval;
}

function checkMetadataFormat(md){
    let base_keys = [
        'Name',
        'ID',
        'Inputs',
        'Outputs',
        'Execution_settings'
    ]
    let retval = true;
    base_keys.forEach(k => {
        if(!checkMetadataItem(md, k, 'Metadata', true)){retval = false;}
    })
    
    const physics_meta = {
        "Type": ['Electronic', 'Atomistic', 'Molecular', 'Mesoscopic', 'Continuum', 'Other'],
        "Entity": ['Atom', 'Electron', 'Grains', 'Finite volume', 'Other'],
    }
    const physics_keys = Object.keys(physics_meta);
    const solver_meta = {
        "Software": null,
        "Language": null,
        "License": null,
        "Creator": null,
        "Version_date": null,
        "Documentation": null,
        "Estim_time_step_s": null,
        "Estim_comp_time_s": null,
        "Estim_execution_cost_EUR": null,
        "Estim_personnel_cost_EUR": null,
        "Required_expertise": ["None", "User", "Expert"],
        "Accuracy": ["Low", "Medium", "High", "Unknown"],
        "Sensitivity": ["Low", "Medium", "High", "Unknown"],
        "Complexity": ["Low", "Medium", "High", "Unknown"],
        "Robustness": ["Low", "Medium", "High", "Unknown"],
    }
    const solver_keys = Object.keys(solver_meta);
    
    for(let i=0;i<md["Inputs"].length;i++){
        if(!checkMetadataInputOrOutput(md["Inputs"][i], 'Input', i+1)){
            retval = false;
        }
    }
    for(let i=0;i<md["Outputs"].length;i++){
        if(!checkMetadataInputOrOutput(md["Outputs"][i], 'Output', i+1)){
            retval = false;
        }
    }
    if(!checkMetadataSubItem(md["Execution_settings"], ['Type', 'Class', 'Module', 'jobManName'], 'Execution_settings', true)){retval = false;}
    
    if(!checkMetadataSubItem(md["Physics"], physics_keys, 'Physics')){retval = false;}
    physics_keys.forEach(k => {
        if (physics_meta[k] !== null) {
            if(!checkMetadataSubItem(md["Physics"], [k], 'Physics', false, physics_meta[k])){retval = false;}
        }
    })
    
    if(!checkMetadataSubItem(md["Solver"], solver_keys, 'Solver')){retval = false;}
    solver_keys.forEach(k => {
        if (solver_meta[k] !== null) {
            if(!checkMetadataSubItem(md["Solver"], [k], 'Solver', false, solver_meta[k])){retval = false;}
        }
    })
    
    
    return retval;
}

// ====================================================================================================
// Code Generation
// ====================================================================================================

function generateCodeFromMetadata(md){
    function fixTypeForCode(val){
        let parts = val.split('[');
        if(parts.length > 1){return parts[0];}
        return val;
    }

    let md_str = "MD = " + JSON.stringify(md, null, 4);
    md_str = md_str.replaceAll('false', 'False');
    md_str = md_str.replaceAll('true', 'True');
    let md_lines = md_str.split('\n');
    md_lines = push_indents_before_each_line(md_lines, 2);

    let inputs = md['Inputs'];
    let outputs = md['Outputs'];
    let obj_id;

    let code = [];
    code.push("import mupif");
    code.push("import Pyro5");
    code.push("import logging");
    code.push("import argparse");
    code.push("import os");
    code.push("");
    code.push("log = logging.getLogger()");
    code.push("# os.environ['MUPIF_NS'] = '172.0.0.1:10000'");
    code.push("");

    code.push("@Pyro5.api.expose");
    code.push("class " + md['Execution_settings']['Class'] + "(mupif.Model):");

    code.push("\tdef __init__(self, metadata=None):");
    code.push("\t\t");
    extend_array(code, md_lines);
    code.push("");
    code.push("\t\tsuper().__init__(metadata=MD)");
    code.push("\t\tself.updateMetadata(metadata)");
    code.push("");
    
    // refactor inputs/outputs
    let Inputs = [];
    let Outputs = [];
    let newitem;

    if(inputs.length) {
        inputs.forEach(item => {
            obj_id = null;
            if ('Obj_ID' in item) {
                obj_id = item['Obj_ID'];
            }
            if (obj_id === null || typeof obj_id == 'string') {
                newitem = JSON.parse(JSON.stringify(item));
                Inputs.push(item);
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    newitem = JSON.parse(JSON.stringify(item));
                    newitem['Obj_ID'] = obj_id[ii];
                    Inputs.push(newitem);
                }
            }
        })
    }
    
    if(outputs.length) {
        outputs.forEach(item => {
            obj_id = null;
            if ('Obj_ID' in item) {
                obj_id = item['Obj_ID'];
            }
            if (obj_id === null || typeof obj_id == 'string') {
                newitem = JSON.parse(JSON.stringify(item));
                Outputs.push(newitem);
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    newitem = JSON.parse(JSON.stringify(item));
                    newitem['Obj_ID'] = obj_id[ii];
                    Outputs.push(newitem);
                }
            }
        })
    }
    
    // default values for inputs/outputs
    if(Inputs.length || Outputs.length) {
        Inputs.forEach(item => {
            item['code_name'] = 'self.input_' + item['Name'].replaceAll(' ', '_').replaceAll('-', '_');
            if ('Obj_ID' in item && item['Obj_ID'] && item['Name'] !== item['Obj_ID'])
                item['code_name'] += '_' + item['Obj_ID'].replaceAll(' ', '_').replaceAll('-', '_');
        });
        Outputs.forEach(item => {
            item['code_name'] = 'self.output_' + item['Name'].replaceAll(' ', '_').replaceAll('-', '_');
            if ('Obj_ID' in item && item['Obj_ID'] && item['Name'] !== item['Obj_ID'])
                item['code_name'] += '_' + item['Obj_ID'].replaceAll(' ', '_').replaceAll('-', '_');
        });

        Inputs.forEach(item => {code.push("\t\t" + item['code_name'] + " = None");})
        Outputs.forEach(item => {code.push("\t\t" + item['code_name'] + " = None");})

        code.push("");
    }

    code.push("\tdef initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):");
    code.push("\t\tsuper().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)");
    code.push("");

    code.push("\tdef get(self, objectTypeID, time=None, objectID=\"\"):");
    if(Outputs.length) {
        Outputs.forEach(item => {
            obj_id = null;
            if ('Obj_ID' in item) {
                obj_id = item['Obj_ID'];
            }
            if (obj_id === null) {
                code.push("\t\tif objectTypeID == " + item['Type_ID'] + ":");
                code.push("\t\t\tif " + item['code_name'] + " is None:");
                code.push("\t\t\t\traise ValueError(\"Value not defined\")");
                code.push("\t\t\treturn " + item['code_name']);
            } else if (typeof obj_id == 'string') {
                code.push("\t\tif objectTypeID == " + item['Type_ID'] + " and objectID == \"" + obj_id + "\":");
                code.push("\t\t\tif " + item['code_name'] + " is None:");
                code.push("\t\t\t\traise ValueError(\"Value not defined\")");
                code.push("\t\t\treturn " + item['code_name']);
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    code.push("\t\tif objectTypeID == " + item['Type_ID'] + " and objectID == \"" + obj_id[ii] + "\":");
                    code.push("\t\t\tif " + item['code_name'] + " is None:");
                    code.push("\t\t\t\traise ValueError(\"Value not defined\")");
                    code.push("\t\t\treturn " + item['code_name']);
                }
            }
        })
    } else {
        code.push("\t\tpass");
    }
    code.push("");

    code.push("\tdef set(self, obj, objectID=\"\"):");
    if(Inputs.length) {
        Inputs.forEach(item => {
            obj_id = null;
            if ('Obj_ID' in item) {
                obj_id = item['Obj_ID'];
            }
            if (obj_id === null) {
                code.push("\t\tif obj.isInstance(" + fixTypeForCode(item['Type']) + ") and obj.getDataID() == " + item['Type_ID'] + ":");
                code.push("\t\t\t" + item['code_name'] + " = obj");
            } else if (typeof obj_id == 'string') {
                code.push("\t\tif obj.isInstance(" + fixTypeForCode(item['Type']) + ") and obj.getDataID() == " + item['Type_ID'] + " and objectID == \"" + obj_id + "\":");
                code.push("\t\t\t" + item['code_name'] + " = obj");
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    code.push("\t\tif obj.isInstance(" + fixTypeForCode(item['Type']) + ") and obj.getDataID() == " + item['Type_ID'] + " and objectID == \"" + obj_id[ii] + "\":");
                    code.push("\t\t\t" + item['code_name'] + " = obj");
                }
            }
        })
    } else {
        code.push("\t\tpass");
    }
    code.push("");

    code.push("\tdef getApplicationSignature(self):");
    code.push("\t\treturn \"" + md['Execution_settings']['Class'] + "\"");
    code.push("");

    code.push("\tdef getAPIVersion(self):");
    code.push("\t\treturn 1");
    code.push("");
    
    code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
    let required_inputs = Inputs.filter(inp => inp['Required'] === true);
    if (required_inputs.length) {
        code.push("\t\tfor inp in [" + required_inputs.map(inp => inp['code_name']).join(', ') + "]:");
        code.push("\t\t\tif inp is None:");
        code.push("\t\t\t\traise ValueError(\"A required input was not defined\")");
    }
    
    code.push("\t\t");
    code.push("\t\traise NotImplementedError(\"Not implemented\")");
    code.push("");

    code.push("");
    code.push("if __name__ == '__main__':");

    code.push("\tparser = argparse.ArgumentParser()");
    code.push("\tparser.add_argument('-run_type', '--run_type', required=False, dest=\"run_type\", default=\"modelserver\")");
    code.push("\targs = parser.parse_args()");
    code.push("\trun_type = args.run_type");
    code.push("\tif run_type != \"test_local\" and run_type != \"test_remote\":");
    code.push("\t\trun_type = \"modelserver\"");
    code.push("\t");

    code.push("\tif run_type == \"modelserver\":");
    code.push("\t\timport " + md['Execution_settings']['Module']);
    code.push("\t\tmupif.SimpleJobManager(");
    code.push("\t\t\tns=mupif.pyroutil.connectNameserver(),");
    code.push("\t\t\tappClass=" + md['Execution_settings']['Module'] + "." + md['Execution_settings']['Class'] + ",");
    code.push("\t\t\tappName='" + md['Execution_settings']['jobManName'] + "',");
    code.push("\t\t\tmaxJobs=10,");
    code.push("\t\t\tincludeFiles=[]");
    code.push("\t\t).runServer()");

    code.push("\t");

    code.push("\telif run_type == \"test_local\" or run_type == \"test_remote\":");
    code.push("\t\tlog.setLevel(logging.DEBUG)");
    code.push("\t\tif run_type == \"test_local\":");
    code.push("\t\t\tmodel = " + md['Execution_settings']['Class'] + "()");
    code.push("\t\telse:");
    code.push("\t\t\tns = mupif.pyroutil.connectNameserver()");
    code.push("\t\t\tdaemon = mupif.pyroutil.getDaemon(proxy=ns)");
    code.push("\t\t\tlogUri = str(daemon.register(mupif.pyrolog.PyroLogReceiver()))");
    code.push("\t\t\tmodelserver = mupif.pyroutil.connectModelServer(ns, '" + md['Execution_settings']['jobManName'] + "')");
    code.push("\t\t\tmodel = mupif.pyroutil.allocateApplicationWithJobManager(");
    code.push("\t\t\t\tns=ns,");
    code.push("\t\t\t\tjobMan=modelserver,");
    code.push("\t\t\t\tremoteLogUri=logUri");
    code.push("\t\t\t)");

    code.push("\t\t");
    code.push("\t\tmodel.initialize(metadata={'Execution': {'ID': '', 'Use_case_ID': '', 'Task_ID': ''}})");
    code.push("\t\t");

    let varNumber = 0;
    function getSetFunctionCode(codel_lines, type, dataId, objId, valueType){
        if (type === "mupif.Property") {
            let val = "0.";
            if(valueType === 'Scalar'){val = "0."}
            if(valueType === 'Vector'){val = "[0.]"}
            if(valueType === 'Tensor'){val = "[[0.]]"}
            codel_lines.push("\t\tmodel.set(mupif.ConstantProperty(value=" + val + ", propID=" + dataId + ", valueType=mupif.ValueType." + valueType + ", unit='', time=None), '" + objId + "')");
        } else if (type === "mupif.String") {
            let val = "''";
            if(valueType === 'Scalar'){val = "''"}
            if(valueType === 'Vector'){val = "['']"}
            if(valueType === 'Tensor'){val = "[['']]"}
            codel_lines.push("\t\tmodel.set(mupif.String(value=" + val + ", dataID=" + dataId + ", valueType=mupif.ValueType." + valueType + ", time=None), '" + objId + "')");
        } else if (type === "mupif.PyroFile") {
            varNumber++;
            let varName = `pf${varNumber}`;
            code.push(`\t\t${varName} = mupif.PyroFile(filename='input.txt', mode='rb', dataID=${dataId})`);
            code.push(`\t\tdaemon.register(${varName})`);
            codel_lines.push(`\t\tmodel.set(${varName}, '${objId}')`);
        } else if (type === "mupif.HeavyStruct") {
            varNumber++;
            let varName = `hs${varNumber}`;
            code.push(`\t\t${varName} = mupif.HeavyStruct(h5path='input.h5', mode='readwrite', id=${dataId})`);
            code.push(`\t\tdaemon.register(${varName})`);
            code.push(`\t\t${varName}.exposeData()`);
            codel_lines.push(`\t\tmodel.set(mupif.String(${varName}, '${objId}')`);
        } else {
            codel_lines.push("\t\t# setting input of type " + type + " not implemented");
        }
    }

    let daemonNeeded = false;
    Inputs.forEach(item => {
        if(item['Type'] === 'mupif.HeavyStruct' || item['Type'] === 'mupif.PyroFile'){
            daemonNeeded = true;
        }
    })
    if(daemonNeeded){
        code.push("\t\tns = mupif.pyroutil.connectNameServer()");
        code.push("\t\tdaemon = mupif.pyroutil.getDaemon(ns)");
    }
    Inputs.forEach(item => {
        obj_id = null;
        if ('Obj_ID' in item) {
            obj_id = item['Obj_ID'];
        }
        if (obj_id === null) {
            getSetFunctionCode(code, item['Type'], item['Type_ID'], '', item['ValueType']);
        } else if (typeof obj_id == 'string') {
            getSetFunctionCode(code, item['Type'], item['Type_ID'], obj_id, item['ValueType']);
        } else if (obj_id.constructor.name === "Array") {
            for (let ii = 0; ii < obj_id.length; ii++) {
                getSetFunctionCode(code, item['Type'], item['Type_ID'], obj_id[ii], item['ValueType']);
            }
        }
    })

    code.push("\t\t");

    code.push("\t\tts = mupif.TimeStep(time=0., dt=1., targetTime=1., unit=mupif.U.s, number=1)");
    code.push("\t\tmodel.solveStep(ts)");

    code.push("\t\t");

    Outputs.forEach(item => {
        obj_id = null;
        if ('Obj_ID' in item) {
            obj_id = item['Obj_ID'];
        }
        if (obj_id === null) {
            code.push("\t\toutput = model.get(objectTypeID=" + item['Type_ID'] + ")");//, objectID=''
            code.push("\t\tprint(output)");
        } else if (typeof obj_id == 'string') {
            code.push("\t\toutput = model.get(objectTypeID=" + item['Type_ID'] + ", objectID='" + obj_id + "')");
            code.push("\t\tprint(output)");
        } else if (obj_id.constructor.name === "Array") {
            for (let ii = 0; ii < obj_id.length; ii++) {
                code.push("\t\toutput = model.get(objectTypeID=" + item['Type_ID'] + ", objectID='" + obj_id[ii] + "')");
                code.push("\t\tprint(output)");
            }
        }
    })

    code.push("\t\t");

    code.push("\t\tmodel.terminate()");

    return formatCodeToText(replace_tabs_with_spaces_for_each_line(code));
}

function downloadCode() {
    let code = elem_output.value;
    let filename = getModuleNameFromMetaData() + ".py";
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}