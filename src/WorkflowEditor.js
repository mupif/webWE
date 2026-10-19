class WorkflowEditor{
    /**
     * Number of paste operations of the session; makes the temporary UIDs of pasted blocks unique (see
     * {@link WorkflowEditor#pasteBlocks}).
     * @type {number}
     */
    static paste_counter = 0;

    constructor(){
        this.workflowblock = null;
        this.datalinks = [];

        this.list_of_model_metadata = [];

        this.selected_block = null;
        this.selected_datalink = null;
        this.selected_slot_ext = null;

        this.visual = true;

        /**
         * SVG canvas showing the workflow (see src/view/CanvasView.js), or null when the editor runs headless
         * (visual = false), e.g., in the Node code generator.
         * @type {CanvasView|null}
         */
        this.canvas = null;

        /**
         * Undo / redo history of the project (see src/EditHistory.js), or null when the editor runs headless.
         * @type {EditHistory|null}
         */
        this.history = null;

        /**
         * Top bar of the editor application (see src/view/AppShell.js), or null when the editor runs headless.
         * @type {AppShell|null}
         */
        this.shell = null;

        /**
         * Block palette (see src/view/Palette.js), or null when the editor runs headless.
         * @type {BlockPalette|null}
         */
        this.palette = null;

        /**
         * Inspector panel (see src/view/Inspector.js), or null when the editor runs headless.
         * @type {Inspector|null}
         */
        this.inspector = null;

        /**
         * Code preview tab of the right sidebar (see src/view/CodePreview.js), or null when the editor runs
         * headless.
         * @type {CodePreview|null}
         */
        this.code_preview = null;

        /**
         * Copied block (clipboard record, see {@link WorkflowEditor#copyBlock}), or null.
         * @type {{blocks: Object[], datalinks: Object[]}|null}
         */
        this.clipboard = null;

        /**
         * Callbacks of editor events (see {@link WorkflowEditor#on}), by event name.
         * @type {Object<string, Function[]>}
         */
        this.listeners = {};
    }

    /**
     * Register a callback of an editor event. The events are:
     *
     * - 'change': the project was redrawn after a change (or undo/redo, loading a project);
     * - 'selection': the selected block, data link or external slot changed;
     * - 'history': the undo/redo history changed.
     *
     * @param {string} event
     * @param {Function} callback - called with the editor
     */
    on(event, callback){
        (this.listeners[event] = this.listeners[event] || []).push(callback);
    }

    /**
     * Call the callbacks registered for an event.
     *
     * @param {string} event
     */
    emit(event){
        (this.listeners[event] || []).forEach(callback => callback(this));
    }

    /**
     * Replace the edited project by a new, empty one (with default settings). The undo history starts anew.
     */
    newProject(){
        this.workflowblock = new BlockWorkflow(this, null);
        this.datalinks = [];
        this.selected_block = null;
        this.selected_datalink = null;
        this.selected_slot_ext = null;
        this.generateWorkflowHtml();
    }

    /**
     * Check whether two data slots can be connected by a new data link.
     *
     * The rules are: the slots must exist and differ, one must be an input and the other an output, both
     * must have spare connection capacity (an input accepts a single link), they must belong to different
     * blocks and at most one of them may be an external workflow slot. The function has no side effects,
     * so the graphical view can call it to validate a connection while the user is dragging it.
     *
     * @param {Slot|null} s1
     * @param {Slot|null} s2
     * @returns {{ok: boolean, message: string}} ``ok`` is true when the link can be created; otherwise
     *          ``message`` describes the reason (it is empty when there is nothing worth reporting, e.g.,
     *          when a slot is connected to itself)
     */
    canLinkSlots(s1, s2){
        if(!s1 || !s2 || s1 === s2)
            return {ok: false, message: ''};
        if(s1.inout === s2.inout)
            return {ok: false, message: 'Only input and output dataslot can be connected.<br>(Or input and external input or output and external output)'};
        if(s1.getNumConnections() >= s1.max_connections || s2.getNumConnections() >= s2.max_connections){
            let slot_naming = '';
            if (s1.getNumConnections() === s1.max_connections)
                slot_naming += '<br>(' + s1.name + ')';
            if (s2.getNumConnections() === s2.max_connections)
                slot_naming += '<br>(' + s2.name + ')';
            return {ok: false, message: 'One of the slots can not accept more connections.' + slot_naming};
        }
        if(s1.parent_block === s2.parent_block)
            return {ok: false, message: 'Slots within one block can not be connected.'};
        if(s1.external === true && s2.external === true)
            return {ok: false, message: 'Two external slots can not be connected.'};
        // // none of the slots is external
        // if(s1.obj_type !== s2.obj_type){
        //     myQuery_show_error('The slots must have identical ValueType to be connected.<br>('+s1.obj_type+' X '+s2.obj_type+')');
        //     return null;
        // }
        return {ok: true, message: ''};
    }

    /**
     * Create a data link between two slots when allowed by {@link WorkflowEditor#canLinkSlots}. When the
     * link cannot be created, the reason is logged and, in the visual mode, shown to the user.
     *
     * @param {Slot} s1
     * @param {Slot} s2
     * @returns {Datalink|null} the new data link or null */
    addDatalink(s1, s2){
        let check = this.canLinkSlots(s1, s2);
        if(!check.ok){
            if(check.message !== ''){
                console.log(check.message);
                if(this.visual)
                    myQuery_show_error(check.message);
            }
            return null;
        }
        let dl = new Datalink(s1, s2);
        this.datalinks.push(dl);
        return dl;
    }

    removeDatalink(dl) {
        let temp_datalinks = [];
        for (let i = 0; i < this.datalinks.length; i++)
            if (this.datalinks[i] !== dl)
                temp_datalinks.push(this.datalinks[i]);
        this.datalinks = temp_datalinks;
    }

    getExecutionCode(){
        return formatCodeToText(this.workflowblock.generateCode(false));
    }

    getClassCode(){
        return formatCodeToText(this.workflowblock.generateCode(true));
    }

    getMetadata(){
        return replaceAllInStr(replaceAllInStr(formatCodeToText(this.workflowblock.generateMetadataJson()), 'True', 'true'), 'False', 'false');
    }

    getServerCode(){
        return formatCodeToText(this.workflowblock.generateCodeForServer());
    }

    getJSON(){
        return this.workflowblock.getDictForJSON();
    }

    getBlockByUID(uid){
        if(this.workflowblock.getUID() === uid)
            return this.workflowblock;
        let blocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<blocks.length;i++)
            if(blocks[i].getUID() === uid)
                return blocks[i];
        return null;
    }

    getDatalinkByUID(uid){
        for(let i=0;i<this.datalinks.length;i++)
            if(this.datalinks[i].id === uid)
                return this.datalinks[i];
        return null;
    }

    getSlotByUID(uid){
        let slots = this.workflowblock.getSlotsRecursive();
        for(let i=0;i<slots.length;i++)
            if(slots[i].id === uid)
                return slots[i];
        return null;
    }

    // getSlotByUID(uid){
    //     let slots = this.workflowblock.getSlotsRecursive();
    //     for(let i=0;i<slots.length;i++)
    //         if(slots[i].id === uid)
    //             return slots[i];
    //     return null;
    // }

    addBlockByJsonRecord(json_data){
        let parent_block;
        let new_block = null;
        let slot;
        let slots;

        if(json_data['classname']==='BlockWorkflow'){
            this.workflowblock.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                this.workflowblock.child_block_sort = json_data['child_block_sort'];

            let inout = '';
            for(let i=0;i<json_data['ext_slots'].length;i++){
                slot = json_data['ext_slots'][i];
                if(slot['inout']==='in' || slot['inout']==='out') {
                    if(slot['inout']==='in')
                        inout = 'out';
                    if(slot['inout']==='out')
                        inout = 'in';
                    let new_slot = this.workflowblock.addExternalDataSlot(inout, slot['name'], slot['type'], slot['obj_type'], slot['uid']);
                    // optional canvas position of the external slot terminal
                    if('layout' in slot)
                        new_slot.setLayout(slot['layout']);
                }
            }
        }
        if(json_data['classname']==='BlockConstPhysicalQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPhysicalQuantity(this, parent_block, json_data['value'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockConstProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockProperty(this, parent_block, json_data['value'], json_data['propID'], json_data['valueType'], json_data['units']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockInputFile'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockInputFile(this, parent_block, json_data['filename']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockTimeloop'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockTimeloop(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockAllocateModelAtRuntime'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockAllocateModelAtRuntime(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockRunInBackground'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockRunInBackground(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockDoWhile'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockDoWhile(this, parent_block);
            new_block.code_name = json_data['uid'];
            if('child_block_sort' in json_data)
                new_block.child_block_sort = json_data['child_block_sort'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockModel'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockModel(this, parent_block, json_data['metadata'], json_data['model_working_directory']);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockValueComparison'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockValueComparison(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockPropertyToQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockPropertyToQuantity(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockQuantityToProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockQuantityToProperty(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockNumberToQuantity'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockNumberToQuantity(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockNumberToProperty'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockNumberToProperty(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockDataListLength'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockDataListLength(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockVariable'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockVariable(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockGetItemFromDataList'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockGetItemFromDataList(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }
        if(json_data['classname']==='BlockWaitForBackgroundProcesses'){
            parent_block = this.getBlockByUID(json_data['parent_uid']);
            new_block = new BlockWaitForBackgroundProcesses(this, parent_block);
            new_block.code_name = json_data['uid'];
            parent_block.addBlock(new_block);
        }

        if(new_block != null){
            // optional canvas layout (missing in projects created by older versions of the editor)
            if('layout' in json_data)
                new_block.setLayout(json_data['layout']);

            slots = new_block.getSlots('in');
            for(let i=0;i<slots.length && i<json_data['slot_in_uids'].length;i++)
                slots[i].id = json_data['slot_in_uids'][i];

            slots = new_block.getSlots('out');
            for(let i=0;i<slots.length && i<json_data['slot_out_uids'].length;i++)
                slots[i].id = json_data['slot_out_uids'][i];
        }

    }

    addDatalinkByJsonRecord(json_data){
        let s1 = this.getSlotByUID(json_data['ds1_uid']);
        let s2 = this.getSlotByUID(json_data['ds2_uid']);
        if(s1 != null && s2 != null)
            this.addDatalink(s1, s2);
    }

    /**
     * Replace the edited project by the project described by a JSON record (see BlockWorkflow.getDictForJSON).
     *
     * @param {Object} json_data - project record with the keys 'blocks', 'datalinks' and 'settings'
     */
    loadFromJsonData(json_data){
        this.workflowblock = new BlockWorkflow(this, null);
        // data links and the selection belong to the replaced project
        this.datalinks = [];
        this.selected_block = null;
        this.selected_datalink = null;
        this.selected_slot_ext = null;
        console.log('Constructing project from JSON.');
        if(json_data.constructor === {}.constructor) {
            if('blocks' in json_data && 'datalinks' in json_data && 'settings' in json_data) {
                for (let i = 0; i < json_data['blocks'].length; i++)
                    this.addBlockByJsonRecord(json_data['blocks'][i]);
                for (let i = 0; i < json_data['datalinks'].length; i++)
                    this.addDatalinkByJsonRecord(json_data['datalinks'][i]);
                if('project_name' in json_data['settings'])
                    this.workflowblock.project_name = json_data['settings']['project_name'];
                else
                    console.log('Project name was not in settings.');
                if('project_classname' in json_data['settings'])
                    this.workflowblock.project_classname = json_data['settings']['project_classname'];
                else
                    console.log('Project classname was not in settings.');
                if('project_modulename' in json_data['settings'])
                    this.workflowblock.project_modulename = json_data['settings']['project_modulename'];
                else
                    console.log('Project modulename was not in settings.');
                if('project_id' in json_data['settings'])
                    this.workflowblock.project_id = json_data['settings']['project_id'];
                else
                    console.log('Project ID was not in settings.');
                if('project_nshost' in json_data['settings'])
                    this.workflowblock.project_nshost = json_data['settings']['project_nshost'];
                if('project_nsport' in json_data['settings'])
                    this.workflowblock.project_nsport = json_data['settings']['project_nsport'];
                if('jobman_settings' in json_data['settings']){
                    this.workflowblock.jobman_name = json_data['settings']['jobman_settings']['name'];
                }
                if('connection_type' in json_data['settings'])
                    this.workflowblock.exec_type = json_data['settings']['connection_type'];
                if('script_name_base' in json_data['settings'])
                    this.workflowblock.script_name_base = json_data['settings']['script_name_base'];
            }else{
                console.log('ERROR: The JSON does not contain keys \'blocks\' or/and \'datalinks\' or/and \'settings\'!');
            }
        }else{
            console.log('ERROR: Passed variable must be a dictionary!');
        }
    }

    setProjectName(val){
        this.workflowblock.project_name = val;
    }

    setProjectClassName(val){
        this.workflowblock.project_classname = val;
    }

    setProjectModuleName(val){
        this.workflowblock.project_modulename = val;
    }

    setProjectID(val){
        this.workflowblock.project_id = val;
    }

    setProjectNSHost(val){
        this.workflowblock.project_nshost = val;
    }

    setProjectNSPort(val){
        this.workflowblock.project_nsport = val;
    }
    
    getJobmanName(){
        return this.workflowblock.jobman_name;
    }

    download(filename, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    menu_download_exec_code(){
        let code = this.getExecutionCode();
        if(code !== '')
            this.download(this.workflowblock.project_modulename + ".py", code);
    }

    menu_download_class_code(){
        let code = this.getClassCode();
        if(code !== '')
            this.download(this.workflowblock.project_modulename + ".py", code);
    }

    menu_download_json(){
        let code = this.getJSON();
        this.download("project.json", JSON.stringify(code, null, 4));
    }

    download_ith_metadata(md_id){
        this.download("md.json", JSON.stringify(editor.list_of_model_metadata[md_id]));
    }

    /**
     * Redraw the workflow after a change of the model and record the change in the undo history (no-op when the
     * editor runs headless).
     *
     * @param {Object} [options] - redraw options passed to CanvasView.render (e.g., ``keepView``)
     */
    generateWorkflowHtml(options={}){
        if(this.canvas !== null)
            this.canvas.render(options);
        if(this.history !== null)
            this.history.record();
        this.emit('change');
    }

    /**
     * Undo the last edit of the project (see EditHistory). The selected block stays selected when it still
     * exists.
     *
     * @returns {boolean} true when an edit was undone
     */
    undo(){
        return this.restoreFromHistory(() => this.history.undo());
    }

    /**
     * Redo the last undone edit of the project (see {@link WorkflowEditor#undo}).
     *
     * @returns {boolean} true when an edit was redone
     */
    redo(){
        return this.restoreFromHistory(() => this.history.redo());
    }

    /**
     * Perform an undo or redo step while preserving the selection of a block (by its UID).
     *
     * @param {function(): boolean} step - EditHistory.undo or EditHistory.redo
     * @returns {boolean} true when a state was restored
     */
    restoreFromHistory(step){
        if(this.history === null)
            return false;
        let selected_uid = this.selected_block ? this.selected_block.getUID() : null;
        if(!step())
            return false;
        if(this.canvas !== null){
            let block = selected_uid !== null ? this.getBlockByUID(selected_uid) : null;
            this.canvas.select(block === this.workflowblock ? null : block);
        }
        return true;
    }

    /**
     * Copy a block, with its nested blocks and the data links among them, into a clipboard record. Data links to
     * blocks outside the copied subtree are not copied.
     *
     * @param {Block} block - block to copy (not the workflow)
     * @returns {{blocks: Object[], datalinks: Object[]}} clipboard record (JSON records as in the project file)
     */
    copyBlock(block){
        this.workflowblock.generateAllElementCodeNames();
        let blocks = [block].concat(block.getBlocksRecursive());
        let slots = new Set();
        blocks.forEach(b => b.getSlots().forEach(s => slots.add(s)));
        let datalinks = this.datalinks.filter(dl => slots.has(dl.slot1) && slots.has(dl.slot2));
        return JSON.parse(JSON.stringify({
            blocks: blocks.map(b => b.getDictForJSON()),
            datalinks: datalinks.map(dl => dl.getDictForJSON())
        }));
    }

    /**
     * Insert a copy of the blocks of a clipboard record (see {@link WorkflowEditor#copyBlock}) into a container.
     * The copies get new slot UIDs and new names (code names are regenerated when the workflow is redrawn); the
     * data links among the copied blocks are recreated. The nested blocks keep their arrangement.
     *
     * @param {{blocks: Object[], datalinks: Object[]}} record - clipboard record
     * @param {Block} container - the workflow or a container block receiving the copy (as its last child)
     * @param {BlockLayout|null} [position=null] - position of the copy in the container; null for automatic
     *        placement
     * @returns {Block|null} the copy of the top block, or null when the record is empty
     */
    pasteBlocks(record, container, position=null){
        if(!record || !record.blocks || record.blocks.length === 0 || !container.isContainer())
            return null;
        let records = JSON.parse(JSON.stringify(record.blocks));
        // unique temporary block UIDs (they become the code names until the next redraw)
        let block_uids = new Map();
        let paste_id = ++WorkflowEditor.paste_counter;
        records.forEach((r, i) => block_uids.set(r['uid'], 'pasted_' + paste_id + '_' + i));
        let slot_uids = new Map();
        let remap_slot = uid => {
            if(!slot_uids.has(uid))
                slot_uids.set(uid, generateNewSlotID());
            return slot_uids.get(uid);
        };
        records.forEach((r, i) => {
            r['parent_uid'] = i === 0 ? container.getUID() : block_uids.get(r['parent_uid']);
            r['uid'] = block_uids.get(r['uid']);
            r['slot_in_uids'] = (r['slot_in_uids'] || []).map(remap_slot);
            r['slot_out_uids'] = (r['slot_out_uids'] || []).map(remap_slot);
        });
        if(position !== null)
            records[0]['layout'] = Object.assign({}, records[0]['layout'] || {}, position);
        else
            delete records[0]['layout'];
        records.forEach(r => this.addBlockByJsonRecord(r));
        (record.datalinks || []).forEach(dl => this.addDatalinkByJsonRecord({
            'ds1_uid': slot_uids.get(dl['ds1_uid']), 'ds2_uid': slot_uids.get(dl['ds2_uid'])
        }));
        return this.getBlockByUID(records[0]['uid']);
    }

    /**
     * Copy the selected block into the clipboard (Edit > Copy, Ctrl+C).
     *
     * @returns {boolean} true when a block was copied
     */
    copySelection(){
        let block = this.selected_block;
        if(!block || block === this.workflowblock)
            return false;
        this.clipboard = this.copyBlock(block);
        if(this.visual)
            myQuery_show_note('Copied ' + block.getCodeName() + (block.blocks.length ? ' with its content' : '') + '.');
        return true;
    }

    /**
     * Paste the clipboard (Edit > Paste, Ctrl+V): into the selected container block, otherwise into the container
     * under the center of the canvas at that point (or the workflow when the editor runs headless). The copy is
     * selected and the canvas redrawn.
     *
     * @returns {Block|null} the pasted block
     */
    pasteClipboard(){
        if(this.clipboard === null)
            return null;
        let container = this.workflowblock;
        let position = null;
        if(this.selected_block && this.selected_block.isContainer()){
            container = this.selected_block;
        }else if(this.canvas !== null){
            let rect = this.canvas.el.getBoundingClientRect();
            let target = this.canvas.dropTargetAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
            if(target !== null){
                container = target.container;
                position = {x: target.x, y: target.y};
            }
        }
        let block = this.pasteBlocks(this.clipboard, container, position);
        this.generateWorkflowHtml({keepView: true});
        if(block !== null && this.canvas !== null)
            this.canvas.select(block);
        return block;
    }

    /**
     * Duplicate the selected block next to the original (Edit > Duplicate, Ctrl+D, block context menu); the copy is
     * selected.
     *
     * @returns {Block|null} the copy
     */
    duplicateSelection(){
        let block = this.selected_block;
        if(!block || block === this.workflowblock)
            return null;
        let copy = this.duplicateBlock(block);
        this.generateWorkflowHtml({keepView: true});
        if(copy !== null && this.canvas !== null)
            this.canvas.select(copy);
        return copy;
    }

    /**
     * Duplicate a block (with its nested blocks and the data links among them) next to the original, in the same
     * container.
     *
     * @param {Block} block - block to duplicate (not the workflow)
     * @returns {Block|null} the copy
     */
    duplicateBlock(block){
        let layout = block.getLayout();
        let position = layout !== null ? {x: layout.x + 30, y: layout.y + 30} : null;
        return this.pasteBlocks(this.copyBlock(block), block.getParentBlock(), position);
    }

    getAllBlocks(){
        let blocks = [];
        blocks.push(this.workflowblock);
        let subblocks = this.workflowblock.getBlocksRecursive();
        for(let i=0;i<subblocks.length;i++){
            blocks.push(subblocks[i]);
        }
        return blocks;
    }

    deleteDatalinksLinkedToSlot(slot){
        let dls_to_remove = [];
        for(let j=0;j<this.datalinks.length;j++){
            if(this.datalinks[j].slot1 === slot || this.datalinks[j].slot2 === slot)
                dls_to_remove.push(this.datalinks[j]);
        }

        for(let i=0;i<dls_to_remove.length;i++) {
            this.removeDatalink(dls_to_remove[i]);
        }
    }

    deleteExtSlot(slot){
        this.deleteDatalinksLinkedToSlot(slot);
        this.workflowblock.deleteSlot(slot);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='delete_selected_datalink') {
            if(this.selected_datalink)
                this.removeDatalink(this.selected_datalink);
        }
        if(action==='delete_selected_block') {
            if(this.selected_block)
                this.selected_block.deleteSelf();
        }
        if(action==='delete_selected_ext_slot') {
            if(this.selected_slot_ext)
                this.deleteExtSlot(this.selected_slot_ext);
        }
        myQuery_hide();
        this.generateWorkflowHtml();
    }


}