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

/**
 * Show a non-blocking notification (toast) in the bottom-right corner of the window. It disappears after a
 * while or when clicked; the work in the editor is not interrupted.
 *
 * @param {string} html - message (HTML)
 * @param {string} [kind='info'] - 'info' or 'error' (color and duration)
 * @returns {HTMLElement} the notification element
 */
function showToast(html, kind='info'){
    let container = document.getElementById('toast_container');
    if(container === null){
        container = document.createElement('div');
        container.id = 'toast_container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    let toast = document.createElement('div');
    toast.className = 'toast toast_' + kind;
    toast.innerHTML = '<span class="toast_icon">' + (kind === 'error' ? '!' : 'i') + '</span><div class="toast_text">' + html + '</div>';
    toast.title = 'Click to close';
    let close = () => {
        toast.classList.add('toast_hiding');
        setTimeout(() => toast.remove(), 200);
    };
    toast.addEventListener('click', close);
    setTimeout(close, kind === 'error' ? 7000 : 4000);
    container.appendChild(toast);
    // at most four notifications at a time
    while(container.children.length > 4)
        container.firstChild.remove();
    return toast;
}

/**
 * Show an information message (a notification, see showToast).
 *
 * @param {string} text - message (HTML)
 */
function myQuery_show_note(text){
    showToast(text, 'info');
}

/**
 * Show an error message (a notification, see showToast); e.g., an invalid data link or why code cannot be
 * generated.
 *
 * @param {string} text - message (HTML)
 */
function myQuery_show_error(text){
    showToast(text, 'error');
}