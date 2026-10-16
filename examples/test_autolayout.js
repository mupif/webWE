/**
 * Unit tests of the automatic canvas layout (src/view/AutoLayout.js), which is independent of JointJS and of
 * the DOM. Block sizes are provided by a simple fake measuring function.
 *
 * Run: ``node test_autolayout.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadScript('src/view/AutoLayout.js');

/** Fake natural metrics: every block is 100 x 50, containers have a 40 high header zone. */
function measure(block){
    return block.isContainer() ? {w: 100, h: 90, contentTop: 40} : {w: 100, h: 50, contentTop: 50};
}

/** Fake size of external slot terminals. */
function measureExt(slot){
    return {w: 60, h: 20};
}

/**
 * @param {CanvasBox} a
 * @param {CanvasBox} b
 * @returns {boolean} true when box ``b`` lies inside box ``a``
 */
function inside(a, b){
    return b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
}

/**
 * @param {CanvasBox} a
 * @param {CanvasBox} b
 * @returns {boolean} true when the boxes overlap
 */
function overlap(a, b){
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

t.test('initial layout arranges blocks in data flow columns', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    let res = computeCanvasLayout(wf, measure, measureExt);
    let top = wf.getBlocks();
    let tl = top[7];
    // ranks: 7 constants (column 0) -> Timeloop (column 1)
    t.assert(top.slice(0, 7).every(b => b.layout.x === 0), 'constants form the first column');
    t.assert(top.slice(0, 6).every((b, i) => b.layout.y < top[i + 1].layout.y), 'column in execution order');
    t.assertEqual(tl.layout.x, 100 + LAYOUT_COLUMN_GAP, 'Timeloop in the second column');
    // inside the Timeloop: model_1 | model_2, model_3 | model_4
    let [m1, m2, m3, m4] = tl.getBlocks();
    t.assertEqual([m1.layout.x, m2.layout.x, m3.layout.x, m4.layout.x],
        [LAYOUT_PADDING, LAYOUT_PADDING + 100 + LAYOUT_COLUMN_GAP, LAYOUT_PADDING + 100 + LAYOUT_COLUMN_GAP, LAYOUT_PADDING + 2 * (100 + LAYOUT_COLUMN_GAP)]);
    t.assertEqual(m1.layout.y, 40 + LAYOUT_PADDING, 'children start below the header zone');
    t.assert(m3.layout.y > m2.layout.y, 'model_3 below model_2');
    // absolute boxes and container size
    let tl_box = res.blocks.get(tl);
    tl.getBlocks().forEach(m => t.assert(inside(tl_box, res.blocks.get(m)), 'child inside its container'));
    t.assertEqual(res.blocks.get(m1).x, tl_box.x + m1.layout.x, 'absolute = parent + relative');
    t.assertEqual(tl.layout.w, tl_box.w, 'container size is stored in the model');
});

t.test('blocks do not overlap after the initial layout', () => {
    for(let n = 1; n <= 6; n++){
        let ed = t.createEditor(n);
        let res = computeCanvasLayout(ed.workflowblock, measure, measureExt);
        let blocks = ed.workflowblock.getBlocksRecursive();
        for(let i = 0; i < blocks.length; i++)
            for(let j = i + 1; j < blocks.length; j++){
                let a = blocks[i], b = blocks[j];
                let related = a.getParentBlockChain().includes(b) || b.getParentBlockChain().includes(a);
                if(!related)
                    t.assert(!overlap(res.blocks.get(a), res.blocks.get(b)), 'example ' + n + ': ' + a.getCodeName() + ' / ' + b.getCodeName());
            }
    }
});

t.test('external slots form columns around the blocks', () => {
    let ed = t.createEditor(2);
    let wf = ed.workflowblock;
    let res = computeCanvasLayout(wf, measure, measureExt);
    let inputs = wf.getSlots('out'), outputs = wf.getSlots('in');
    t.assert(inputs.length > 0 && outputs.length > 0, 'example 2 has external inputs and outputs');
    inputs.forEach(s => t.assertEqual(s.layout.x, 0));
    let right = Math.max(...wf.getBlocks().map(b => res.blocks.get(b).x + res.blocks.get(b).w));
    let min_block_x = Math.min(...wf.getBlocks().map(b => b.layout.x));
    t.assertEqual(min_block_x, 60 + LAYOUT_EXT_GAP, 'blocks start right of the input column');
    outputs.forEach(s => t.assertEqual(s.layout.x, right + LAYOUT_EXT_GAP));
    t.assertEqual(res.extSlots.get(outputs[0]), {x: right + LAYOUT_EXT_GAP, y: 0, w: 60, h: 20});
});

