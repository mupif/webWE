/**
 * Minimal helpers for the headless Node unit tests of the workflow editor.
 *
 * The editor sources are plain browser scripts declaring global classes. ``loadProject()`` evaluates the
 * bundled ``project.js`` (built from ``src/*.js`` by ``unify.py``) in the global script scope, so that the
 * classes (``Block``, ``WorkflowEditor``, ...) are visible to the test scripts exactly like in the browser.
 *
 * Usage::
 *
 *     const t = require('./testlib');
 *     t.loadProject();
 *     t.test('name', () => { t.assertEqual(1, 1); });
 *     t.finish();   // prints a summary and sets the process exit status
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let loaded = false;
let n_passed = 0;
let failures = [];

/**
 * Evaluate ``project.js`` in the global scope (only once).
 */
function loadProject(){
    if(!loaded){
        vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'project.js'), 'utf8'), {filename: 'project.js'});
        loaded = true;
    }
}

/**
 * Evaluate an additional browser script (e.g., a headless module of ``src/view/``, which is not part of
 * ``project.js``) in the global scope, after ``project.js``.
 *
 * @param {string} relative_path - path relative to the repository root, e.g., 'src/view/AutoLayout.js'
 */
function loadScript(relative_path){
    loadProject();
    vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', relative_path), 'utf8'), {filename: relative_path});
}

/**
 * Create a fresh headless editor (``visual=false``), optionally loaded from an example project.
 *
 * @param {number|null} example_number - number NN of ``exampleNN.json`` to load, or null for an empty project
 * @returns {WorkflowEditor} the editor instance (also stored in the global ``editor`` variable)
 */
function createEditor(example_number=null){
    loadProject();
    let ed = main(false);
    if(example_number !== null)
        ed.loadFromJsonData(loadExampleJson(example_number));
    return ed;
}

/**
 * @param {number} example_number - number NN of ``exampleNN.json``
 * @returns {Object} parsed JSON of the example project
 */
function loadExampleJson(example_number){
    let name = 'example' + String(example_number).padStart(2, '0') + '.json';
    return JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
}

/**
 * Run one named test case and record its result; exceptions are reported as failures.
 *
 * @param {string} name - test case name
 * @param {Function} fn - test body
 */
function test(name, fn){
    try{
        fn();
        n_passed++;
        console.log('  ok    ' + name);
    }catch(e){
        failures.push(name);
        console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e));
    }
}

/**
 * @param {*} condition - value that must be truthy
 * @param {string} [message] - description of the failure
 */
function assert(condition, message='assertion failed'){
    if(!condition)
        throw new Error(message);
}

/**
 * Deep equality assertion based on the JSON representation of both values.
 *
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
function assertEqual(actual, expected, message=''){
    let a = JSON.stringify(actual);
    let b = JSON.stringify(expected);
    if(a !== b)
        throw new Error((message ? message + ': ' : '') + 'expected ' + b + ', got ' + a);
}

/**
 * Print the summary and set the process exit status (1 when any test failed).
 */
function finish(){
    console.log(n_passed + ' passed, ' + failures.length + ' failed');
    process.exitCode = failures.length ? 1 : 0;
}

module.exports = {loadProject, loadScript, createEditor, loadExampleJson, test, assert, assertEqual, finish};
