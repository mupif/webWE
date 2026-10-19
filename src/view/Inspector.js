/**
 * Inspector: the right panel of the editor showing and editing the selected object.
 *
 * Responsibility
 * --------------
 * ``Inspector`` shows a form for the current selection (``editor.selected_*``):
 *
 * - nothing selected: the project settings and the external inputs/outputs of the workflow (rename, add,
 *   delete);
 * - a block: its kind, name and execution label, the execution order problems it is involved in, its parameters
 *   (``Block.getParameters``), its input and output slots with their connections, and actions (execute
 *   earlier/later, arrange children, delete);
 * - a data link: its source and target slots, data type and units;
 * - an external slot: its name and links.
 *
 * Parameters are applied when a field is committed (Enter or leaving a text field, choosing an option) through
 * ``setParameter``; a rejected value is marked and explained at the field.
 *
 * Model -> view sync
 * ------------------
 * The panel holds no state of its own: it is rebuilt from the model after every change of the project or of the
 * selection (editor events 'change' and 'selection'). Rebuilding is deferred to the next event loop turn and
 * keeps the keyboard focus on the same field, so that Tab moves between fields as usual. Changes made here end
 * with ``WorkflowEditor.generateWorkflowHtml()``, which redraws the canvas and records the undo step.
 */
class Inspector{
    /**
     * @param {WorkflowEditor} editor - the edited project (with its canvas)
     * @param {HTMLElement} el - the panel element
     */
    constructor(editor, el){
        this.editor = editor;
        this.el = el;
        /** Pending deferred rebuild (see ``refresh``). @type {number|null} */
        this.pending = null;
        editor.on('change', () => this.refresh());
        editor.on('selection', () => this.refresh());
        this.render();
    }

    /**
     * Rebuild the panel in the next event loop turn (several requests are merged).
     */
    refresh(){
        if(this.pending === null)
            this.pending = setTimeout(() => {
                this.pending = null;
                this.render();
            }, 0);
    }

    /**
     * Rebuild the panel for the current selection, keeping the focus on the same field.
     */
    render(){
        let focused = document.activeElement && this.el.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
        let ed = this.editor;
        this.el.innerHTML = '';
        if(ed.selected_block && ed.selected_block !== ed.workflowblock)
            this.renderBlock(ed.selected_block);
        else if(ed.selected_datalink)
            this.renderDatalink(ed.selected_datalink);
        else if(ed.selected_slot_ext)
            this.renderExtSlot(ed.selected_slot_ext);
        else
            this.renderProject();
        if(focused){
            let field = this.el.querySelector('[data-focus-key="' + focused + '"]');
            if(field)
                field.focus();
        }
    }

    // ---------- building blocks of the panel ----------

    /**
     * @param {string} tag
     * @param {string} [className]
     * @param {string} [text]
     * @returns {HTMLElement} a new element (not inserted)
     */
    element(tag, className='', text=''){
        let el = document.createElement(tag);
        if(className)
            el.className = className;
        if(text)
            el.textContent = text;
        return el;
    }

    /**
     * Append a section with a heading to the panel.
     *
     * @param {string} title
     * @returns {HTMLElement} the section element
     */
    section(title){
        let section = this.element('section', 'inspector_section');
        section.appendChild(this.element('h3', '', title));
        this.el.appendChild(section);
        return section;
    }

    /**
     * Append the header of the panel: color swatch, title, subtitle and an optional execution label.
     *
     * @param {string} color - swatch color (CSS)
     * @param {string} title
     * @param {string} subtitle
     * @param {string} [label] - execution label shown as a badge
     */
    header(color, title, subtitle, label=''){
        let header = this.element('div', 'inspector_header');
        let swatch = this.element('span', 'inspector_swatch');
        swatch.style.background = color;
        header.appendChild(swatch);
        let names = this.element('div', 'inspector_names');
        names.appendChild(this.element('div', 'inspector_title', title));
        names.appendChild(this.element('div', 'inspector_subtitle', subtitle));
        header.appendChild(names);
        if(label){
            let badge = this.element('span', 'inspector_badge', label);
            badge.title = 'Execution order';
            header.appendChild(badge);
        }
        this.el.appendChild(header);
    }

