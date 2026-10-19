/**
 * Undo / redo of project edits (headless; created by main() for the graphical editor).
 *
 * The history stores *snapshots* of the whole project in its JSON form (``WorkflowEditor.getJSON``), which is a
 * complete and lossless description of everything the user can edit: blocks with their parameters, nesting and
 * execution order, data links, external slots, project settings and the canvas layout. Undo and redo restore a
 * snapshot with ``WorkflowEditor.loadFromJsonData``.
 *
 * Every edit of the project ends with ``WorkflowEditor.generateWorkflowHtml()`` (canvas actions, context menus,
 * dialogs, keyboard commands, the Settings page), which calls ``record()`` after redrawing. A snapshot is stored
 * only when the project differs from the current state, so edit actions need no knowledge of the history, and
 * re-renders without a change (e.g., toggling the flow arrows) create no step. Recording after the redraw also
 * includes the positions assigned by the automatic layout (e.g., to a newly added block) in the same step.
 *
 * Not part of the history: view state (zoom, pan, selection, flow arrow toggle) and the list of loaded model
 * metadata, which do not belong to the project. Loading another project starts a new history.
 */
class EditHistory{
    /**
     * @param {WorkflowEditor} editor - the edited project
     * @param {number} [limit=100] - maximal number of stored states (the oldest ones are dropped)
     */
    constructor(editor, limit=100){
        this.editor = editor;
        this.limit = limit;
        /** Project snapshots (JSON strings), oldest first. @type {string[]} */
        this.states = [];
        /** Index of the snapshot equal to the current project, -1 before the first record. @type {number} */
        this.index = -1;
        /**
         * Workflow block of the project the history belongs to; a different one means that another project was
         * loaded. @type {BlockWorkflow|null}
         */
        this.workflow = null;
        /** True while a snapshot is being restored. @type {boolean} */
        this.restoring = false;
        /** Called after every change of the history (e.g., to update undo/redo buttons). @type {Function|null} */
        this.onChange = null;
    }

    /**
     * @returns {string} snapshot of the current project
     */
    snapshot(){
        return JSON.stringify(this.editor.getJSON());
    }

    /**
     * Forget all steps; the current project becomes the only state.
     */
    reset(){
        this.workflow = this.editor.workflowblock;
        this.states = [this.snapshot()];
        this.index = 0;
        this.notify();
    }

    /**
     * Store the current project as a new step when it differs from the current state. A newly loaded project
     * resets the history. New steps discard the states which could be redone.
     *
     * @returns {boolean} true when a new step was stored
     */
    record(){
        if(this.restoring)
            return false;
        if(this.editor.workflowblock !== this.workflow || this.index < 0){
            this.reset();
            return false;
        }
        let state = this.snapshot();
        if(state === this.states[this.index])
            return false;
        this.states.splice(this.index + 1);
        this.states.push(state);
        if(this.states.length > this.limit)
            this.states.splice(0, this.states.length - this.limit);
        this.index = this.states.length - 1;
        this.notify();
        return true;
    }

    /** @returns {boolean} true when there is a step to undo */
    canUndo(){
        return this.index > 0;
    }

    /** @returns {boolean} true when there is an undone step to redo */
    canRedo(){
        return this.index >= 0 && this.index < this.states.length - 1;
    }

    /**
     * Return the project to the state before the last step.
     *
     * @returns {boolean} true when a state was restored
     */
    undo(){
        if(!this.canUndo())
            return false;
        this.index--;
        this.restore(this.states[this.index]);
        return true;
    }

    /**
     * Repeat the last undone step.
     *
     * @returns {boolean} true when a state was restored
     */
    redo(){
        if(!this.canRedo())
            return false;
        this.index++;
        this.restore(this.states[this.index]);
        return true;
    }

    /**
     * Load a snapshot into the editor and redraw it (keeping the zoom and pan of the canvas). The redraw does not
     * record a new step.
     *
     * @param {string} state - project snapshot
     */
    restore(state){
        this.restoring = true;
        try{
            this.editor.loadFromJsonData(JSON.parse(state));
            this.workflow = this.editor.workflowblock;
            this.editor.generateWorkflowHtml({keepView: true});
        }finally{
            this.restoring = false;
        }
        this.notify();
    }

    /** Call the ``onChange`` callback. */
    notify(){
        if(this.onChange)
            this.onChange(this);
    }
}
