# Workflow Editor and Code Generator

The Workflow Editor and Code Generator is a part of MuPIF platform (http://www.mupif.org). It enables easy creation of simulation workflows and also provides generating of executable Python code of the simulations.

## Usage and Installation

At the present time, this tool is available at http://www.hrom.fsv.cvut.cz/webWE/ for everyone to be used as a web application.

In case of usage as a Node.js application, it can be installed using git:

`git clone https://github.com/mupif/webWE.git`

The current version works with dev branch of MuPIF, which can be installed using git:

`git clone --branch dev https://github.com/mupif/mupif.git`

or using pip:

`pip install git+https://github.com/mupif/mupif.git@dev`

## Running Examples

The web version at http://www.hrom.fsv.cvut.cz/webWE/ provides examples of basic thermo-mechanical workflows.
The generated code can be downloaded to be run locally. Note that it needs to download files defining the model classes, which are provided on the homepage.

The installation as a Node.js application provides these workflows in webWE/examples directory.
The script `app_json_to_python.js` can load project from given JSON file and save the generated Python execution or class code.
Execution code of the first workflow can be generated with command

`node app_json_to_python.js example01.json example01.py exec`

Class code of the second workflow can be generated with command

`node app_json_to_python.js example02.json example02.py class`

Execution code of the third workflow can be generated with command

`node app_json_to_python.js example03.json example03.py exec`

Running given execution workflow with `python example01.py` or `python example03.py` should produce the same output,
which means image files of temperature and displacement for each step.




All these workflows rely on the thermal and mechanical models defined in `mupif_examples_models.py`, on a meshing tool defined in `mupif_examples_meshgen.py` and on a simple model for field conversion to image, which is defined in `field_export.py`.

The term 'execution workflow' means a workflow with a timeloop and no external inputs or outputs, which can be converted into an 'execution code', which is a Python code ready to be executed. This is the case of example01 and example03.

The term 'class workflow' means a workflow with external inputs and outputs, which includes several models and from outer scope it behaves like a model. In example02 the class workflow contains thermal and mechanical models and produces a 'class code', which represents the thermo-mechanical workflow which can be includes in another workflow just like another thermo-mechanical model, which happens in example03.

For better understanding of this terminology take a look at the examples in the graphical form.

## License
The Workflow Editor and Code Generator has been developed at Czech Technical University by Stanislav Šulc and is available under GNU Library or Lesser General Public License version 3.0 (LGPLv3).
