/**
 * Unit tests of execution labels (Block.getExecutionLabel) and of the execution order analysis
 * (src/ExecutionOrder.js).
 *
 * Example 1 used below: seven constants and input files (data blocks, not executed, hence unlabelled) followed
 * by a Timeloop (block 1) containing the models 1.1-1.4; model_1 (1.1) provides 'temperature' to model_2 (1.2)
 * and model_3 (1.3), model_2 provides 'displacement' to model_4 (1.4).
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

/**
 * Example 1 with a Variable block inserted at the given top-level position.
 *
 * @param {number} index - position of the Variable among the top-level blocks
 * @returns {{ed: WorkflowEditor, wf: BlockWorkflow, tl: BlockTimeloop, models: Block[], variable: BlockVariable}}
 */
function exampleWithVariable(index){
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    wf.addBlockByName('variable');
    let variable = wf.getBlocks(BlockVariable)[0];
    moveTo(wf, variable, index);
    let tl = wf.getBlocks(BlockTimeloop)[0];
    return {ed, wf, tl, models: tl.getBlocks().slice(), variable};
}

t.test('hierarchical execution labels number executable blocks only', () => {
    let ed = t.createEditor(1);
    let l = labels(ed);
    t.assertEqual(l.slice(5), [':input_file_1', ':input_file_2', '1:timeloop_1', '1.1:model_1', '1.2:model_2', '1.3:model_3', '1.4:model_4']);
    t.assertEqual(ed.workflowblock.getExecutionLabel(), '');
    t.assertEqual(ed.workflowblock.getExecutionIndex(), -1);
    t.assertEqual(ed.workflowblock.getBlocks()[0].getExecutionIndex(), -1, 'data block has no index');
});

t.test('executable and non-executable blocks', () => {
    let ed = t.createEditor();
    let names = ['physicalquantity', 'property', 'file', 'value_comparison', 'property_to_quantity', 'quantity_to_property',
        'number_to_quantity', 'number_to_property', 'datalist_length', 'get_item_from_datalist',
        'model', 'variable', 'wait_for_background_processes', 'timeloop', 'dowhile', 'run_in_background', 'allocate_model_at_runtime'];
    names.forEach(n => ed.workflowblock.addBlockByName(n));
    t.assertEqual(ed.workflowblock.getBlocks().map(b => b.isExecutable()), names.map((n, i) => i >= 10));
    t.assertEqual(ed.workflowblock.getBlocks().slice(9).map(b => b.getExecutionLabel()), ['', '1', '2', '3', '4', '5', '6', '7']);
});

t.test('labels follow reordering', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let m1 = tl.getBlocks()[0];
    m1.moveMeDown();
    t.assertEqual(m1.getExecutionLabel(), '1.2');
    ed.workflowblock.addBlockByName('variable');
    t.assertEqual(ed.workflowblock.getBlocks(BlockVariable)[0].getExecutionLabel(), '2');
    tl.moveMeDown();
    t.assertEqual(tl.getExecutionLabel(), '2');
    t.assertEqual(m1.getExecutionLabel(), '2.2');
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

t.test('data blocks can be placed anywhere', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    moveTo(wf, wf.getBlocks()[0], wf.getBlocks().length - 1);   // start_time constant after the Timeloop
    moveTo(wf, wf.getBlocks(BlockInputFile)[0], wf.getBlocks().length - 1);   // input file of model_1 as well
    t.assertEqual(findOrderViolations(ed).length, 0, 'constants are evaluated where they are read');
});

t.test('consumer before producer at top level is an error', () => {
    let {ed, variable, models} = exampleWithVariable(0);   // the Variable runs before the Timeloop
    ed.addDatalink(models[0].getSlots('out')[0], variable.getDataSlotWithName('in'));
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assertEqual(v[0].severity, 'error');
    t.assert(v[0].producer === models[0], 'producer is the model');
    t.assert(v[0].consumer === variable, 'consumer is the Variable');
    t.assert(v[0].message.indexOf('executed later') > 0, 'message explains the problem');
});

