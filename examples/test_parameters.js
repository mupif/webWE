/**
 * Unit tests of the editable parameters of blocks, of the project and of external slots
 * (getParameters / setParameter), which the inspector panel of the editor uses.
 *
 * Run: ``node test_parameters.js`` (requires an up-to-date ``project.js``, see ``unify.py``).
 */
const fs = require('fs');
const path = require('path');
const t = require('./testlib');
t.loadProject();

/**
 * @param {WorkflowEditor} ed - editor to which the model metadata of examples/metadata/ are added (as the
 *        browser editor loads them at startup)
 */
function loadMetadata(ed){
    ['md01', 'md02', 'md03'].forEach(name =>
        ed.list_of_model_metadata.push(JSON.parse(fs.readFileSync(path.join(__dirname, 'metadata', name + '.json'), 'utf8'))));
}

/**
 * @param {Object} owner - block or slot
 * @returns {Object} parameter values by key
 */
function values(owner){
    let v = {};
    owner.getParameters().forEach(p => { v[p.key] = p.value; });
    return v;
}

/**
 * Save the project and load it into a new editor.
 *
 * @param {WorkflowEditor} ed
 * @returns {WorkflowEditor}
 */
function reload(ed){
    let ed2 = t.createEditor();
    ed2.loadFromJsonData(JSON.parse(JSON.stringify(ed.getJSON())));
    return ed2;
}

t.test('blocks without parameters', () => {
    let ed = t.createEditor(1);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    t.assertEqual(tl.getParameters(), []);
    t.assertEqual(tl.setParameter('value', '1'), false);
});

t.test('property parameters, synchronized output slot and round-trip', () => {
    let ed = t.createEditor(1);
    let prop = ed.workflowblock.getBlocks(BlockProperty)[0];
    t.assertEqual(values(prop), {value: '10.0', units: 'degC', property_id: 'PID_Temperature', value_type: 'Scalar'});
    t.assert(prop.getParameters()[2].options.some(o => o.value === 'PID_Temperature'), 'DataID choices');
    t.assert(prop.setParameter('value', ' 25.5 '));
    t.assert(prop.setParameter('units', 'K'));
    t.assert(prop.setParameter('property_id', 'PID_Concentration'));
    t.assert(prop.setParameter('value_type', 'Vector'));
    t.assert(!prop.setParameter('value', '  '), 'empty value rejected');
    t.assert(!prop.setParameter('unknown', 'x'));
    let slot = prop.getSlots('out')[0];
    t.assertEqual([prop.value, prop.property_id, prop.value_type], ['25.5', 'mupif.DataID.PID_Concentration', 'mupif.ValueType.Vector']);
    t.assertEqual([slot.units, slot.obj_type, slot.value_type], ['K', 'mupif.DataID.PID_Concentration', 'mupif.ValueType.Vector'],
        'the output slot follows the parameters');
    let prop2 = reload(ed).workflowblock.getBlocks(BlockProperty)[0];
    t.assertEqual(values(prop2), values(prop), 'parameters survive saving');
    let slot2 = prop2.getSlots('out')[0];
    t.assertEqual([slot2.units, slot2.obj_type, slot2.value_type], [slot.units, slot.obj_type, slot.value_type],
        'the slot after loading equals the slot in the session');
    t.assert(ed.getExecutionCode().includes('value=25.5, propID=mupif.DataID.PID_Concentration'), 'generated code uses the values');
});

t.test('physical quantity and input file parameters', () => {
    let ed = t.createEditor(1);
    let q = ed.workflowblock.getBlocks(BlockPhysicalQuantity)[0];
    t.assertEqual(values(q), {value: '0.0', units: 's'});
    t.assert(q.setParameter('units', 'min') && q.getSlots('out')[0].units === 'min');
    t.assert(q.setParameter('value', '3'));
    t.assertEqual(values(reload(ed).workflowblock.getBlocks(BlockPhysicalQuantity)[0]), {value: '3', units: 'min'});
    let f = ed.workflowblock.getBlocks(BlockInputFile)[0];
    t.assertEqual(values(f), {filename: 'inputT.in'});
    t.assert(f.setParameter('filename', 'other.in'));
    t.assertEqual(f.filename, 'other.in');
});

t.test('model parameters: metadata choice and working directory', () => {
    let ed = t.createEditor(1);
    loadMetadata(ed);
    let tl = ed.workflowblock.getBlocks(BlockTimeloop)[0];
    let thermal = tl.getBlocks()[0];
    let p = thermal.getParameters();
    t.assertEqual(p.map(x => x.key), ['metadata', 'working_directory']);
    t.assertEqual(p[0].value, 'NonStatThermo-1');
    t.assertEqual(p[0].options.map(o => o.value), ['Thermo-1', 'NonStatThermo-1', 'Mechanical-1']);
    let exporter = tl.getBlocks()[2];
    t.assertEqual(exporter.getParameters()[0].options[0], {value: 'field_export_to_image', label: 'Field export to image'},
        'the current metadata is offered even when it is not loaded in the editor');
    t.assert(thermal.setParameter('working_directory', '/tmp/run'));
    t.assertEqual(thermal.input_file_directory, '/tmp/run');
    t.assert(thermal.setParameter('metadata', 'NonStatThermo-1'), 'unchanged metadata keeps the slots');
    t.assertEqual(ed.datalinks.length, 11);
    t.assert(!thermal.setParameter('metadata', 'unknown'), 'unknown model rejected');
    t.assert(thermal.setParameter('metadata', 'Thermo-1'));
    t.assertEqual(thermal.md['ID'], 'Thermo-1');
    let md = ed.list_of_model_metadata[0];
    t.assertEqual(thermal.getSlots('out').map(s => s.name), [md['Outputs'][0]['Name']], 'slots rebuilt from the new metadata');
    t.assert(thermal.getSlots('in').every(s => s.name.startsWith(md['Inputs'][0]['Name'])));
    t.assert(ed.datalinks.length < 11, 'links of the old slots removed');
});

t.test('project settings', () => {
    let ed = t.createEditor(1);
    let wf = ed.workflowblock;
    t.assertEqual(wf.getParameters().map(p => p.key),
        ['project_name', 'project_classname', 'project_modulename', 'project_id', 'project_nshost', 'project_nsport']);
    t.assert(wf.setParameter('project_name', 'New name'));
    t.assert(!wf.setParameter('project_classname', ' '), 'empty class name rejected');
    t.assert(wf.setParameter('project_nshost', ''), 'empty host means the default');
    t.assert(!wf.setParameter('code_name', 'x'), 'only settings can be set');
    t.assertEqual(reload(ed).workflowblock.project_name, 'New name');
});

t.test('external slot name', () => {
    let ed = t.createEditor(2);
    let [a, b] = ed.workflowblock.getSlots();
    t.assertEqual(values(a), {name: a.name});
    t.assert(!a.setParameter('name', b.name), 'duplicate name rejected');
    t.assert(!a.setParameter('name', ''), 'empty name rejected');
    t.assert(a.setParameter('name', 'renamed'));
    t.assertEqual(reload(ed).workflowblock.getSlots()[0].name, 'renamed');
});

t.finish();