    /**
     * Append a form for editable parameters to a section.
     *
     * @param {HTMLElement} section
     * @param {Object} owner - block, workflow or external slot providing ``getParameters``/``setParameter``
     * @param {string} focus_prefix - prefix of the focus keys of the fields (unique within the panel)
     */
    form(section, owner, focus_prefix){
        owner.getParameters().forEach(param => {
            let row = this.element('label', 'inspector_field');
            row.appendChild(this.element('span', 'inspector_field_label', param.label));
            let input;
            if(param.type === 'select'){
                input = this.element('select');
                param.options.forEach(o => {
                    let option = this.element('option', '', o.label);
                    option.value = o.value;
                    option.selected = o.value === param.value;
                    input.appendChild(option);
                });
            }else{
                input = this.element('input');
                input.type = 'text';
                input.value = param.value;
                input.spellcheck = false;
                input.addEventListener('keydown', evt => {
                    if(evt.key === 'Enter')
                        input.blur();
                    if(evt.key === 'Escape'){
                        input.value = param.value;
                        input.blur();
                    }
                });
            }
            input.dataset.focusKey = focus_prefix + param.key;
            let message = this.element('span', 'inspector_field_error');
            input.addEventListener('change', () => {
                if(input.value === param.value)
                    return;
                if(owner.setParameter(param.key, input.value)){
                    this.editor.generateWorkflowHtml({keepView: true});
                }else{
                    input.classList.add('invalid');
                    message.textContent = 'This value is not accepted.';
                }
            });
            row.appendChild(input);
            row.appendChild(message);
            section.appendChild(row);
        });
    }

    /**
     * Append a button.
     *
     * @param {HTMLElement} parent
     * @param {string} text
     * @param {Function} action
     * @param {Object} [options] - ``title`` (tooltip), ``danger`` (red style), ``disabled``
     * @returns {HTMLButtonElement}
     */
    button(parent, text, action, options={}){
        let button = this.element('button', 'inspector_button' + (options.danger ? ' danger' : ''), text);
        if(options.title)
            button.title = options.title;
        button.disabled = !!options.disabled;
        button.addEventListener('click', action);
        parent.appendChild(button);
        return button;
    }

    /**
     * @param {Slot} slot
     * @returns {string} the slot on the other side of the slot's data link(s), e.g., 'model_1 · temperature'
     */
    linkedText(slot){
        let names = this.editor.datalinks.filter(dl => dl.slot1 === slot || dl.slot2 === slot).map(dl => {
            let other = dl.slot1 === slot ? dl.slot2 : dl.slot1;
            return (other.external ? 'workflow' : other.getParentBlock().getCodeName()) + ' · ' + other.name;
        });
        return names.join(', ');
    }

    /**
     * Append the list of slots to a section.
     *
     * @param {HTMLElement} section
     * @param {Slot[]} slots
     */
    slotList(section, slots){
        if(slots.length === 0){
            section.appendChild(this.element('p', 'inspector_muted', 'none'));
            return;
        }
        let list = this.element('ul', 'inspector_slots');
        slots.forEach(slot => {
            let item = this.element('li');
            let dot = this.element('span', 'inspector_dot');
            dot.style.background = dataTypeColor(slot.getDataType());
            item.appendChild(dot);
            let text = this.element('div', 'inspector_slot_text');
            text.appendChild(this.element('div', 'inspector_slot_name', slot.name));
            let linked = this.linkedText(slot);
            let missing = slot.inout === 'in' && !slot.external && slot.required && linked === '';
            let detail = linked !== '' ? (slot.inout === 'in' ? '← ' : '→ ') + linked :
                (missing ? 'required, not connected' : 'not connected');
            text.appendChild(this.element('div', 'inspector_slot_detail' + (missing ? ' missing' : ''), detail));
            item.appendChild(text);
            item.title = slotTooltip(slot);
            list.appendChild(item);
        });
        section.appendChild(list);
    }

    // ---------- content for the kinds of selection ----------

    /**
     * Project settings and external slots (nothing selected).
     */
    renderProject(){
        let wf = this.editor.workflowblock;
        this.header('#2d3436', 'Project', 'Workflow settings');
        this.form(this.section('Settings'), wf, 'project.');

        [['out', 'External inputs', 'in'], ['in', 'External outputs', 'out']].forEach(([inout, title, add]) => {
            let section = this.section(title);
            let slots = wf.getSlots(inout);
            if(slots.length === 0)
                section.appendChild(this.element('p', 'inspector_muted', 'none'));
            slots.forEach((slot, i) => {
                let row = this.element('div', 'inspector_ext_slot');
                this.form(row, slot, 'ext.' + inout + i + '.');
                this.button(row, '×', () => {
                    this.editor.deleteExtSlot(slot);
                    this.editor.generateWorkflowHtml({keepView: true});
                }, {title: 'Delete the external slot and its links', danger: true});
                section.appendChild(row);
            });
            this.button(section, add === 'in' ? '+ Add input' : '+ Add output',
                () => wf.modificationQuery('add_external_slot', add));
        });

        let hint = this.section('Tip');
        hint.appendChild(this.element('p', 'inspector_muted',
            'Select a block, a data link or an external slot on the canvas to edit it here.'));
    }

