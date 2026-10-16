/**
 * Analysis of the execution order of a workflow (headless; used by the canvas view and the tests).
 *
 * Execution order in the editor is explicit: the generated code executes the children of every container
 * block in the order of ``Block.blocks`` (see ``Block.getExecutionLabel``). The position of a block on the
 * canvas has no influence. Because data links are independent of that order, a user can create a workflow
 * in which a block consumes a value before the producing block has been executed. This module
 *
 * - detects such order violations (``findOrderViolations``), and
 * - reorders the children of containers so that producers precede consumers
 *   (``orderChildrenByDependencies``).
 *
 * Terminology: for a data link, the *producer* is the block owning the output slot (``inout === 'out'``) and
 * the *consumer* is the block owning the input slot. External workflow inputs are stored as output slots of
 * the workflow block, so the rule holds for them as well.
 *
 * Only executable blocks (``Block.isExecutable``) take part in the execution order. Data and helper blocks
 * (constants, conversions, comparisons) emit no execution code; their value is evaluated where it is read. A
 * value read through such blocks therefore depends on the executable blocks feeding them (see
 * ``executableProducers``).
 */

/**
 * Result of the execution order analysis of a single data link.
 *
 * @typedef {Object} OrderViolation
 * @property {Datalink} datalink - the offending data link (ending at the consumer)
 * @property {Block} producer - executable block computing the data (directly or through data/helper blocks)
 * @property {Block} consumer - executable block consuming the data (executed before the producer)
 * @property {string} severity - 'error' when the value is read before it is ever computed; 'warning' when
 *           the blocks are inside a loop, where the consumer reads the value from the previous iteration
 *           (a legitimate pattern, e.g., for staggered coupling, but undefined in the first iteration)
 * @property {string} message - human readable description
 */

/**
 * Split a data link into its producer and consumer slots.
 *
 * @param {Datalink} datalink
 * @returns {{producer: Slot, consumer: Slot}|null} null when the link does not connect an output to an input
 */
function getDatalinkDirection(datalink){
    if(datalink.slot1.inout === 'out' && datalink.slot2.inout === 'in')
        return {producer: datalink.slot1, consumer: datalink.slot2};
    if(datalink.slot2.inout === 'out' && datalink.slot1.inout === 'in')
        return {producer: datalink.slot2, consumer: datalink.slot1};
    return null;
}

/**
 * Lift two blocks to their lowest common container.
 *
 * Execution order is only defined between siblings, therefore two arbitrary blocks are compared through
 * their ancestors which are children of the lowest common container: e.g., for blocks 2.1.3 and 2.4 the
 * common container is block 2 and the compared siblings are 2.1 (containing the first block) and 2.4.
 *
 * @param {Block} a
 * @param {Block} b
 * @returns {{container: Block, a: Block, b: Block}|null} the common container and the siblings representing
 *          ``a`` and ``b`` in it; null when one block is an ancestor of the other (or they are identical)
 */
function liftToCommonContainer(a, b){
    let chain_a = a.getParentBlockChain().concat([a]);
    let chain_b = b.getParentBlockChain().concat([b]);
    let i = 0;
    while(i < chain_a.length && i < chain_b.length && chain_a[i] === chain_b[i])
        i++;
    // i is the depth of the first differing ancestor; when one chain is a prefix of the other, one block
    // contains the other and their order is not defined by sibling order
    if(i === 0 || i >= chain_a.length || i >= chain_b.length)
        return null;
    return {container: chain_a[i - 1], a: chain_a[i], b: chain_b[i]};
}

/**
 * @param {Block} block
 * @returns {boolean} true when ``block`` or any of its ancestors is a loop
 */
function isInsideLoop(block){
    for(let b = block; b !== null; b = b.getParentBlock())
        if(b.isLoop())
            return true;
    return false;
}

