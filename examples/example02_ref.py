import mupif
import copy
import Pyro5
import threading
import mupif_examples_models
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalClassWorkflow_01(mupif.workflow.Workflow):

    def __init__(self, metadata={}):
        MD = {
            "ClassName": "ThermoMechanicalClassWorkflow_01",
            "ModuleName": "example02",
            "Name": "Thermo-mechanical class workflow",
            "ID": "thermomechanical_class_workflow_01",
            "Description": "",
            "Execution_settings": {
                "Type": "Local",
            },
            "Inputs": [
                {"Name": "top_temperature", "Type": "mupif.Property", "Required": True, "description": "", "Type_ID": "mupif.DataID.PID_Temperature", "Obj_ID": ["top_temperature"], "Units": "", "Set_at": "timestep"},
                {"Name": "input_file_thermal", "Type": "mupif.PyroFile", "Required": True, "description": "", "Type_ID": "mupif.DataID.ID_InputFile", "Obj_ID": ["input_file_thermal"], "Units": "", "Set_at": "initialization"},
                {"Name": "input_file_mechanical", "Type": "mupif.PyroFile", "Required": True, "description": "", "Type_ID": "mupif.DataID.ID_InputFile", "Obj_ID": ["input_file_mechanical"], "Units": "", "Set_at": "initialization"},
            ],
            "Outputs": [
                {"Name": "temperature", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.DataID.FID_Temperature", "Obj_ID": ["temperature"], "Units": ""},
                {"Name": "displacement", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.DataID.FID_Displacement", "Obj_ID": ["displacement"], "Units": ""},
            ],
        }
        mupif.workflow.Workflow.__init__(self, metadata=MD)
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
        self.constant_property_1 = mupif.property.ConstantProperty(value=(0.0,), propID=mupif.DataID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.deg_C, time=None)
        
        # __init__ code of model_1 (Non-stationary thermal problem)
        self.model_1 = None  # instances of models are created in the initialize function
        
        # __init__ code of model_2 (Plane stress linear elastic)
        self.model_2 = None  # instances of models are created in the initialize function


    def initialize(self, workdir='', metadata={}, validateMetaData=True, **kwargs):

        self.updateMetadata(dictionary=metadata)

        execMD = {
            'Execution': {
                'ID': self.getMetadata('Execution.ID'),
                'Use_case_ID': self.getMetadata('Execution.Use_case_ID'),
                'Task_ID': self.getMetadata('Execution.Task_ID')
            }
        }

        ns = mupif.pyroutil.connectNameServer(nshost='127.0.0.1', nsport=9090)
        self.daemon = pyroutil.getDaemon(ns)

        
        # initialization code of model_1 (Non-stationary thermal problem)
        self.model_1 = mupif_examples_models.ThermalNonstatModel()
        self.model_1.initialize(workdir='', metadata=execMD)
        
        # initialization code of model_2 (Plane stress linear elastic)
        self.model_2 = mupif_examples_models.MechanicalModel()
        self.model_2.initialize(workdir='', metadata=execMD)

        self.registerModel(self.model_1, "model_1")
        self.registerModel(self.model_2, "model_2")

        mupif.Workflow.initialize(self, workdir=workdir, metadata={}, validateMetaData=validateMetaData, **kwargs)

    def getCriticalTimeStep(self):
        return min([self.model_1.getCriticalTimeStep(), self.model_2.getCriticalTimeStep()])

    # set method for all external inputs
    def set(self, obj, objectID=0):

        # in case of mupif.PyroFile
        if obj.isInstance(mupif.PyroFile):
            pass
            if objectID == 'input_file_thermal':
                self.external_input_2 = obj
                model_1.set(self.external_input_2, 'input_file_thermal_nonstat')
            if objectID == 'input_file_mechanical':
                self.external_input_3 = obj
                model_2.set(self.external_input_3, 'input_file_mechanical')

        # in case of mupif.Property
        if obj.isInstance(mupif.Property):
            pass
            if objectID == 'top_temperature':
                self.external_input_1 = obj

        # in case of mupif.Field
        if obj.isInstance(mupif.Field):
            pass

    # get method for all external outputs
    def get(self, objectTypeID, time=None, objectID=0):
        if objectID == 'temperature':
            return self.model_1.get(mupif.DataID.FID_Temperature, time, 0)
        if objectID == 'displacement':
            return self.model_2.get(mupif.DataID.FID_Displacement, time, 0)

        return None

    def terminate(self):
        pass
        self.model_1.terminate()
        self.model_2.terminate()

    def finishStep(self, tstep):
        pass
        self.model_1.finishStep(tstep)
        self.model_2.finishStep(tstep)

    def solveStep(self, tstep, stageID=0, runInBackground=False):
        pass
        
        # execution code of model_1 (Non-stationary thermal problem)
        self.model_1.set(self.external_input_1, 'Cauchy top')
        self.model_1.set(self.constant_property_1, 'Dirichlet bottom')
        self.model_1.set(self.constant_property_1, 'Dirichlet left')
        self.model_1.solveStep(tstep)
        
        # execution code of model_2 (Plane stress linear elastic)
        self.model_2.set(self.model_1.get(mupif.DataID.FID_Temperature, tstep.getTime(), 0), 0)
        self.model_2.solveStep(tstep)


