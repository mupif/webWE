/**
 * Unit tests of copying, pasting and duplicating blocks (WorkflowEditor.copyBlock / pasteBlocks /
 * duplicateBlock).
 *
 * Run: ``node test_clipboard.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

/**
 * @param {WorkflowEditor} ed
 * @returns {string[]} UIDs of all slots of the project
 */
function slotUids(ed){
    return ed.workflowblock.getSlotsRecursive().map(s => s.getUID());
}

t.test('duplicating a model copies its parameters but not its outside links', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let m1 = tl.getBlocks()[0];
    m1.input_file_directory = '/work';
    m1.setLayout({x: 20, y: 110});
    let links = ed.datalinks.length;
    let copy = ed.duplicateBlock(m1);
    t.assert(copy instanceof BlockModel && copy !== m1 && copy.getParentBlock() === tl);
    t.assertEqual(tl.getBlocks().length, 5);
    t.assertEqual(copy.md['ID'], m1.md['ID']);
    t.assertEqual(copy.input_file_directory, '/work');
    t.assertEqual(copy.getLayout(), {x: 50, y: 140}, 'placed next to the original');
    t.assertEqual(ed.datalinks.length, links, 'links to other blocks are not copied');
    let uids = slotUids(ed);
    t.assertEqual(new Set(uids).size, uids.length, 'slot UIDs are unique');
});

t.test('duplicating a container copies its content and internal links', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let tl = wf.getBlocks(BlockTimeloop)[0];
    let blocks = wf.getBlocksRecursive().length;
    let links = ed.datalinks.length;
    let copy = ed.duplicateBlock(tl);
    t.assertEqual(wf.getBlocksRecursive().length, blocks + 5, 'Timeloop and its 4 models');
    t.assertEqual(copy.getBlocks().length, 4);
    // model_1 -> model_2, model_1 -> model_3, model_2 -> model_4 are internal; inputs from constants are not
    t.assertEqual(ed.datalinks.length, links + 3);
    let copied = copy.getBlocks();
    t.assert(copied[1].getSlots('in')[0].getLinkedDataSlot().getParentBlock() === copied[0], 'link between the copies');
    wf.generateAllElementCodeNames();
    t.assertEqual(copy.getCodeName(), 'timeloop_2', 'names regenerated');
    t.assertEqual(copied.map(b => b.getCodeName()), ['model_5', 'model_6', 'model_7', 'model_8']);
});

t.test('pasting into another container and saving the result', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let tl = wf.getBlocks(BlockTimeloop)[0];
    let record = ed.copyBlock(wf.getBlocks(BlockProperty)[0]);
    let pasted = ed.pasteBlocks(record, tl, {x: 400, y: 400});
    t.assert(pasted instanceof BlockProperty && pasted.getParentBlock() === tl);
    t.assertEqual(pasted.value, '10.0');
    t.assertEqual(pasted.getLayout(), {x: 400, y: 400});
    let auto = ed.pasteBlocks(record, wf);
    t.assertEqual(auto.getLayout(), null, 'automatic placement without a position');
    t.assertEqual(ed.pasteBlocks(record, pasted), null, 'only containers accept pasted blocks');
    // the edited project saves and loads unchanged
    let json = JSON.stringify(ed.getJSON());
    let ed2 = t.createEditor();
    ed2.loadFromJsonData(JSON.parse(json));
    t.assertEqual(JSON.stringify(ed2.getJSON()), json);
    t.assert(ed.getExecutionCode().includes('constant_property_3'), 'code is generated for the copies');
});

t.test('the clipboard record is independent of later edits', () => {
    let ed = t.createEditor(1);
    let prop = ed.workflowblock.getBlocks(BlockProperty)[0];
    let record = ed.copyBlock(prop);
    prop.setParameter('value', '99');
    t.assertEqual(ed.pasteBlocks(record, ed.workflowblock).value, '10.0');
});

t.finish();
