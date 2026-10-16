/**
 * Unit tests of the canvas layout model: Block.view_id, Block/SlotExt layout and its JSON round-trip.
 *
 * Run: ``node test_layout_json.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

/**
 * Save the project of an editor, load it into a new editor and save it again.
 *
 * @param {WorkflowEditor} ed
 * @returns {Object[]} [first JSON, second JSON]
 */
function roundTrip(ed){
    let first = ed.getJSON();
    let ed2 = t.createEditor();
    ed2.loadFromJsonData(JSON.parse(JSON.stringify(first)));
    return [first, ed2.getJSON()];
}

t.test('view_id is unique and survives renaming of blocks', () => {
    let ed = t.createEditor(1);
    let blocks = ed.workflowblock.getBlocksRecursive();
    let ids = blocks.map(b => b.view_id);
    t.assertEqual(new Set(ids).size, ids.length, 'view ids are unique');
    let first = blocks[0];
    let id_before = first.view_id;
    let name_before = first.getCodeName();
    first.moveMeDown();
    ed.workflowblock.generateAllElementCodeNames();
    t.assertEqual(first.view_id, id_before, 'view id is immutable');
    t.assert(first.getCodeName() !== name_before || blocks.length === 1, 'code name was regenerated');
});

t.test('projects without layout keep their JSON form', () => {
    let ed = t.createEditor(3);
    let json = ed.getJSON();
    t.assert(json['blocks'].every(b => !('layout' in b)), 'no layout key is written for unplaced blocks');
    t.assert(json['blocks'][0]['ext_slots'].every(s => !('layout' in s)), 'no layout key for unplaced ext slots');
});

t.test('block layout survives a JSON round-trip', () => {
    let ed = t.createEditor(1);
    let blocks = ed.workflowblock.getBlocksRecursive();
    blocks[0].setLayout({x: 10, y: 20, w: 200, h: 120});
    blocks[1].setLayout({x: -5.5, y: 300});
    let [first, second] = roundTrip(ed);
    t.assertEqual(second, first, 'JSON identical after round-trip');
    t.assertEqual(first['blocks'][1]['layout'], {x: 10, y: 20, w: 200, h: 120});
    t.assertEqual(first['blocks'][2]['layout'], {x: -5.5, y: 300});
});

t.test('external slot layout survives a JSON round-trip', () => {
    let ed = t.createEditor(2);
    let ext = ed.workflowblock.getSlots();
    t.assert(ext.length > 0, 'example 2 has external slots');
    ext[0].setLayout({x: 1, y: 2, w: 50, h: 60});
    let [first, second] = roundTrip(ed);
    t.assertEqual(second, first, 'JSON identical after round-trip');
    t.assertEqual(first['blocks'][0]['ext_slots'][0]['layout'], {x: 1, y: 2}, 'size of ext slot is not stored');
});

t.test('invalid layouts are rejected', () => {
    let ed = t.createEditor(1);
    let b = ed.workflowblock.getBlocksRecursive()[0];
    b.setLayout({x: 'a', y: 1});
    t.assertEqual(b.getLayout(), null);
    b.setLayout({x: 1, y: 2, w: -3, h: NaN});
    t.assertEqual(b.getLayout(), {x: 1, y: 2}, 'invalid sizes are dropped');
    b.setLayout(null);
    t.assertEqual(b.getLayout(), null);
});

t.test('layout does not influence generated code', () => {
    let ed = t.createEditor(1);
    let code_before = ed.getExecutionCode();
    ed.workflowblock.getBlocksRecursive().forEach((b, i) => b.setLayout({x: 100 * i, y: 7 * i, w: 90, h: 40}));
    t.assertEqual(ed.getExecutionCode(), code_before);
});

t.test('DoWhile saves the arrangement of its children', () => {
    let ed = t.createEditor();
    ed.workflowblock.addBlockByName('dowhile');
    let dw = ed.workflowblock.getBlocks()[0];
    dw.child_block_sort = 'horizontal';
    let [first, second] = roundTrip(ed);
    t.assertEqual(first['blocks'][1]['child_block_sort'], 'horizontal');
    t.assertEqual(second, first);
});

t.finish();
