/**
 * Top bar of the editor application: menus, project name and undo/redo buttons.
 *
 * Responsibility
 * --------------
 * ``AppShell`` builds the top bar inside ``#app_topbar`` from the menu definition ``APP_MENUS`` and runs the
 * chosen actions (``run``). Menus open on click; while one is open, hovering another menu title switches to it;
 * a click outside or Escape closes it. Menu items show their keyboard shortcut and are disabled when their
 * action is not available (e.g., Undo without history).
 *
 * Model -> view sync
 * ------------------
 * The bar holds no project state. It listens to the editor events (``WorkflowEditor.on``): 'change' updates the
 * project name, 'history' and 'selection' update the state of buttons; menu item states are evaluated when a
 * menu opens.
 */

/** Small inline SVG icons (24 x 24 view box, drawn with the current text color). */
const APP_ICONS = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'
};

/**
 * @param {string} name - key of APP_ICONS
 * @returns {string} SVG markup of the icon
 */
function appIcon(name){
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + APP_ICONS[name] + '</svg>';
}

/**
 * Menus of the top bar. An item is ``'-'`` (separator) or an object with the action ``id`` (see
 * ``AppShell.run``), its ``label``, an optional ``shortcut`` (shown only) and the optional predicates
 * ``enabled(shell)`` and ``checked(shell)``.
 */