    /**
     * A selected block.
     *
     * @param {Block} block
     */
    renderBlock(block){
        let d = describeBlock(block);
        this.header(d.color, d.title, block.getCodeName(), block.getExecutionLabel());

        // problems where the block reads data too early or provides data read too early by another block
        let problems = findOrderViolations(this.editor).filter(v => v.consumer === block || v.producer === block);
        if(problems.length){
            let section = this.section('Execution order');
            problems.forEach(v => section.appendChild(this.element('p', 'inspector_problem ' + v.severity, v.message)));
            this.button(section, 'Order by dependencies', () => this.editor.canvas.orderByDependencies(),
                {title: 'Reorder the blocks so that every block is executed after the blocks it reads data from'});
        }

        if(block.getParameters().length)
            this.form(this.section('Parameters'), block, 'block.');
        this.slotList(this.section('Inputs'), block.getSlots('in'));
        this.slotList(this.section('Outputs'), block.getSlots('out'));

        let actions = this.section('Actions');
        let row = this.element('div', 'inspector_actions');
        if(block.isExecutable()){
            let executed = block.getParentBlock().blocks.filter(b => b.isExecutable());
            let index = executed.indexOf(block);
            this.button(row, '↑ Execute earlier', () => this.moveInOrder(block, -1),
                {disabled: index <= 0, title: 'Move before the previous executed block (↑)'});
            this.button(row, '↓ Execute later', () => this.moveInOrder(block, 1),
                {disabled: index >= executed.length - 1, title: 'Move after the next executed block (↓)'});
        }
        if(block.isContainer() && block.blocks.length){
            let arrange = this.element('select');
            arrange.title = 'Arrange the child blocks on the canvas';
            [['', 'Arrange children…'], ['dataflow', 'By data flow'], ['vertical', 'Vertically'], ['horizontal', 'Horizontally']]
                .forEach(([value, text]) => {
                    let option = this.element('option', '', text);
                    option.value = value;
                    arrange.appendChild(option);
                });
            arrange.addEventListener('change', () => {
                block.arrangeChildren(arrange.value);
                this.editor.generateWorkflowHtml({keepView: true});
            });
            row.appendChild(arrange);
        }
        this.button(row, 'Delete', () => confirmDeleteSelection(), {danger: true, title: 'Delete the block (Del)'});
        actions.appendChild(row);
    }

    /**
     * Move an executable block before the previous or after the next executable sibling (data and helper
     * blocks in between do not matter for the execution order).
     *
     * @param {Block} block
     * @param {number} direction - -1 (earlier) or 1 (later)
     */
    moveInOrder(block, direction){
        let siblings = block.getParentBlock().blocks;
        let executed = siblings.filter(b => b.isExecutable());
        let other = executed[executed.indexOf(block) + direction];
        if(!other)
            return;
        let i = siblings.indexOf(block), j = siblings.indexOf(other);
        siblings[i] = other;
        siblings[j] = block;
        this.editor.generateWorkflowHtml({keepView: true});
    }

    /**
     * A selected data link.
     *
     * @param {Datalink} datalink
     */
    renderDatalink(datalink){
        let dir = getDatalinkDirection(datalink) || {producer: datalink.slot1, consumer: datalink.slot2};
        let type = dir.producer.getDataType();
        this.header(dataTypeColor(type), 'Data link', type);
        let owner = slot => slot.external ? 'workflow (external)' : slot.getParentBlock().getCodeName();
        let section = this.section('Connection');
        [['From', dir.producer], ['To', dir.consumer]].forEach(([label, slot]) => {
            let row = this.element('div', 'inspector_kv');
            row.appendChild(this.element('span', 'inspector_field_label', label));
            row.appendChild(this.element('span', '', owner(slot) + ' · ' + slot.name));
            section.appendChild(row);
        });
        let details = this.section('Data');
        [['Type', type], ['DataID', dir.producer.getDataID()], ['Units', dir.producer.getUnits()]].forEach(([label, value]) => {
            let row = this.element('div', 'inspector_kv');
            row.appendChild(this.element('span', 'inspector_field_label', label));
            row.appendChild(this.element('span', '', value || '–'));
            details.appendChild(row);
        });
        let problems = findOrderViolations(this.editor).filter(v => v.datalink === datalink);
        problems.forEach(v => details.appendChild(this.element('p', 'inspector_problem ' + v.severity, v.message)));
        let actions = this.section('Actions');
        this.button(actions, 'Delete', () => confirmDeleteSelection(), {danger: true, title: 'Delete the data link (Del)'});
    }

    /**
     * A selected external slot.
     *
     * @param {SlotExt} slot
     */
    renderExtSlot(slot){
        let provides = slot.inout === 'out';
        this.header(provides ? '#d5f5d0' : '#fde2c8', provides ? 'External input' : 'External output', slot.name);
        this.form(this.section('Parameters'), slot, 'slot.');
        this.slotList(this.section('Links'), [slot]);
        let actions = this.section('Actions');
        this.button(actions, 'Delete', () => confirmDeleteSelection(), {danger: true, title: 'Delete the external slot (Del)'});
    }
}
