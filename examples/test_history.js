/**
 * Unit tests of the undo / redo history (src/EditHistory.js).
 *
 * The history is attached explicitly to a headless editor and ``record()`` is called after every edit, as
 * ``WorkflowEditor.generateWorkflowHtml`` does in the graphical editor.
 *
 * Run: ``node test_history.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

/**
 * @param {number|null} example - example project to load
 * @param {number} [limit]
 * @returns {{ed: WorkflowEditor, h: EditHistory}} editor with a history whose baseline is the loaded project
 */
function setup(example=1, limit=100){
    let ed = t.createEditor(example);
    let h = new EditHistory(ed, limit);
    h.record();
    return {ed, h};
}

/**
 * @param {WorkflowEditor} ed
 * @returns {string} JSON of the project
 */
function json(ed){
    return JSON.stringify(ed.getJSON());
}

/**
 * @param {WorkflowEditor} ed
 * @returns {BlockProperty} first Property block of the project
 */
function firstProperty(ed){
    return ed.workflowblock.getBlocks(BlockProperty)[0];
}

t.test('the first record sets the baseline', () => {
    let {h} = setup();
    t.assertEqual([h.states.length, h.index, h.canUndo(), h.canRedo()], [1, 0, false, false]);
});

t.test('undo and redo of a parameter change', () => {
    let {ed, h} = setup();
    let before = json(ed);
    firstProperty(ed).value = '42.0';
    t.assert(h.record(), 'step stored');
    let after = json(ed);
    t.assert(h.undo());
    t.assertEqual(json(ed), before);
    t.assertEqual(firstProperty(ed).value, '10.0', 'restored value');
    t.assert(h.redo());
    t.assertEqual(json(ed), after);
    t.assertEqual(firstProperty(ed).value, '42.0');
});

t.test('undo of an added block, a move and deleted links', () => {
    let {ed, h} = setup();
    let s0 = json(ed);
    ed.workflowblock.addBlockByName('variable');
    h.record();
    let s1 = json(ed);
    ed.workflowblock.getBlocks()[0].setLayout({x: 300, y: 40});
    h.record();
    let s2 = json(ed);
    let n = ed.datalinks.length;
    ed.removeDatalink(ed.datalinks[0]);
    ed.removeDatalink(ed.datalinks[0]);
    h.record();
    t.assertEqual(ed.datalinks.length, n - 2);
    h.undo();
    t.assertEqual(json(ed), s2);
    t.assertEqual(ed.datalinks.length, n, 'links are back');
    h.undo();
    t.assertEqual(json(ed), s1);
    t.assertEqual(ed.workflowblock.getBlocks()[0].getLayout(), null, 'position is undone');
    h.undo();
    t.assertEqual(json(ed), s0);
    t.assertEqual(ed.workflowblock.getBlocks(BlockVariable).length, 0, 'added block is removed');
    t.assert(!h.undo(), 'nothing more to undo');
});

t.test('a new edit discards the redo states', () => {
    let {ed, h} = setup();
    firstProperty(ed).value = '1.0';
    h.record();
    firstProperty(ed).value = '2.0';
    h.record();
    h.undo();
    t.assert(h.canRedo());
    firstProperty(ed).value = '3.0';
    h.record();
    t.assert(!h.canRedo(), 'redo tail dropped');
    t.assertEqual(h.states.length, 3);
    h.undo();
    t.assertEqual(firstProperty(ed).value, '1.0');
});

t.test('unchanged projects create no step', () => {
    let {ed, h} = setup();
    t.assert(!h.record());
    ed.workflowblock.generateAllElementCodeNames();
    t.assert(!h.record(), 'regenerated code names are no change');
    t.assertEqual(h.states.length, 1);
});

t.test('the oldest states are dropped above the limit', () => {
    let {ed, h} = setup(1, 3);
    for(let i = 1; i <= 5; i++){
        firstProperty(ed).value = String(i);
        h.record();
    }
    t.assertEqual(h.states.length, 3);
    h.undo();
    h.undo();
    t.assert(!h.canUndo());
    t.assertEqual(firstProperty(ed).value, '3', 'oldest kept state');
});

t.test('loading another project resets the history', () => {
    let {ed, h} = setup();
    firstProperty(ed).value = '7.0';
    h.record();
    ed.loadFromJsonData(t.loadExampleJson(2));
    t.assert(!h.record(), 'baseline, not a step');
    t.assertEqual([h.states.length, h.canUndo()], [1, false]);
});

t.test('restoring a state records no step and keeps the redo states', () => {
    let {ed, h} = setup();
    firstProperty(ed).value = '7.0';
    h.record();
    h.undo();
    t.assert(!h.record(), 'restored project equals the current state');
    t.assertEqual([h.states.length, h.index], [2, 0]);
    t.assert(h.canRedo());
});

t.test('generated code after undo equals the code before the edit', () => {
    let {ed, h} = setup();
    let code = ed.getExecutionCode();
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    orderChildrenByDependencies(tl, ed);
    tl.getBlocks()[0].moveMeDown();
    tl.getBlocks()[3].moveToContainer(ed.workflowblock);
    h.record();
    t.assert(ed.getExecutionCode() !== code, 'the edit changed the code');
    h.undo();
    t.assertEqual(ed.getExecutionCode(), code);
});

t.test('onChange is called on every change of the history', () => {
    let {ed, h} = setup();
    let calls = 0;
    h.onChange = () => calls++;
    firstProperty(ed).value = '5.0';
    h.record();
    h.record();
    h.undo();
    h.redo();
    t.assertEqual(calls, 3);
});

t.test('editor events: change after a redraw, history after a step', () => {
    let ed = t.createEditor(1);
    let events = [];
    ed.history = new EditHistory(ed);
    ed.history.onChange = () => ed.emit('history');
    ed.on('change', () => events.push('change'));
    ed.on('history', () => events.push('history'));
    ed.generateWorkflowHtml();   // baseline
    firstProperty(ed).value = '9.0';
    ed.generateWorkflowHtml();   // step
    ed.generateWorkflowHtml();   // no change
    t.assertEqual(events, ['history', 'change', 'history', 'change', 'change']);
});

t.test('a new project is empty and starts a new history', () => {
    let ed = t.createEditor(1);
    ed.history = new EditHistory(ed);
    ed.generateWorkflowHtml();
    firstProperty(ed).value = '9.0';
    ed.generateWorkflowHtml();
    ed.selected_block = ed.workflowblock.getBlocks()[0];
    ed.newProject();
    t.assertEqual([ed.workflowblock.getBlocksRecursive().length, ed.datalinks.length, ed.selected_block], [0, 0, null]);
    t.assertEqual(ed.workflowblock.project_name, 'My unnamed project');
    t.assert(!ed.history.canUndo(), 'history reset');
});

t.finish();
