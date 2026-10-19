/**
 * Unit tests of the code generation checks (BlockWorkflow.getCodeGenerationProblems / canGenerateCode).
 *
 * Run: ``node test_codegen.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const t = require('./testlib');
t.loadProject();

t.test('an execution workflow can generate execution code', () => {
    let ed = t.createEditor(1);
    t.assertEqual(ed.workflowblock.getCodeGenerationProblems('exec'), []);
    t.assert(ed.workflowblock.canGenerateCode('exec'));
});

t.test('a class workflow cannot generate execution code', () => {
    let ed = t.createEditor(2);
    let problems = ed.workflowblock.getCodeGenerationProblems('exec');
    t.assertEqual(problems.length, 2, 'external inputs and no Timeloop');
    t.assert(problems[0].indexOf('external inputs') > 0 && problems[1].indexOf('Timeloop') > 0);
    t.assert(!ed.workflowblock.canGenerateCode('exec'));
    t.assertEqual(ed.workflowblock.getCodeGenerationProblems('class'), []);
    t.assertEqual(ed.workflowblock.getCodeGenerationProblems('server'), []);
});

t.test('an unknown code type is a problem', () => {
    let ed = t.createEditor(1);
    t.assertEqual(ed.workflowblock.getCodeGenerationProblems('fortran'), ['Type of code is not valid!']);
});

t.finish();
