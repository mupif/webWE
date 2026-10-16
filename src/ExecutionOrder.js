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
 */

/**
 * Result of the execution order analysis of a single data link.
 *
 * @typedef {Object} OrderViolation
 * @property {Datalink} datalink - the offending data link
 * @property {Block} producer - block providing the data
 * @property {Block} consumer - block consuming the data (executed before the producer)
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
 * Find data links whose consumer is executed before their producer.
 *
 * Links from/to external workflow slots and links between a container and its own (nested) children are
 * ignored, as their timing is not defined by the sibling order.
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
        let producer = dir.producer.getParentBlock();
        let consumer = dir.consumer.getParentBlock();
        let lifted = liftToCommonContainer(producer, consumer);
        if(lifted === null)
            continue;
        if(lifted.b.getExecutionIndex() < lifted.a.getExecutionIndex()){
            let in_loop = isInsideLoop(lifted.container);
            let message = 'Block ' + consumer.getExecutionLabel() + ' (' + consumer.getCodeName() + ') reads \'' +
                dir.consumer.getName() + '\' from block ' + producer.getExecutionLabel() + ' (' + producer.getCodeName() +
                ') which is executed later';
            message += in_loop ? '; the value of the previous iteration is used.' : '.';
            violations.push({
                datalink: dl,
                producer: producer,
                consumer: consumer,
                severity: in_loop ? 'warning' : 'error',
                message: message
            });
        }
    }
    return violations;
}

/**
 * Reorder the children of a container so that every producer is executed before its consumers.
 *
 * The data dependencies between the children are derived from all data links between blocks of the
 * container's subtree (lifted to the children, see ``liftToCommonContainer``). The children are then sorted
 * topologically (Kahn's algorithm). The sort is stable: among the blocks ready for execution, the one that
 * comes first in the current order is taken, so an already valid order is not changed. Blocks which cannot be
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
    let n = children.length;
    let successors = children.map(() => new Set());
    let n_predecessors = new Array(n).fill(0);

    for(let i = 0; i < editor.datalinks.length; i++){
        let dir = getDatalinkDirection(editor.datalinks[i]);
        if(dir === null || dir.producer.external || dir.consumer.external)
            continue;
        let lifted = liftToCommonContainer(dir.producer.getParentBlock(), dir.consumer.getParentBlock());
        if(lifted === null || lifted.container !== container)
            continue;
        let p = children.indexOf(lifted.a);
        let c = children.indexOf(lifted.b);
        if(!successors[p].has(c)){
            successors[p].add(c);
            n_predecessors[c]++;
        }
    }

    let order = [];
    let done = new Array(n).fill(false);
    for(let step = 0; step < n; step++){
        // the first ready block in the current order keeps the sort stable
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
        if(!done[i]){
            unordered.push(children[i]);
            order.push(i);
        }

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
