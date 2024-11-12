import mupif
import copy
import Pyro5
import threading
import time
import mupif_examples_models
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalClassWorkflow_01(mupif.Workflow):

    def __init__(self, metadata=None):
        MD = {
            "ClassName": "ThermoMechanicalClassWorkflow_01",
            "ModuleName": "example02",
            "Name": "Thermo-mechanical class workflow",
            "ID": "thermomechanical_class_workflow_01",
            "Description": "",
            "Execution_settings": {
                "Type": "Local"
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


if __name__ == '__main__':  # for development and testing
    md = {'Execution': {'ID': 'N/A', 'Use_case_ID': 'N/A', 'Task_ID': 'N/A'}}
    ns = mupif.pyroutil.connectNameserver()
    daemon = mupif.pyroutil.getDaemon(ns)

    w = ThermoMechanicalClassWorkflow_01()
    w.initialize(metadata=md)

    w.set(mupif.ConstantProperty(value=0., propID=mupif.DataID.PID_Temperature, valueType=Scalar, unit='degC'), objectID='top_temperature')
    input_file_1 = mp.PyroFile(filename='./input_file_1.txt', mode="rb", dataID=mupif.DataID.ID_InputFile)
    model.set(input_file_1, objectID='input_file_thermal')
    input_file_2 = mp.PyroFile(filename='./input_file_2.txt', mode="rb", dataID=mupif.DataID.ID_InputFile)
    model.set(input_file_2, objectID='input_file_mechanical')

    w.solve()

    output_1 = w.get(mupif.DataID.FID_Temperature, objectID='temperature')
    print(output_1)
    output_2 = w.get(mupif.DataID.FID_Displacement, objectID='displacement')
    print(output_2)

    w.terminate()

