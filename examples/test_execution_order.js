/**
 * Unit tests of execution labels (Block.getExecutionLabel) and of the execution order analysis
 * (src/ExecutionOrder.js).
 *
 * Example 1 used below: blocks 1-7 are constants and input files, block 8 is a Timeloop containing the
 * models 8.1-8.4; model_1 (8.1) provides 'temperature' to model_2 (8.2) and model_3 (8.3), model_2 provides
 * 'displacement' to model_4 (8.4).
 *
 * Run: ``node test_execution_order.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

/**
 * @param {WorkflowEditor} ed
 * @returns {string[]} 'label:code_name' of all blocks in depth-first order
 */
function labels(ed){
    ed.workflowblock.generateAllElementCodeNames();
    return ed.workflowblock.getBlocksRecursive().map(b => b.getExecutionLabel() + ':' + b.getCodeName());
}

/**
 * @param {Block} container
 * @param {Block} block - child of container
 * @param {number} index - new position of the block among the children
 */
function moveTo(container, block, index){
    container.removeBlockFromList(block);
    container.blocks.splice(index, 0, block);
}

t.test('hierarchical execution labels', () => {
    let ed = t.createEditor(1);
    let l = labels(ed);
    t.assertEqual(l.slice(6), ['7:input_file_2', '8:timeloop_1', '8.1:model_1', '8.2:model_2', '8.3:model_3', '8.4:model_4']);
    t.assertEqual(ed.workflowblock.getExecutionLabel(), '');
    t.assertEqual(ed.workflowblock.getExecutionIndex(), -1);
});

t.test('labels follow reordering', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let m1 = tl.getBlocks()[0];
    m1.moveMeDown();
    t.assertEqual(m1.getExecutionLabel(), '8.2');
    tl.moveMeUp();
    t.assertEqual(tl.getExecutionLabel(), '7');
    t.assertEqual(m1.getExecutionLabel(), '7.2');
});

t.test('container and loop classification', () => {
    let ed = t.createEditor();
    ['timeloop', 'dowhile', 'run_in_background', 'allocate_model_at_runtime', 'model', 'property'].forEach(n => ed.workflowblock.addBlockByName(n));
    let b = ed.workflowblock.getBlocks();
    t.assertEqual(b.map(x => x.isContainer()), [true, true, true, true, false, false]);
    t.assertEqual(b.map(x => x.isLoop()), [true, true, false, false, false, false]);
    t.assert(ed.workflowblock.isContainer() && !ed.workflowblock.isLoop(), 'workflow is a non-loop container');
});

t.test('examples have no order violations', () => {
    for(let n = 1; n <= 6; n++)
        t.assertEqual(findOrderViolations(t.createEditor(n)).length, 0, 'example ' + n);
});

t.test('liftToCommonContainer', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let tl = wf.getBlocks(BlockTimeloop)[0];
    let c1 = wf.getBlocks()[0];
    let m2 = tl.getBlocks()[1];
    let r = liftToCommonContainer(c1, m2);
    t.assert(r.container === wf && r.a === c1 && r.b === tl, 'model is represented by its Timeloop');
    r = liftToCommonContainer(tl.getBlocks()[0], m2);
    t.assert(r.container === tl, 'siblings inside the Timeloop');
    t.assertEqual(liftToCommonContainer(tl, m2), null, 'ancestor relation has no order');
    t.assertEqual(liftToCommonContainer(m2, m2), null);
});

t.test('consumer before producer at top level is an error', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let moved = wf.getBlocks()[0];
    moveTo(wf, moved, wf.getBlocks().length - 1);   // start_time constant after the Timeloop
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assertEqual(v[0].severity, 'error');
    t.assert(v[0].producer === moved, 'producer is the moved constant');
    t.assert(v[0].consumer instanceof BlockTimeloop, 'consumer is the Timeloop');
    t.assert(v[0].message.indexOf('executed later') > 0, 'message explains the problem');
});

t.test('nested consumer is lifted to its container', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let tl = wf.getBlocks(BlockTimeloop)[0];
    let file1 = wf.getBlocks(BlockInputFile)[0];
    moveTo(wf, file1, wf.getBlocks().length - 1);   // input file consumed by model 8.1 moved after the loop
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assert(v[0].consumer === tl.getBlocks()[0], 'consumer is the nested model');
    t.assertEqual(v[0].severity, 'error', 'top level is not inside a loop');
});

t.test('consumer before producer inside a loop is a warning', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    tl.getBlocks()[0].moveMeDown();   // model_1 after model_2, which consumes its temperature
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assertEqual(v[0].severity, 'warning');
    t.assert(v[0].message.indexOf('previous iteration') > 0);
});

t.test('ordering by dependencies repairs the order and keeps valid orders', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let before = labels(ed);
    let r = orderChildrenByDependencies(wf, ed, true);
    t.assertEqual(r, {changed: false, unordered: []});
    t.assertEqual(labels(ed), before, 'valid order is kept (stable sort)');

    let tl = wf.getBlocks(BlockTimeloop)[0];
    let models = tl.getBlocks().slice();
    tl.blocks = [models[3], models[2], models[1], models[0]];   // reverse the loop body
    moveTo(wf, wf.getBlocks()[0], wf.getBlocks().length - 1);
    t.assert(findOrderViolations(ed).length > 0);
    r = orderChildrenByDependencies(wf, ed, true);
    t.assert(r.changed && r.unordered.length === 0);
    t.assertEqual(findOrderViolations(ed).length, 0, 'no violations after reordering');
    t.assert(tl.getBlocks().indexOf(models[0]) < tl.getBlocks().indexOf(models[1]), 'model_1 before model_2');
    t.assert(tl.getBlocks().indexOf(models[1]) < tl.getBlocks().indexOf(models[3]), 'model_2 before model_4');
});

t.test('non-recursive ordering only touches the given container', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    tl.getBlocks()[0].moveMeDown();
    let r = orderChildrenByDependencies(ed.workflowblock, ed, false);
    t.assertEqual(r.changed, false);
    t.assertEqual(findOrderViolations(ed).length, 1);
    t.assert(orderChildrenByDependencies(tl, ed).changed);
    t.assertEqual(findOrderViolations(ed).length, 0);
});

t.test('blocks in or behind a dependency cycle keep their relative order', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let [m1, m2, m3, m4] = tl.getBlocks();
    // feedback: model_2 output -> model_1 input closes the cycle model_1 -> model_2 -> model_1
    let free_in = m1.getSlots('in').find(s => !s.connected());
    t.assert(free_in, 'model_1 has a free input');
    t.assert(ed.addDatalink(m2.getSlots('out')[0], free_in) !== null, 'feedback link created');
    tl.blocks = [m3, m4, m2, m1];
    let r = orderChildrenByDependencies(tl, ed);
    // model_3 and model_4 consume outputs of the cycle members, so they cannot be scheduled either
    t.assertEqual(r.unordered.length, 4);
    t.assertEqual(r.changed, false);
    t.assert(tl.getBlocks().every((b, i) => b === [m3, m4, m2, m1][i]), 'unordered blocks keep their order');
});

t.test('reordering does not change generated code of a valid workflow', () => {
    let ed = t.createEditor(1);
    let code = ed.getExecutionCode();
    orderChildrenByDependencies(ed.workflowblock, ed, true);
    t.assertEqual(ed.getExecutionCode(), code);
});

t.finish();
