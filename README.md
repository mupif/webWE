# Workflow Editor and Code Generator

The Workflow Editor and Code Generator is a part of MuPIF platform (http://www.mupif.org). It enables easy creation of simulation workflows and also provides generating of executable Python code of the simulations.

## Usage and Installation

At the present time, this tool is available at http://mech.fsv.cvut.cz/~sulc/wecg/ for everyone to be used as a web application.

In case of usage as a Node.js application, it can be installed using git:

`git clone https://github.com/mupif/webWE.git`

The current version works with master branch of MuPIF, which can be installed using git:

`git clone --branch dev https://github.com/mupif/mupif.git`

or using pip:

`pip install git+https://github.com/mupif/mupif.git`

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

A) The web version at http://mech.fsv.cvut.cz/~sulc/wecg/ provides examples of basic thermo-mechanical workflows.
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


## License
The Workflow Editor and Code Generator has been developed at Czech Technical University by Stanislav Šulc and is available under GNU Library or Lesser General Public License version 3.0 (LGPLv3).
