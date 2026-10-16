/**
 * Unit tests of the data link validation rules (WorkflowEditor.canLinkSlots / addDatalink).
 *
 * Run: ``node test_datalinks.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

/**
 * @returns {{ed: WorkflowEditor, wf: BlockWorkflow, q1: Block, q2: Block, cmp: Block}} empty project with two
 *          physical quantities and a value comparison block
 */
function setup(){
    let ed = t.createEditor();
    let wf = ed.workflowblock;
    wf.addBlockByName('physicalquantity');
    wf.addBlockByName('physicalquantity');
    wf.addBlockByName('value_comparison');
    let [q1, q2, cmp] = wf.getBlocks();
    return {ed, wf, q1, q2, cmp};
}

t.test('output can be linked to an input', () => {
    let {ed, q1, cmp} = setup();
    let r = ed.canLinkSlots(q1.getSlots('out')[0], cmp.getSlots('in')[0]);
    t.assertEqual(r, {ok: true, message: ''});
    t.assertEqual(ed.canLinkSlots(cmp.getSlots('in')[0], q1.getSlots('out')[0]).ok, true, 'order of slots does not matter');
});

t.test('invalid combinations are rejected with a reason', () => {
    let {ed, q1, q2, cmp} = setup();
    let out1 = q1.getSlots('out')[0];
    t.assertEqual(ed.canLinkSlots(out1, out1), {ok: false, message: ''}, 'same slot');
    t.assertEqual(ed.canLinkSlots(out1, null).ok, false, 'missing slot');
    t.assert(ed.canLinkSlots(out1, q2.getSlots('out')[0]).message.startsWith('Only input and output'), 'two outputs');
    let cmp_in = cmp.getSlots('in');
    t.assert(cmp.getSlots('out').length > 0);
    t.assert(ed.canLinkSlots(cmp.getSlots('out')[0], cmp_in[0]).message.startsWith('Slots within one block'), 'same block');
});

t.test('an input accepts a single link', () => {
    let {ed, q1, q2, cmp} = setup();
    let input = cmp.getSlots('in')[0];
    t.assert(ed.addDatalink(q1.getSlots('out')[0], input) !== null);
    let r = ed.canLinkSlots(q2.getSlots('out')[0], input);
    t.assertEqual(r.ok, false);
    t.assert(r.message.startsWith('One of the slots can not accept more connections.'));
    t.assertEqual(ed.addDatalink(q2.getSlots('out')[0], input), null, 'addDatalink refuses');
    t.assertEqual(ed.datalinks.length, 1);
});

t.test('an output accepts multiple links', () => {
    let {ed, q1, cmp} = setup();
    let out1 = q1.getSlots('out')[0];
    let ins = cmp.getSlots('in');
    t.assert(ins.length >= 2, 'value comparison has two inputs');
    t.assert(ed.addDatalink(out1, ins[0]) !== null && ed.addDatalink(out1, ins[1]) !== null);
});

t.test('two external slots cannot be linked', () => {
    let {ed, wf} = setup();
    let ext_in = wf.addExternalDataSlot('in', 'a');
    let ext_out = wf.addExternalDataSlot('out', 'b');
    t.assertEqual(ed.canLinkSlots(ext_in, ext_out).ok, false);
    let {ed: ed2, wf: wf2, cmp} = setup();
    let ext = wf2.addExternalDataSlot('in', 'x');
    t.assertEqual(ed2.canLinkSlots(ext, cmp.getSlots('in')[0]).ok, true, 'external input to a block input');
});

t.finish();
