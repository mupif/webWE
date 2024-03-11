import mupif
import copy
import Pyro5
import threading
import time
import mupif_examples_models
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalClassWorkflow_02(mupif.Workflow):

    def __init__(self, metadata=None):
        MD = {
            "ClassName": "ThermoMechanicalClassWorkflow_02",
            "ModuleName": "",
            "Name": "Thermo-mechanical class workflow",
            "ID": "thermomechanical_class_workflow_02",
            "Description": "",
            "Execution_settings": {
                "Type": "Distributed",
                "jobManName": "ThermoMechanicalClassWorkflow_02_jobman"
            },
            "Inputs": [
                {"Name": "top_temperature", "Type": "mupif.Property", "Required": True, "description": "", "Type_ID": "mupif.DataID.PID_Temperature", "Obj_ID": "top_temperature", "Units": "degC", "Set_at": "timestep", "ValueType": "Scalar"},
                {"Name": "input_file_thermal", "Type": "mupif.PyroFile", "Required": True, "description": "", "Type_ID": "mupif.DataID.ID_InputFile", "Obj_ID": "input_file_thermal", "Units": "none", "Set_at": "initialization"},
                {"Name": "input_file_mechanical", "Type": "mupif.PyroFile", "Required": True, "description": "", "Type_ID": "mupif.DataID.ID_InputFile", "Obj_ID": "input_file_mechanical", "Units": "none", "Set_at": "initialization"}
            ],
            "Outputs": [
                {"Name": "temperature", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.DataID.FID_Temperature", "Obj_ID": "temperature", "Units": "degC"},
                {"Name": "displacement", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.DataID.FID_Displacement", "Obj_ID": "displacement", "Units": "m"}
            ],
            "Models": [
                {
                    "Name": "model_1",
                    "Module": "mupif_examples_models",
                    "Class": "ThermalNonstatModel",
                    "Instantiate": True
                },
                {
                    "Name": "model_2",
                    "Module": "mupif_examples_models",
                    "Class": "MechanicalModel",
                    "Instantiate": True
                }
            ]
        }
        super().__init__(metadata=MD)
        self.updateMetadata(metadata)
        self.daemon = None

        # initialization code of external input (top_temperature)
        self.external_input_1 = None
        # It should be defined from outside using set() method.

        # initialization code of external input (input_file_thermal)
        self.external_input_2 = None
        # It should be defined from outside using set() method.

        # initialization code of external input (input_file_mechanical)
        self.external_input_3 = None
        # It should be defined from outside using set() method.
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=0.0, propID=mupif.DataID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.degC, time=None)

    def initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):
        super().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)

        ns = mupif.pyroutil.connectNameserver()
        self.daemon = mupif.pyroutil.getDaemon(ns)

    # set method for all external inputs
    def set(self, obj, objectID=''):
        pass

        # in case of mupif.PyroFile
        if obj.isInstance(mupif.PyroFile):
            pass
            if objectID == 'input_file_thermal':
                self.external_input_2 = obj
                self.getModel('model_1').set(self.external_input_2, 'input_file_thermal_nonstat')
            if objectID == 'input_file_mechanical':
                self.external_input_3 = obj
                self.getModel('model_2').set(self.external_input_3, 'input_file_mechanical')

        # in case of mupif.Property
        if obj.isInstance(mupif.Property):
            pass
            if objectID == 'top_temperature':
                self.external_input_1 = obj

    # get method for all external outputs
    def get(self, objectTypeID, time=None, objectID=''):
        if objectID == 'temperature':
            return self.getModel('model_1').get(mupif.DataID.FID_Temperature, time, '')
        if objectID == 'displacement':
            return self.getModel('model_2').get(mupif.DataID.FID_Displacement, time, '')

        return None

    def solveStep(self, tstep, stageID=0, runInBackground=False):
        pass
        
        # execution code of model_1 (Non-stationary thermal problem)
        self.getModel('model_1').set(self.external_input_1, 'Cauchy top')
        self.getModel('model_1').set(self.constant_property_1, 'Dirichlet bottom')
        self.getModel('model_1').set(self.constant_property_1, 'Dirichlet left')
        self.getModel('model_1').solveStep(tstep=tstep, runInBackground=False)
        
        # execution code of model_2 (Plane stress linear elastic)
        self.getModel('model_2').set(self.getModel('model_1').get(mupif.DataID.FID_Temperature, tstep.getTime(), ''), '')
        self.getModel('model_2').solveStep(tstep=tstep, runInBackground=False)