/**
 * Executable blocks whose results are needed to evaluate the given block's outputs.
 *
 * An executable block is its own producer. The value of a non-executable (data or helper) block is evaluated
 * when it is read, from the values linked to its inputs; its producers are therefore the executable producers
 * of its linked inputs (searched recursively). External workflow inputs are available from the start and
 * have no producer.
 *
 * @param {Block} block - block owning an output slot
 * @param {Set<Block>} [visited] - blocks already searched (protection against cyclic links)
 * @returns {Block[]} executable blocks the outputs of ``block`` depend on
 */
function executableProducers(block, visited=new Set()){
    if(block.isExecutable())
        return [block];
    if(visited.has(block))
        return [];
    visited.add(block);
    let producers = [];
    block.getSlots('in').forEach(slot => {
        let linked = slot.getLinkedDataSlot();
        if(linked !== null && !linked.external)
            executableProducers(linked.getParentBlock(), visited).forEach(p => {
                if(!producers.includes(p))
                    producers.push(p);
            });
    });
    return producers;
}

/**
 * Find data links whose executable consumer is executed before (one of) its producer(s).
 *
 * For every data link ending at an executable block, the executable producers of the linked value are found
 * (through data and helper blocks, see ``executableProducers``) and compared with the consumer by their
 * sibling order in the lowest common container. Links from external workflow slots, links read by
 * non-executable blocks (they are checked at their executable consumers) and links between a container and
 * its own (nested) children are not reported, as their timing is not defined by the sibling order.
 *
 * @param {WorkflowEditor} editor
 * @returns {OrderViolation[]} detected violations (in the order of ``editor.datalinks``)
 */
function findOrderViolations(editor){
    let violations = [];
    for(let i = 0; i < editor.datalinks.length; i++){
        let dl = editor.datalinks[i];
        let dir = getDatalinkDirection(dl);
        if(dir === null || dir.producer.external || dir.consumer.external)
            continue;
        let consumer = dir.consumer.getParentBlock();
        if(!consumer.isExecutable())
            continue;
        let source = dir.producer.getParentBlock();
        executableProducers(source).forEach(producer => {
            let lifted = liftToCommonContainer(producer, consumer);
            if(lifted === null)
                return;
            let siblings = lifted.container.blocks;
            if(siblings.indexOf(lifted.b) >= siblings.indexOf(lifted.a))
                return;
            let in_loop = isInsideLoop(lifted.container);
            let via = source === producer ? '' : ' (through ' + source.getCodeName() + ')';
            let message = 'Block ' + consumer.getExecutionLabel() + ' (' + consumer.getCodeName() + ') reads \'' +
                dir.consumer.getName() + '\'' + via + ' computed by block ' + producer.getExecutionLabel() + ' (' +
                producer.getCodeName() + ') which is executed later';
            message += in_loop ? '; the value of the previous iteration is used.' : '.';
            violations.push({
                datalink: dl,
                producer: producer,
                consumer: consumer,
                severity: in_loop ? 'warning' : 'error',
                message: message
            });
        });
    }
    return violations;
}

/**
 * Data dependencies between the children of a container.
 *
 * All data links between blocks of the container's subtree are lifted to the children of the container
 * (see ``liftToCommonContainer``); links from/to external slots and links between a block and its own
 * ancestor are ignored.
 *
 * @param {Block} container
 * @param {WorkflowEditor} editor - editor holding the data links
 * @returns {Set<number>[]} for every child (by its index in ``container.blocks``) the indices of the children
 *          consuming its data
 */
function childDependencies(container, editor){
    let children = container.blocks;
    let successors = children.map(() => new Set());
    for(let i = 0; i < editor.datalinks.length; i++){
        let dir = getDatalinkDirection(editor.datalinks[i]);
        if(dir === null || dir.producer.external || dir.consumer.external)
            continue;
        let lifted = liftToCommonContainer(dir.producer.getParentBlock(), dir.consumer.getParentBlock());
        if(lifted === null || lifted.container !== container)
            continue;
        successors[children.indexOf(lifted.a)].add(children.indexOf(lifted.b));
    }
    return successors;
}