t.test('nested consumer is lifted to its container', () => {
    let {ed, wf, models, variable} = exampleWithVariable(8);   // the Variable runs after the Timeloop
    let free = models[0].getSlots('in').find(s => !s.connected());
    ed.addDatalink(variable.getDataSlotWithName('out'), free);
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assert(v[0].consumer === models[0], 'consumer is the nested model');
    t.assertEqual(v[0].severity, 'error', 'top level is not inside a loop');
    moveTo(wf, variable, 0);
    t.assertEqual(findOrderViolations(ed).length, 0, 'fixed by running the Variable first');
});

t.test('values read through helper blocks depend on their executable producers', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let [m1, m2] = tl.getBlocks();
    tl.addBlockByName('quantity_to_property');
    let helper = tl.getBlocks()[4];
    moveTo(tl, helper, 0);   // the position of the helper does not matter
    ed.addDatalink(m2.getDataSlotWithName('displacement'), helper.getSlots('in')[0]);
    ed.addDatalink(helper.getSlots('out')[0], m1.getSlots('in').find(s => !s.connected()));
    let producers = executableProducers(helper);
    t.assert(producers.length === 1 && producers[0] === m2, 'the helper depends on model_2');
    let v = findOrderViolations(ed);
    t.assertEqual(v.length, 1);
    t.assert(v[0].producer === m2 && v[0].consumer === m1, 'model_1 reads model_2 through the helper');
    t.assertEqual(v[0].severity, 'warning', 'inside the loop');
    t.assert(v[0].message.indexOf('through ' + helper.getCodeName()) > 0, 'message names the helper');
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

t.test('data flow ranks follow the longest dependency path', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    t.assertEqual(dataflowRanks(ed.workflowblock, ed), [0, 0, 0, 0, 0, 0, 0, 1], 'constants feed the Timeloop');
    t.assertEqual(dataflowRanks(tl, ed), [0, 1, 1, 2], 'model_1 -> model_2, model_3; model_2 -> model_4');
    tl.blocks = tl.blocks.slice().reverse();
    t.assertEqual(dataflowRanks(tl, ed), [2, 1, 1, 0], 'ranks do not depend on the execution order');
});

t.test('data flow ranks of a cycle', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let [m1, m2] = tl.getBlocks();
    ed.addDatalink(m2.getSlots('out')[0], m1.getSlots('in').find(s => !s.connected()));
    let ranks = dataflowRanks(tl, ed);
    t.assertEqual(ranks.length, 4);
    t.assert(ranks[0] < ranks[1] && ranks[1] < ranks[3], 'cycle broken in execution order: ' + ranks);
});

t.test('moving a block into another container', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let tl = wf.getBlocks(BlockTimeloop)[0];
    let m4 = tl.getBlocks()[3];
    let prop = wf.getBlocks(BlockProperty)[0];
    t.assert(m4.moveToContainer(wf), 'model out of the loop');
    t.assertEqual(m4.getExecutionLabel(), '2', 'appended as the last top-level block, after the Timeloop');
    t.assert(prop.moveToContainer(tl), 'property into the loop');
    t.assert(prop.getParentBlock() === tl && tl.getBlocks()[3] === prop);
    t.assertEqual(prop.getExecutionLabel(), '', 'data blocks are not numbered');
    t.assertEqual(ed.datalinks.length, 11, 'data links are kept');
    t.assert(!tl.moveToContainer(tl), 'not into itself');
    t.assert(!wf.moveToContainer(tl), 'the workflow cannot be moved');
    t.assert(!prop.moveToContainer(m4), 'not into a non-container');
    wf.addBlockByName('dowhile');
    let dw = wf.getBlocks(BlockDoWhile)[0];
    t.assert(dw.moveToContainer(tl), 'DoWhile into the loop');
    t.assert(!tl.moveToContainer(dw), 'not into a descendant');
});

t.test('reordering does not change generated code of a valid workflow', () => {
    let ed = t.createEditor(1);
    let code = ed.getExecutionCode();
    orderChildrenByDependencies(ed.workflowblock, ed, true);
    t.assertEqual(ed.getExecutionCode(), code);
});

t.finish();
