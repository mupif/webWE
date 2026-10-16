# Workflow Editor and Code Generator

The Workflow Editor and Code Generator is a part of MuPIF platform (http://mupif.org). It enables easy creation of simulation workflows and also provides generating of executable Python code of the simulations.

## Usage and Installation

At the present time, this tool is available at http://mupif.org/wecg/ for everyone to be used as a web application.

In case of usage as a Node.js application, it can be installed using git:

`git clone https://github.com/mupif/webWE.git`

The current version works with master branch of MuPIF, which can be installed using git:

`git clone https://github.com/mupif/mupif.git`

or using pip:

`pip install git+https://github.com/mupif/mupif.git`

## Using the editor

Open `workflow_editor.html` in a browser (served by any web server, e.g., `python3 -m http.server` in the
repository root); `workflow_editor.html?example_id=1` opens an example. The workflow is drawn on an SVG canvas
(based on the vendored [JointJS](https://www.jointjs.com/) library in `lib/joint/`):

- **Blocks** can be placed anywhere by dragging their header. Dropping a block onto a container (Time Loop,
  Do While, Run in background, Allocate model at runtime) nests it there, dropping it on the blank canvas makes
  it a top-level block. Containers grow with their content; *Arrange child blocks* in the context menu (or the
  `O` key) re-arranges the children by data flow, vertically or horizontally.
- **Data links** are drawn by dragging from a slot (port) to another one; compatible slots are highlighted while
  dragging. Hovering a link shows a remove button. Hovering a port shows the slot details.
- **Right click** opens the context menu of a block, a link, an external slot or of the canvas (adding blocks
  places them at the clicked point). A selected object can be deleted with `Delete`; `↑`/`↓` change the
  execution order of the selected block.
- **Mouse wheel** zooms, dragging the blank canvas pans; the toolbar offers *Fit* and *1:1*.

**Execution order.** The generated code executes the blocks of every container in their *execution order*,
which is independent of the position of the blocks on the canvas. Executable blocks (models, variables, loops
and other containers) carry a label with their hierarchical order (`1`, `2`, `2.1`, ...) and are connected by
semi-transparent *flow arrows* (loops also by a dashed loop-back arrow); the arrows can be switched off in the
toolbar. Data and helper blocks (constants, input files, conversions, comparisons) are not numbered, as their
values are evaluated where they are read.
When a block reads data computed by a block executed later, the data link and the label of the reading block
are marked red (orange inside a loop, where the value of the previous iteration is read) and the toolbar shows
the number of problems. *Order by dependencies* reorders the blocks so that every block is executed after the
blocks it reads from.

### Project file

Projects are saved as JSON (*Project > Save to JSON*). Since the canvas editor, blocks and external slots may
contain an optional `layout` record with their position (`x`, `y`, relative to the containing block) and, for
containers, their size (`w`, `h`). The layout does not influence the generated code. Projects without layout
(e.g., created by older versions) are arranged automatically when opened.

## Examples

This project provides three examples of simulation workflows, which work with 2D thermal and mechanical model.

A term 'execution workflow' means a workflow with a timeloop and no external inputs or outputs, which can be converted into a Python code, which can be executed. This is the case of example01 and example03.

A term 'class workflow' means a workflow without a timeloop, which can have external inputs and outputs, which contains several models. From outer scope it has the same behaviour like a model.
In example02 the class workflow contains thermal and mechanical models and produces a 'class code', which represents the thermo-mechanical workflow, which is included in the workflow of example03 as a thermo-mechanical model.

For better understanding of the terminology we present the structure of the examples with thermal and mechanical models and with simple models for exporting fields to image files. We also recommend to take a look at the examples in the graphical form in the web application.

````
example01.py (execution workflow)
    |- ThermalNonstatModel (model from mupif_examples_models.py)
    |- MechanicalModel (model from mupif_examples_models.py)
    |- field_export_to_image (model from field_export.py) - for temperature field
    └- field_export_to_image (model from field_export.py) - for displacement field

example03.py (execution workflow)
    |- ThermoMechanicalClassWorkflow_01 (class workflow from example02.py treated as a model)
    |     |- ThermalNonstatModel (model from mupif_examples_models.py)
    |     └- MechanicalModel (model from mupif_examples_models.py)
    |- field_export_to_image (model from field_export.py) - for temperature field
    └- field_export_to_image (model from field_export.py) - for displacement field
````

#### 1) Generate the Python scripts

A) The web version at http://mupif.org/tools/index_wecg.html provides examples of basic thermo-mechanical workflows.
The generated code can be downloaded to be run locally. Please save it with suggested filenames.
From the first, second and third workflow download files `example01.py`, `example02.py` and `example03.py`, respectively.

Note that to run the simulations, it is necessary to download simulation input files and files defining the model classes, which are provided on the homepage.
The thermal and mechanical models are defined in `mupif_examples_models.py`, a meshing tool is defined in `mupif_examples_meshgen.py` and a simple model for field export to image is defined in `field_export.py`.
Input files for the thermal and mechanical task are `inputT.in` and `inputM.in`.

B) The local installation of the project allows running the script `app_json_to_python.js` in the `examples` folder as a Node.js application.
It loads a project from given JSON file and saves the generated Python code.

Execution code of the first and third workflow can be generated with commands

`node app_json_to_python.js example01.json example01.py exec`

`node app_json_to_python.js example03.json example03.py exec`

Class code of the second workflow can be generated with command

`node app_json_to_python.js example02.json example02.py class`


#### 2) Run the Python execution workflow

The execution workflows are defined in files `example01.py` and `example03.py`.
These files represent the same usercase defined differently.
It means that both these scripts produce equal simulation of the thermo-mechanical workflow and also produce the same output - image files of temperature and displacement for each computational step.

The execution workflows can be executed with commands `python example01.py` or `python example03.py`, respectively.


## Development and tests

The editor consists of plain JavaScript files without a build step:

- `src/*.js` – the project model and the code generator; they are concatenated into `project.js` by
  `examples/unify.py`, which is used headless by the Node.js scripts in `examples/`;
- `src/view/*.js` – the SVG canvas (browser only).

The tests need Node.js and the Node package `jsonschema` (`npm install` in the repository root):

`cd examples && python3 runtests.py`

They regenerate the code of the examples and compare it with the reference files, check the JSON round-trip and
run the unit tests `examples/test_*.js`.

## License
The Workflow Editor and Code Generator has been developed at Czech Technical University by Stanislav Šulc and is available under GNU Library or Lesser General Public License version 3.0 (LGPLv3).