/**
 * Stable topological order of a dependency graph (Kahn's algorithm): among the nodes whose predecessors have
 * all been ordered, the one with the lowest index is taken next, so an already valid order is kept.
 *
 * @param {Set<number>[]} successors - successors of every node (see ``childDependencies``)
 * @returns {{order: number[], unordered: number[]}} ``order`` contains the sortable nodes; ``unordered`` the
 *          nodes which are members of a cycle or depend on one (in increasing index order)
 */
function stableTopologicalOrder(successors){
    let n = successors.length;
    let n_predecessors = new Array(n).fill(0);
    successors.forEach(succ => succ.forEach(c => n_predecessors[c]++));

    let order = [];
    let done = new Array(n).fill(false);
    for(let step = 0; step < n; step++){
        let next = -1;
        for(let i = 0; i < n && next < 0; i++)
            if(!done[i] && n_predecessors[i] === 0)
                next = i;
        if(next < 0)
            break;
        done[next] = true;
        order.push(next);
        successors[next].forEach(c => n_predecessors[c]--);
    }
    let unordered = [];
    for(let i = 0; i < n; i++)
        if(!done[i])
            unordered.push(i);
    return {order: order, unordered: unordered};
}

/**
 * Data flow rank of the children of a container: 0 for children consuming no data of their siblings, otherwise
 * one more than the highest rank of the siblings they consume data from (longest path layering). Children
 * which cannot be ordered because of a dependency cycle are ranked after their already ranked producers,
 * ignoring the links that close the cycle.
 *
 * The ranks are used to arrange blocks in columns following the data flow (see AutoLayout.js).
 *
 * @param {Block} container
 * @param {WorkflowEditor} editor - editor holding the data links
 * @returns {number[]} rank of every child (by its index in ``container.blocks``)
 */
function dataflowRanks(container, editor){
    let successors = childDependencies(container, editor);
    let topo = stableTopologicalOrder(successors);
    let ranks = new Array(successors.length).fill(0);
    let processed = new Array(successors.length).fill(false);
    topo.order.concat(topo.unordered).forEach(i => {
        processed[i] = true;
        successors[i].forEach(c => {
            if(!processed[c])
                ranks[c] = Math.max(ranks[c], ranks[i] + 1);
        });
    });
    return ranks;
}

/**
 * Reorder the children of a container so that every producer is executed before its consumers.
 *
 * The children are sorted topologically according to their data dependencies (``childDependencies``). The sort
 * is stable (``stableTopologicalOrder``), so an already valid order is not changed. Blocks which cannot be
 * ordered, i.e., members of a dependency cycle and blocks depending on them, keep their relative order and are
 * appended after the sorted blocks.
 *
 * @param {Block} container - block whose children are reordered (in place)
 * @param {WorkflowEditor} editor - editor holding the data links
 * @param {boolean} [recursive=false] - when true, the children of nested containers are reordered as well
 * @returns {{changed: boolean, unordered: Block[]}} whether any order changed and the blocks (of all
 *          processed containers) which could not be ordered because of a dependency cycle
 */
function orderChildrenByDependencies(container, editor, recursive=false){
    let children = container.blocks.slice();
    let topo = stableTopologicalOrder(childDependencies(container, editor));
    let order = topo.order.concat(topo.unordered);
    let unordered = topo.unordered.map(i => children[i]);

    let changed = order.some((idx, pos) => idx !== pos);
    container.blocks = order.map(idx => children[idx]);

    if(recursive){
        container.blocks.forEach(child => {
            if(child.isContainer()){
                let sub = orderChildrenByDependencies(child, editor, true);
                changed = changed || sub.changed;
                unordered = unordered.concat(sub.unordered);
            }
        });
    }
    return {changed: changed, unordered: unordered};
}
