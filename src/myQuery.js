let myquery_temp_instance = null;

function myQuery_show(html_content='', type='query'){
    let elem_container = document.getElementById('myQuery_container');
    let elem_curtain = document.getElementById('myQuery_curtain');
    let elem_input = document.getElementById('myQuery_input');

    elem_container.style.display = 'block';
    elem_input.innerHTML = html_content;
    elem_input.onclick = null;
    if(type === 'note')
        elem_input.onclick = myQuery_hide;
}
function myQuery_hide(){
    let elem_container = document.getElementById('myQuery_container');
    let elem_curtain = document.getElementById('myQuery_curtain');
    let elem_input = document.getElementById('myQuery_input');

    elem_container.style.display = 'none';
    elem_input.innerHTML = '';
    myquery_temp_instance = null;
}

function myQuery_show_note(text){
    let html = '<p style="color:black;">' + text + '</p>';
    html += '';
    myQuery_show(html, 'note');
}

function myQuery_show_error(text){
    let html = '<p style="color:red;">' + text + '</p>';
    html += '';
    myQuery_show(html, 'note');
}