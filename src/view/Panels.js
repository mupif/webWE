/**
 * Collapsible and resizable side panels of the editor: the block palette (left) and the sidebar with the
 * inspector and the code preview (right).
 *
 * Responsibility
 * --------------
 * ``PanelLayout`` adds to each panel a collapse button (in the panel header), a *rail* shown while the panel is
 * collapsed (a narrow strip with buttons opening the panel again; the sidebar rail opens the inspector or the
 * code tab) and a resize handle on the edge towards the canvas. The open/collapsed state and the widths are
 * remembered by the browser; the sidebar remembers separate widths for the inspector and the code tab. The View
 * menu offers the same commands (``toggle``, ``setOpen``, ``showCanvasOnly``).
 *
 * Model -> view sync
 * ------------------
 * Pure view state. The canvas fills the remaining space by itself (flex layout); the minimap follows the size of
 * the canvas (see Minimap.js).
 */

/** Limits of the panel widths (px). */
const PANEL_MIN_WIDTH = 180;
const PANEL_MAX_WIDTH = 900;

/** Default widths of the panels (px); 'inspector' and 'code' are the widths of the sidebar with that tab. */
const PANEL_DEFAULT_WIDTHS = {palette: 232, inspector: 300, code: 560};

class PanelLayout{
    /**
     * @param {WorkflowEditor} editor - the editor (with its code preview)
     * @param {HTMLElement} palette - the left panel (#app_palette)
     * @param {HTMLElement} sidebar - the right panel (#app_sidebar)
     */
    constructor(editor, palette, sidebar){
        this.editor = editor;
        this.panels = {palette: palette, sidebar: sidebar};
        let stored = this.load();
        /** Open state of the panels. @type {{palette: boolean, sidebar: boolean}} */
        this.open = Object.assign({palette: true, sidebar: true}, stored.open || {});
        /** Widths of the panels (see PANEL_DEFAULT_WIDTHS). @type {Object<string, number>} */
        this.widths = Object.assign({}, PANEL_DEFAULT_WIDTHS, stored.widths || {});

        this.decoratePalette();
        this.decorateSidebar();
        this.apply();
    }

    // ---------- persistence ----------

    /** @returns {Object} the stored state ({open, widths}) or an empty object */
    load(){
        try{
            return JSON.parse(window.localStorage.getItem('mupif_we_panels') || '{}') || {};
        }catch(e){
            return {};
        }
    }

    /** Remember the open state and the widths in the browser. */
    save(){
        try{
            window.localStorage.setItem('mupif_we_panels', JSON.stringify({open: this.open, widths: this.widths}));
        }catch(e){
            // storage not available; the state holds for this session only
        }
    }

    // ---------- controls ----------

    /**
     * @param {string} title - tooltip
     * @param {string} html - content
     * @param {Function} action
     * @param {string} [className]
     * @returns {HTMLButtonElement}
     */
    button(title, html, action, className='panel_collapse'){
        let button = document.createElement('button');
        button.className = className;
        button.title = title;
        button.innerHTML = html;
        button.addEventListener('click', action);
        return button;
    }

    /**
     * Add the resize handle to the edge of a panel.
     *
     * @param {string} name - 'palette' or 'sidebar'
     * @param {string} side - edge with the handle: 'right' (palette) or 'left' (sidebar)
     */
    addResizer(name, side){
        let panel = this.panels[name];
        let handle = document.createElement('div');
        handle.className = 'panel_resizer panel_resizer_' + side;
        handle.title = 'Drag to resize';
        panel.appendChild(handle);
        handle.addEventListener('pointerdown', evt => {
            evt.preventDefault();
            handle.setPointerCapture(evt.pointerId);
            let start_x = evt.clientX;
            let key = this.widthKey(name);
            let start_w = this.widths[key];
            let move = e => {
                let dx = side === 'right' ? e.clientX - start_x : start_x - e.clientX;
                this.widths[key] = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, start_w + dx));
                this.apply(false);
            };
            let up = () => {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
                document.body.classList.remove('panel_resizing');
                this.save();
            };
            document.body.classList.add('panel_resizing');
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
        });
    }

    /**
     * Collapse button in the search row and the rail of the palette.
     */
    decoratePalette(){
        let palette = this.panels.palette;
        palette.querySelector('.palette_search').appendChild(
            this.button('Collapse the block palette', '&laquo;', () => this.setOpen('palette', false)));
        let rail = document.createElement('div');
        rail.className = 'panel_rail';
        rail.appendChild(this.button('Show the block palette', '<span>Blocks</span>', () => this.setOpen('palette', true), 'panel_rail_button'));
        palette.appendChild(rail);
        this.addResizer('palette', 'right');
    }

    /**
     * Collapse button in the tab bar and the rail of the sidebar.
     */
    decorateSidebar(){
        let sidebar = this.panels.sidebar;
        sidebar.querySelector('.sidebar_tabs').appendChild(
            this.button('Collapse the sidebar', '&raquo;', () => this.setOpen('sidebar', false)));
        let rail = document.createElement('div');
        rail.className = 'panel_rail';
        let open_tab = tab => {
            this.setOpen('sidebar', true);
            this.editor.code_preview.showTab(tab);
        };
        rail.appendChild(this.button('Show the inspector', '<span>Inspector</span>', () => open_tab('inspector'), 'panel_rail_button'));
        rail.appendChild(this.button('Show the generated code', '<span>Code</span>', () => open_tab('code'), 'panel_rail_button'));
        sidebar.appendChild(rail);
        this.addResizer('sidebar', 'left');
    }

    // ---------- state ----------

    /**
     * @param {string} name - 'palette' or 'sidebar'
     * @returns {string} key of the current width of the panel in ``widths``
     */
    widthKey(name){
        if(name === 'palette')
            return 'palette';
        return this.panels.sidebar.classList.contains('wide') ? 'code' : 'inspector';
    }

    /**
     * Show the panels according to their state (collapsed panels show their rail).
     *
     * @param {boolean} [notify=true] - let the other views react (code preview, minimap)
     */
    apply(notify=true){
        ['palette', 'sidebar'].forEach(name => {
            let panel = this.panels[name];
            panel.classList.toggle('collapsed', !this.open[name]);
            let width = this.open[name] ? this.widths[this.widthKey(name)] + 'px' : '';
            panel.style.width = width;
            panel.style.flexBasis = width;
        });
        if(notify){
            if(this.editor.code_preview)
                this.editor.code_preview.refresh();
        }
        if(this.editor.canvas)
            this.editor.canvas.minimap.updateViewport();
    }

    /**
     * @param {string} name - 'palette' or 'sidebar'
     * @returns {boolean} true when the panel is open
     */
    isOpen(name){
        return this.open[name];
    }

    /**
     * Open or collapse a panel.
     *
     * @param {string} name - 'palette' or 'sidebar'
     * @param {boolean} open
     */
    setOpen(name, open){
        this.open[name] = open;
        this.save();
        this.apply();
    }

    /**
     * Toggle a panel.
     *
     * @param {string} name - 'palette' or 'sidebar'
     */
    toggle(name){
        this.setOpen(name, !this.open[name]);
    }

    /**
     * Collapse both panels (canvas only), or open both when they are both collapsed.
     */
    showCanvasOnly(){
        let open = !this.open.palette && !this.open.sidebar;
        this.open.palette = open;
        this.open.sidebar = open;
        this.save();
        this.apply();
    }
}
