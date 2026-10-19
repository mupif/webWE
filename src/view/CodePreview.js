/**
 * Code preview: the "Code" tab of the right sidebar showing the generated Python code.
 *
 * Responsibility
 * --------------
 * ``CodePreview`` owns the tabs of the right sidebar ("Inspector" and "Code"). The code tab shows the code that
 * the File menu would download — execution code, workflow class code or job manager server code — with syntax
 * highlighting and line numbers. The lines mentioning the selected block are highlighted and its execution code
 * is scrolled into view, which connects the diagram to the code. When the code cannot be generated, the reasons are listed
 * (``BlockWorkflow.getCodeGenerationProblems``). The code can be copied or downloaded.
 *
 * Model -> view sync
 * ------------------
 * The code is regenerated from the model after every change of the project and when the selection changes
 * (editor events), but only while the code tab is shown; generation does not modify the project.
 */

/** Python keywords highlighted by highlightPython. */
const PYTHON_KEYWORDS = ['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or',
    'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield'];

/**
 * @param {string} text
 * @returns {string} the text with the HTML special characters escaped
 */
function escapeHtml(text){
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Split Python code into highlighted lines (a small tokenizer recognizing comments, strings, keywords, ``self``,
 * decorators and numbers; enough for the generated code).
 *
 * @param {string} code
 * @returns {string[]} HTML of every line; tokens spanning several lines (e.g., triple-quoted strings) are
 *          closed and reopened at the line ends
 */
function highlightPython(code){
    let re = new RegExp([
        '(#[^\\n]*)',                                                            // 1 comment
        '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')', // 2 string
        '\\b(' + PYTHON_KEYWORDS.join('|') + ')\\b',                             // 3 keyword
        '\\b(self)\\b',                                                          // 4 self
        '(@[\\w.]+)',                                                            // 5 decorator
        '\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b'                             // 6 number
    ].join('|'), 'g');
    let classes = [null, 'py_comment', 'py_string', 'py_keyword', 'py_self', 'py_decorator', 'py_number'];
    let tokens = [];
    let last = 0;
    let m;
    while((m = re.exec(code)) !== null){
        if(m.index > last)
            tokens.push({text: code.slice(last, m.index), cls: null});
        let group = m.findIndex((g, i) => i > 0 && g !== undefined);
        tokens.push({text: m[0], cls: classes[group]});
        last = re.lastIndex;
    }
    tokens.push({text: code.slice(last), cls: null});

    let lines = [''];
    tokens.forEach(token => {
        token.text.split('\n').forEach((part, i) => {
            if(i > 0)
                lines.push('');
            if(part !== '')
                lines[lines.length - 1] += token.cls ? '<span class="' + token.cls + '">' + escapeHtml(part) + '</span>' : escapeHtml(part);
        });
    });
    return lines;
}

/** Kinds of code offered by the preview: value of the selector, label and generator. */
const CODE_KINDS = [
    {value: 'exec', label: 'Execution code', generate: editor => editor.getExecutionCode()},
    {value: 'class', label: 'Workflow class code', generate: editor => editor.getClassCode()},
    {value: 'server', label: 'Job manager server code', generate: editor => editor.getServerCode()}
];

class CodePreview{
    /**
     * @param {WorkflowEditor} editor - the edited project
     * @param {HTMLElement} sidebar - the right sidebar containing the tab bar, the inspector and the code element
     */
    constructor(editor, sidebar){
        this.editor = editor;
        this.sidebar = sidebar;
        this.el = sidebar.querySelector('#app_code');
        /** Kind of the shown code (see CODE_KINDS). @type {string} */
        this.kind = 'exec';
        /** The last generated code (for copying and downloading). @type {string} */
        this.code = '';
        this.build();
        sidebar.querySelectorAll('.sidebar_tabs button').forEach(button =>
            button.addEventListener('click', () => this.showTab(button.dataset.tab)));
        editor.on('change', () => this.refresh());
        editor.on('selection', () => this.refresh());
    }

    /**
     * Create the toolbar and the code area of the tab.
     */
    build(){
        let options = CODE_KINDS.map(k => '<option value="' + k.value + '">' + k.label + '</option>').join('');
        this.el.innerHTML =
            '<div class="code_toolbar"><select class="code_kind" aria-label="Kind of code">' + options + '</select>' +
            '<span class="code_spacer"></span>' +
            '<button class="code_button" data-cmd="copy" title="Copy the code to the clipboard">Copy</button>' +
            '<button class="code_button" data-cmd="download" title="Download the code as a Python file">Download</button></div>' +
            '<div class="code_problems"></div><pre class="code_view"></pre>';
        let select = this.el.querySelector('.code_kind');
        select.addEventListener('change', () => {
            this.kind = select.value;
            this.refresh();
        });
        this.el.querySelector('[data-cmd="copy"]').addEventListener('click', () => this.copy());
        this.el.querySelector('[data-cmd="download"]').addEventListener('click', () => {
            if(this.code !== '')
                this.editor.download(this.editor.workflowblock.project_modulename + (this.kind === 'server' ? '_server' : '') + '.py', this.code);
        });
    }

    /**
     * Show a tab of the sidebar.
     *
     * @param {string} tab - 'inspector' or 'code'
     */
    showTab(tab){
        this.sidebar.querySelectorAll('.sidebar_tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        this.sidebar.querySelector('#app_inspector').hidden = tab !== 'inspector';
        this.el.hidden = tab !== 'code';
        // the code needs more room than the inspector
        this.sidebar.classList.toggle('wide', tab === 'code');
        this.refresh();
    }

    /**
     * Regenerate and show the code (only while the code tab is shown).
     */
    refresh(){
        if(this.el.hidden)
            return;
        let problems_el = this.el.querySelector('.code_problems');
        let view = this.el.querySelector('.code_view');
        let problems = this.editor.workflowblock.getCodeGenerationProblems(this.kind);
        problems_el.innerHTML = problems.map(p => '<p>' + escapeHtml(p) + '</p>').join('');
        if(problems.length){
            this.code = '';
            view.innerHTML = '';
            return;
        }
        let kind = CODE_KINDS.find(k => k.value === this.kind);
        this.code = kind.generate(this.editor);
        let block = this.editor.selected_block;
        let mark = block && block !== this.editor.workflowblock ? new RegExp('\\b' + block.getCodeName() + '\\b') : null;
        // scroll to the execution code of the block (marked by a comment), otherwise to its first mention
        let first_marked = null;
        let execution_line = null;
        let execution_mark = block ? 'execution code of ' + block.getCodeName() + ' ' : null;
        let raw_lines = this.code.split('\n');
        view.innerHTML = '';
        highlightPython(this.code).forEach((html, i) => {
            let line = document.createElement('span');
            line.className = 'code_line';
            line.innerHTML = html + '\n';
            line.dataset.line = String(i + 1);
            if(mark !== null && mark.test(raw_lines[i] || '')){
                line.classList.add('marked');
                first_marked = first_marked || line;
                if(execution_line === null && raw_lines[i].indexOf(execution_mark) >= 0)
                    execution_line = line;
            }
            view.appendChild(line);
        });
        if(execution_line || first_marked)
            (execution_line || first_marked).scrollIntoView({block: 'center'});
    }

    /**
     * Copy the shown code to the clipboard.
     */
    copy(){
        if(this.code === '')
            return;
        let done = () => myQuery_show_note('The code was copied to the clipboard.');
        if(navigator.clipboard)
            navigator.clipboard.writeText(this.code).then(done, () => myQuery_show_error('The code could not be copied.'));
    }
}