const APP_MENUS = [
    {label: 'File', items: [
        {id: 'new', label: 'New project'},
        {id: 'open', label: 'Open project…', shortcut: 'Ctrl+O'},
        {id: 'save', label: 'Save project', shortcut: 'Ctrl+S'},
        '-',
        {id: 'export-exec', label: 'Generate execution code'},
        {id: 'export-class', label: 'Generate class code'}
    ]},
    {label: 'Edit', items: [
        {id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', enabled: s => s.editor.history !== null && s.editor.history.canUndo()},
        {id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', enabled: s => s.editor.history !== null && s.editor.history.canRedo()},
        '-',
        {id: 'delete', label: 'Delete selection', shortcut: 'Del',
            enabled: s => !!(s.editor.selected_block || s.editor.selected_datalink || s.editor.selected_slot_ext)},
        '-',
        {id: 'order', label: 'Order by dependencies'}
    ]},
    {label: 'View', items: [
        {id: 'zoom-in', label: 'Zoom in', shortcut: 'Wheel'},
        {id: 'zoom-out', label: 'Zoom out', shortcut: 'Wheel'},
        {id: 'fit', label: 'Fit to window'},
        {id: 'actual-size', label: 'Actual size'},
        '-',
        {id: 'flow', label: 'Execution flow arrows', checked: s => s.editor.canvas.show_flow}
    ]},
    {label: 'Help', items: [
        {id: 'shortcuts', label: 'Keyboard and mouse'},
        {id: 'mupif', label: 'MuPIF website'}
    ]}
];

class AppShell{
    /**
     * @param {WorkflowEditor} editor - the edited project (with its canvas)
     * @param {HTMLElement} el - the top bar element
     */
    constructor(editor, el){
        this.editor = editor;
        this.el = el;
        /** Index of the open menu in APP_MENUS, or -1. @type {number} */
        this.open_menu = -1;
        this.build();

        document.addEventListener('mousedown', evt => {
            if(this.open_menu >= 0 && !this.el.querySelector('.app_menubar').contains(evt.target))
                this.closeMenu();
        });
        document.addEventListener('keydown', evt => this.onKeyDown(evt));
        editor.on('change', () => this.update());
        editor.on('history', () => this.update());
    }

    /**
     * Create the content of the top bar.
     */
    build(){
        let menus = APP_MENUS.map((menu, i) =>
            '<div class="app_menu" data-menu="' + i + '"><button class="app_menu_title">' + menu.label + '</button>' +
            '<div class="app_menu_list"></div></div>').join('');
        this.el.innerHTML =
            '<a class="app_logo" href="http://mupif.org" target="_blank" title="MuPIF"><img src="mupif-logo.png" alt="MuPIF"></a>' +
            '<span class="app_title">Workflow Editor</span>' +
            '<nav class="app_menubar">' + menus + '</nav>' +
            '<span class="app_divider"></span>' +
            '<button class="app_project_name" title="Project settings (shown in the inspector)"></button>' +
            '<span class="app_spacer"></span>' +
            '<button class="app_icon_button" data-action="undo" title="Undo (Ctrl+Z)">' + appIcon('undo') + '</button>' +
            '<button class="app_icon_button" data-action="redo" title="Redo (Ctrl+Y)">' + appIcon('redo') + '</button>';

        this.el.querySelectorAll('.app_menu').forEach(menu_el => {
            let i = parseInt(menu_el.dataset.menu);
            let title = menu_el.querySelector('.app_menu_title');
            title.addEventListener('click', () => this.open_menu === i ? this.closeMenu() : this.openMenu(i));
            title.addEventListener('mouseenter', () => {
                if(this.open_menu >= 0 && this.open_menu !== i)
                    this.openMenu(i);
            });
        });
        this.el.querySelectorAll('[data-action]').forEach(button =>
            button.addEventListener('click', () => this.run(button.dataset.action)));
        this.el.querySelector('.app_project_name').addEventListener('click', () => this.run('settings'));
    }

    /**
     * Open a menu (its items are created now, so their enabled/checked states are current).
     *
     * @param {number} index - index in APP_MENUS
     */
    openMenu(index){
        this.closeMenu();
        let menu_el = this.el.querySelector('.app_menu[data-menu="' + index + '"]');
        let list = menu_el.querySelector('.app_menu_list');
        list.innerHTML = '';
        APP_MENUS[index].items.forEach(item => {
            if(item === '-'){
                list.appendChild(document.createElement('hr'));
                return;
            }
            let button = document.createElement('button');
            button.className = 'app_menu_item';
            let checked = item.checked ? item.checked(this) : null;
            button.innerHTML = '<span class="app_menu_check">' + (checked ? '&#10003;' : '') + '</span>' +
                '<span class="app_menu_label">' + item.label + '</span>' +
                '<span class="app_menu_shortcut">' + (item.shortcut || '') + '</span>';
            button.disabled = item.enabled ? !item.enabled(this) : false;
            button.addEventListener('click', () => {
                this.closeMenu();
                this.run(item.id);
            });
            list.appendChild(button);
        });
        menu_el.classList.add('open');
        this.open_menu = index;
    }

    /**
     * Close the open menu.
     */
    closeMenu(){
        this.el.querySelectorAll('.app_menu.open').forEach(m => m.classList.remove('open'));
        this.open_menu = -1;
    }

    /**
     * Run an action of a menu item or a button.
     *
     * @param {string} id - action identifier
     */
    run(id){
        let editor = this.editor;
        let canvas = editor.canvas;
        let actions = {
            'new': () => confirmNewProject(),
            'open': () => document.getElementById('form_json_file_selector').click(),
            'save': () => editor.menu_download_json(),
            'export-exec': () => editor.menu_download_exec_code(),
            'export-class': () => editor.menu_download_class_code(),
            'undo': () => editor.undo(),
            'redo': () => editor.redo(),
            'delete': () => confirmDeleteSelection(),
            'order': () => canvas.orderByDependencies(),
            'zoom-in': () => canvas.zoom.zoomBy(ZOOM_STEP),
            'zoom-out': () => canvas.zoom.zoomBy(1 / ZOOM_STEP),
            'fit': () => canvas.zoom.fit(),
            'actual-size': () => canvas.zoom.zoomTo(1),
            'flow': () => canvas.setShowFlow(!canvas.show_flow),
            'shortcuts': () => showShortcutHelp(),
            'mupif': () => window.open('http://mupif.org', '_blank'),
            // the inspector shows the project settings when nothing is selected
            'settings': () => canvas.select(null)
        };
        if(id in actions)
            actions[id]();
    }

    /**
     * Shortcuts of the file actions (Ctrl+S, Ctrl+O) and Escape for the menus; undo/redo and the canvas
     * shortcuts are handled by keyPress (Main.js).
     *
     * @param {KeyboardEvent} evt
     */
    onKeyDown(evt){
        if(evt.key === 'Escape' && this.open_menu >= 0){
            this.closeMenu();
            return;
        }
        if((evt.ctrlKey || evt.metaKey) && !evt.altKey && !evt.shiftKey){
            let key = evt.key.toLowerCase();
            if(key === 's' || key === 'o'){
                evt.preventDefault();
                this.run(key === 's' ? 'save' : 'open');
            }
        }
    }

    /**
     * Show the project name and the availability of undo and redo.
     */
    update(){
        this.el.querySelector('.app_project_name').textContent = this.editor.workflowblock.project_name;
        let history = this.editor.history;
        this.el.querySelector('[data-action="undo"]').disabled = !(history && history.canUndo());
        this.el.querySelector('[data-action="redo"]').disabled = !(history && history.canRedo());
    }
}