t.test('placed blocks keep their position; new blocks continue the flow', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    computeCanvasLayout(wf, measure, measureExt);
    let tl = wf.getBlocks()[7];
    let before = JSON.stringify(wf.getBlocksRecursive().map(b => b.layout));
    computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(JSON.stringify(wf.getBlocksRecursive().map(b => b.layout)), before, 'layout is stable');

    tl.child_block_sort = 'vertical';
    tl.addBlockByName('property');
    let added = tl.getBlocks()[4];
    computeCanvasLayout(wf, measure, measureExt);
    let max_bottom = Math.max(...tl.getBlocks().slice(0, 4).map(b => b.layout.y + 50));
    t.assertEqual(added.layout, {x: LAYOUT_PADDING, y: max_bottom + LAYOUT_GAP}, 'appended below the placed children');

    tl.child_block_sort = 'horizontal';
    tl.addBlockByName('property');
    let added2 = tl.getBlocks()[5];
    computeCanvasLayout(wf, measure, measureExt);
    let max_right = Math.max(...tl.getBlocks().slice(0, 5).map(b => b.layout.x + 100));
    t.assertEqual(added2.layout, {x: max_right + LAYOUT_GAP, y: 40 + LAYOUT_PADDING}, 'appended right of the placed children');
});

t.test('containers grow with their children but keep a stored size', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    computeCanvasLayout(wf, measure, measureExt);
    let tl = wf.getBlocks()[7];
    let m4 = tl.getBlocks()[3];
    m4.setLayout({x: 1000, y: 500});
    let res = computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(res.blocks.get(tl).w, 1000 + 100 + LAYOUT_PADDING);
    t.assertEqual(res.blocks.get(tl).h, 500 + 50 + LAYOUT_PADDING);
    m4.setLayout({x: 30, y: 60});
    res = computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(res.blocks.get(tl).w, 1000 + 100 + LAYOUT_PADDING, 'stored size is kept');
});

t.test('children above or left of the content area are shifted into it', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    computeCanvasLayout(wf, measure, measureExt);
    let tl = wf.getBlocks()[7];
    let [m1, m2] = tl.getBlocks();
    let m2_before = Object.assign({}, m2.layout);
    m1.setLayout({x: 0, y: 10});   // left of the padding and inside the header zone (contentTop = 40)
    computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(m1.layout, {x: LAYOUT_PADDING, y: 40 + LAYOUT_PADDING});
    // the shift (dx = 20, dy = 50) is applied to all children, which preserves the arrangement
    t.assertEqual(m2.layout, {x: m2_before.x + LAYOUT_PADDING, y: m2_before.y + 40 + LAYOUT_PADDING - 10});
});

t.test('arranging children re-places them and discards the container size', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    computeCanvasLayout(wf, measure, measureExt);
    let tl = wf.getBlocks()[7];
    tl.getBlocks()[3].setLayout({x: 2000, y: 20});
    computeCanvasLayout(wf, measure, measureExt);
    t.assert(tl.layout.w > 2000, 'container grew');

    tl.arrangeChildren('vertical');
    t.assert(tl.getBlocks().every(b => b.layout === null), 'children are unplaced');
    t.assertEqual(Object.keys(tl.layout), ['x', 'y'], 'stored size discarded');
    computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(tl.getBlocks().map(b => b.layout.x), [20, 20, 20, 20], 'stacked vertically');
    t.assertEqual(tl.layout.w, 100 + 2 * LAYOUT_PADDING, 'container shrank to its content');

    tl.arrangeChildren('dataflow');
    computeCanvasLayout(wf, measure, measureExt);
    let col = 100 + LAYOUT_COLUMN_GAP;
    t.assertEqual(tl.getBlocks().map(b => b.layout.x), [20, 20 + col, 20 + col, 20 + 2 * col], 'data flow columns');

    tl.arrangeChildren('diagonal');
    t.assertEqual(tl.child_block_sort, 'dataflow', 'invalid arrangement is ignored');
    t.assertEqual(tl.getBlocks()[0].layout.x, 20, 'positions are kept');
});

t.test('top-level blocks are never shifted', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    computeCanvasLayout(wf, measure, measureExt);
    wf.getBlocks()[0].setLayout({x: -300, y: -200});
    computeCanvasLayout(wf, measure, measureExt);
    t.assertEqual(wf.getBlocks()[0].layout, {x: -300, y: -200});
});

t.finish();
