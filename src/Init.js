let editor;// The Workflow Editor instance

let example_id = 0;// Global defining optional example

/**
 * When true, the workflow is rendered by the former HTML/flexbox renderer instead of the SVG canvas
 * (CanvasView). It is set by the URL parameter ``view=legacy`` (see workflow_editor.html).
 * @type {boolean}
 */
let legacy_view = false;