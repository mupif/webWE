/**
 * Unit tests of the flow arrows of the execution flow overlay (collectFlowArrows in src/view/FlowOverlay.js,
 * which is independent of JointJS).
 *
 * Run: ``node test_flow.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadScript('src/view/FlowOverlay.js');

/**
 * @param {FlowArrow[]} arrows
 * @returns {string[]} 'from>to' (execution labels), with ' loop' for loop-back arrows
 */
function describe(arrows){
    return arrows.map(a => a.from.getExecutionLabel() + '>' + a.to.getExecutionLabel() + (a.loop ? ' loop' : ''));
}

t.test('arrows connect consecutive executable blocks; loops get a loop-back arrow', () => {
    let ed = t.createEditor(1);
    let arrows = collectFlowArrows(ed.workflowblock);
    t.assertEqual(describe(arrows), ['1.1>1.2', '1.2>1.3', '1.3>1.4', '1.4>1.1 loop'], 'data blocks are skipped');
    t.assert(arrows.every(a => a.container === ed.workflowblock.getBlocks(BlockTimeloop)[0]));
});

t.test('top-level arrows and nested loops', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    wf.addBlockByName('variable');
    wf.addBlockByName('dowhile');
    let dw = wf.getBlocks(BlockDoWhile)[0];
    dw.addBlockByName('variable');
    t.assertEqual(describe(collectFlowArrows(wf)),
        ['1>2', '2>3', '1.1>1.2', '1.2>1.3', '1.3>1.4', '1.4>1.1 loop', '3.1>3.1 loop']);
});

t.test('non-loop containers have no loop-back arrow', () => {
    let ed = t.createEditor();
    ed.workflowblock.addBlockByName('run_in_background');
    let rb = ed.workflowblock.getBlocks()[0];
    rb.addBlockByName('model');
    rb.addBlockByName('model');
    t.assertEqual(describe(collectFlowArrows(ed.workflowblock)), ['1.1>1.2']);
});

t.finish();
