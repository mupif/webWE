/**
 * Light and dark theme of the editor.
 *
 * Responsibility
 * --------------
 * ``ThemeManager`` applies the theme chosen in the View menu: 'light', 'dark' or 'system' (following the
 * operating system setting, also when it changes). The choice is remembered by the browser.
 *
 * The theme is applied by setting ``data-theme`` on the ``<html>`` element, which switches the CSS color
 * variables of the application (StyleApp.css), and by ``CanvasView.applyTheme``, which switches the colors drawn
 * on the canvas (CANVAS_THEMES in Shapes.js) and redraws it.
 */

/** Local storage key of the theme preference. @type {string} */
const THEME_STORAGE_KEY = 'mupif_we_theme';

class ThemeManager{
    /**
     * @param {WorkflowEditor} editor - the editor (with its canvas)
     */
    constructor(editor){
        this.editor = editor;
        /** 'light', 'dark' or 'system'. @type {string} */
        this.preference = 'system';
        try{
            this.preference = window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
        }catch(e){
            // storage not available; the default is used
        }
        this.media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        if(this.media)
            this.media.addEventListener('change', () => {
                if(this.preference === 'system')
                    this.apply();
            });
        this.apply();
    }

    /**
     * @returns {string} the theme in effect: 'light' or 'dark'
     */
    current(){
        if(this.preference === 'system')
            return this.media && this.media.matches ? 'dark' : 'light';
        return this.preference === 'dark' ? 'dark' : 'light';
    }

    /**
     * Choose and remember the theme.
     *
     * @param {string} preference - 'light', 'dark' or 'system'
     */
    setPreference(preference){
        this.preference = preference;
        try{
            window.localStorage.setItem(THEME_STORAGE_KEY, preference);
        }catch(e){
            // storage not available; the choice holds for this session only
        }
        this.apply();
    }

    /**
     * Apply the theme in effect to the page and the canvas.
     */
    apply(){
        let theme = this.current();
        document.documentElement.dataset.theme = theme;
        if(this.editor.canvas)
            this.editor.canvas.applyTheme(theme);
    }
}
