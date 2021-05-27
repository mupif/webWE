import mupif
import copy
import Pyro5
import mupif_examples_models
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalClassWorkflow_02(mupif.workflow.Workflow):

    def __init__(self, metadata={}):
        MD = {
            "ClassName": "ThermoMechanicalClassWorkflow_02",
            "ModuleName": "",
            "Name": "Thermo-mechanical class workflow",
            "ID": "thermomechanical_class_workflow_02",
            "Description": "",
            "Execution_settings": {
                "Type": "Distributed",
                "jobManName": "ThermoMechanicalClassWorkflow_02_jobman",
                "nshost": "",
                "nsport": ""
            },
            "Inputs": [
                {"Name": "top_temperature", "Type": "mupif.Property", "Required": True, "description": "", "Type_ID": "mupif.PropertyID.PID_Temperature", "Obj_ID": ["top_temperature"], "Units": ""},
            ],
            "Outputs": [
                {"Name": "temperature", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.FieldID.FID_Temperature", "Obj_ID": ["temperature"], "Units": ""},
                {"Name": "displacement", "Type": "mupif.Field", "description": "", "Type_ID": "mupif.FieldID.FID_Displacement", "Obj_ID": ["displacement"], "Units": ""},
            ],
        }
        mupif.workflow.Workflow.__init__(self, metadata=MD)
        self.updateMetadata(metadata)

        # initialization code of external input
        self.external_input_1 = None
        # It should be defined from outside using set() method.
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=(0.0,), propID=mupif.PropertyID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.deg_C, time=None, objectID=0)
        
        # __init__ code of model_1 (Non-stationary thermal problem)
        self.model_1 = None  # instances of models are created in the initialize function
        
        # __init__ code of model_2 (Plane stress linear elastic)
        self.model_2 = None  # instances of models are created in the initialize function


    def initialize(self, file='', workdir='', targetTime=0*mupif.Q.s, metadata={}, validateMetaData=True, **kwargs):

        self.updateMetadata(dictionary=metadata)

        execMD = {
            'Execution': {
                'ID': self.getMetadata('Execution.ID'),
                'Use_case_ID': self.getMetadata('Execution.Use_case_ID'),
                'Task_ID': self.getMetadata('Execution.Task_ID')
            }
        }
        
        # initialization code of model_1 (Non-stationary thermal problem)
        self.model_1 = mupif_examples_models.ThermalNonstatModel()
        self.model_1.initialize(file='inputT.in', workdir='', metadata=execMD)
        
        # initialization code of model_2 (Plane stress linear elastic)
        self.model_2 = mupif_examples_models.MechanicalModel()
        self.model_2.initialize(file='inputM.in', workdir='', metadata=execMD)

        self.registerModel(self.model_1, "model_1")
        self.registerModel(self.model_2, "model_2")
        self.generateMetadataModelRefsID()

        mupif.workflow.Workflow.initialize(self, file=file, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)

    def getCriticalTimeStep(self):
        return min([self.model_1.getCriticalTimeStep(), self.model_2.getCriticalTimeStep()])

    # set method for all external inputs
    def set(self, obj, objectID=0):
        
        # in case of Property
        if isinstance(obj, mupif.property.Property):
            pass
            if objectID == 'top_temperature':
                self.external_input_1 = obj

        # in case of Field
        if isinstance(obj, mupif.field.Field):
            pass

    # get method for all external outputs
    def get(self, objectType, time=None, objectID=0):

        # in case of Property
        if isinstance(objectType, mupif.PropertyID):
            pass

        # in case of Field
        if isinstance(objectType, mupif.FieldID):
            pass
            if objectID == 'temperature':
                return self.model_1.get(mupif.FieldID.FID_Temperature, time, 0)
            if objectID == 'displacement':
                return self.model_2.get(mupif.FieldID.FID_Displacement, time, 0)

        return None

    def terminate(self):
        pass
        self.model_1.terminate()
        self.model_2.terminate()

    def solveStep(self, tstep, stageID=0, runInBackground=False):
        pass
        
        # execution code of model_1 (Non-stationary thermal problem)
        self.model_1.set(self.external_input_1, 'Cauchy top')
        self.model_1.set(self.constant_property_1, 'Dirichlet bottom')
        self.model_1.set(self.constant_property_1, 'Dirichlet left')
        self.model_1.solveStep(tstep)
        
        # execution code of model_2 (Plane stress linear elastic)
        self.model_2.set(self.model_1.get(mupif.FieldID.FID_Temperature, tstep.getTime(), 0), 0)
        self.model_2.solveStep(tstep)


