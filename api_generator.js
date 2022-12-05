
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

function clearApiImplementation(){
    let elem_output = document.getElementById('data_output');
    elem_output.value = '';
}

function generateApiImplementation(){
    clearApiImplementation();
    let elem_input = document.getElementById('data_input');
    let elem_output = document.getElementById('data_output');

    let elem_json_format_error = document.getElementById('error_json_format');
    let elem_md_validation = document.getElementById('error_md_validation');
    elem_md_validation.style.display = 'none';
    elem_json_format_error.style.display = 'none';
    
    if(isValidJson(elem_input.value)){
        let md = JSON.parse(elem_input.value);

        let validation = checkMetadataFormat(md);
        if(validation){
            elem_output.value = generateCodeFromMetadata(md);
            textAreaAdjust(elem_output);
        } else {
            elem_md_validation.style.display = 'block';
        }
    } else {
        elem_json_format_error.style.display = 'block';
    }
}

function insertEmptyTemplateMetadata(){
    let elem_input = document.getElementById('data_input');
    let client = new XMLHttpRequest();
    client.open('GET', '/empty_md.json');
    client.onreadystatechange = function() {
        elem_input.value = client.responseText;
        generateApiImplementation();
    }
    client.send();
}

function checkMetadataFormat(md){
    // temporary basic validation
    if(!("Name" in md)){return false;}
    if(!("ID" in md)){return false;}
    if(!("Inputs" in md)){return false;}
    if(!("Outputs" in md)){return false;}
    if(!("Execution_settings" in md)){return false;}
    for(let i=0;i<md["Inputs"].length;i++){
        if(!("Name" in md["Inputs"][i])){return false;}
        if(!("Type_ID" in md["Inputs"][i])){return false;}
        if(!("Type" in md["Inputs"][i])){return false;}
        if(!("Required" in md["Inputs"][i])){return false;}
        if(!("Set_at" in md["Inputs"][i])){return false;}
    }
    for(let i=0;i<md["Outputs"].length;i++){
        if(!("Name" in md["Outputs"][i])){return false;}
        if(!("Type_ID" in md["Outputs"][i])){return false;}
        if(!("Type" in md["Outputs"][i])){return false;}
    }
    
    return true;
}

function generateCodeFromMetadata(md){
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
    code.push("");
    code.push("");

    code.push("@Pyro5.api.expose");
    code.push("class MyModelClassName(mupif.Model):  # todo Update class name");

    code.push("\tdef __init__(self, metadata=None):");
    code.push("\t\t");
    extend_array(code, md_lines);
    code.push("");
    code.push("\t\tsuper().__init__(metadata=MD)");
    code.push("\t\tself.updateMetadata(metadata)");
    code.push("");

    code.push("\tdef initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):");
    code.push("\t\tsuper().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)");
    code.push("");

    code.push("\tdef get(self, objectTypeID, time=None, objectID=\"\"):");
    if(outputs.length) {
        for (let i = 0; i < outputs.length; i++) {
            obj_id = null;
            if ('Obj_ID' in outputs[i]) {
                obj_id = outputs[i]['Obj_ID'];
            }
            if (obj_id === null) {
                code.push("\t\tif objectTypeID == " + outputs[i]['Type_ID'] + ":");
                code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
            } else if (typeof obj_id == 'string') {
                code.push("\t\tif objectTypeID == " + outputs[i]['Type_ID'] + " and objectID == \"" + obj_id + "\":");
                code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    code.push("\t\tif objectTypeID == " + outputs[i]['Type_ID'] + " and objectID == \"" + obj_id[ii] + "\":");
                    code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
                }
            }
        }
    } else {
        code.push("\t\tpass");
    }
    code.push("");

    code.push("\tdef set(self, obj, objectID=\"\"):");
    if(inputs.length) {
        for (let i = 0; i < inputs.length; i++) {
            obj_id = null;
            if ('Obj_ID' in inputs[i]) {
                obj_id = inputs[i]['Obj_ID'];
            }
            if (obj_id === null) {
                code.push("\t\tif obj.isInstance(" + inputs[i]['Type'] + ") and obj.getDataID() == " + inputs[i]['Type_ID'] + ":");
                code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
            } else if (typeof obj_id == 'string') {
                code.push("\t\tif obj.isInstance(" + inputs[i]['Type'] + ") and obj.getDataID() == " + inputs[i]['Type_ID'] + " and objectID == \"" + obj_id + "\":");
                code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
            } else if (obj_id.constructor.name === "Array") {
                for (let ii = 0; ii < obj_id.length; ii++) {
                    code.push("\t\tif obj.isInstance(" + inputs[i]['Type'] + ") and obj.getDataID() == " + inputs[i]['Type_ID'] + " and objectID == \"" + obj_id[ii] + "\":");
                    code.push("\t\t\traise NotImplementedError(\"Not implemented\")");
                }
            }
        }
    } else {
        code.push("\t\tpass");
    }
    code.push("");

    code.push("\tdef solveStep(self, tstep, stageID=0, runInBackground=False):");
    code.push("\t\traise NotImplementedError(\"Not implemented\")  # todo To be implemented..");
    code.push("");

    return formatCodeToText(replace_tabs_with_spaces_for_each_line(code));
}