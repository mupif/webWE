function replaceAllInStr(val, search, replace){
    return val.split(search).join(replace);
}

function generate_indents(n){
    let t = "";
    for(let i=0;i<n;i++)
        t += "\t";
    return t;
}

function push_indents_before_each_line(code_lines, indent){
    let new_code_lines = [];
    for(let i=0;i<code_lines.length;i++)
        new_code_lines.push(generate_indents(indent) + code_lines[i]);
    return new_code_lines
}

function replace_tabs_with_spaces_for_each_line(code_lines){
    let new_code_lines = [];
    for(let i=0;i<code_lines.length;i++)
        new_code_lines.push(replaceAllInStr(code_lines[i], "\t", "    "));
    return new_code_lines
}

function formatCodeToText(code){
    let text_code = "";
    for(let i=0;i<code.length;i++)
        text_code += code[i] + "\n";
    return text_code
}

function extend_array(arr, add){
    for(let i=0;i<add.length;i++)
        arr.push(add[i]);
}

function floatToStr(val){
    let val_str = val.toString();
    if(!val_str.includes('.'))
        val_str += '.0';
    return val_str;
}

function getTextValueFromUser(message, def_val){
    let val = prompt(message, def_val);
    if (val == null || val === "") {
        return null;
    }
    return val;
}