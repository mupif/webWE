import mupif
import copy
import Pyro5
import threading
import field_export
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalExecutionWorkflow_02(mupif.Workflow):

    def __init__(self, metadata=None):
        MD = {
            "ClassName": "ThermoMechanicalExecutionWorkflow_02",
            "ModuleName": "example03",
            "Name": "Thermo-mechanical execution workflow",
            "ID": "thermomechanical_exec_workflow_02",
            "Description": "",
            "Inputs": [
            ],
            "Outputs": [
            ],
            "Models": [
                {
                    "Name": "model_1",
                    "Jobmanager": "ThermoMechanicalClassWorkflow_02_jobman"
                },
                {
                    "Name": "model_2",
                    "Module": "field_export",
                    "Class": "field_export_to_image"
                },
                {
                    "Name": "model_3",
                    "Module": "field_export",
                    "Class": "field_export_to_image"
                }
            ]
        }
        super().__init__(metadata=MD)
        self.updateMetadata(metadata)
        self.daemon = None
        
        # __init__ code of constant_physical_quantity_1 (PhysicalQuantity)
        self.constant_physical_quantity_1 = 0.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_2 (PhysicalQuantity)
        self.constant_physical_quantity_2 = 10.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_3 (PhysicalQuantity)
        self.constant_physical_quantity_3 = 0.5*mupif.U.s
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=10.0, propID=mupif.DataID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.degC, time=None)
        
        # __init__ code of input_file_1 (InputFile)
        self.input_file_1 = mupif.PyroFile(filename='inputT.in', mode='rb')
        
        # __init__ code of input_file_2 (InputFile)
        self.input_file_2 = mupif.PyroFile(filename='inputM.in', mode='rb')

    def initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):
        super().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)

        ns = mupif.pyroutil.connectNameServer()
        self.daemon = mupif.pyroutil.getDaemon(ns)

        self.getModel('model_1').set(self.input_file_1, 'input_file_thermal')

        self.getModel('model_1').set(self.input_file_2, 'input_file_mechanical')

    def solve(self, runInBackground=False):
        pass
        
        # execution code of timeloop_1 (TimeLoop)
        timeloop_1_time = self.constant_physical_quantity_1
        timeloop_1_target_time = self.constant_physical_quantity_2
        timeloop_1_compute = True
        timeloop_1_time_step_number = 0
        while timeloop_1_compute:
            timeloop_1_time_step_number += 1
        
            timeloop_1_dt = min([self.constant_physical_quantity_3, self.model_1.getCriticalTimeStep(), self.model_2.getCriticalTimeStep(), self.model_3.getCriticalTimeStep()])
            timeloop_1_time = min(timeloop_1_time.inUnitsOf('s').getValue()+timeloop_1_dt.inUnitsOf('s').getValue(), timeloop_1_target_time.inUnitsOf('s').getValue())*mupif.U.s
        
            if timeloop_1_time.inUnitsOf('s').getValue() + 1.e-6 > timeloop_1_target_time.inUnitsOf('s').getValue():
                timeloop_1_compute = False
            
            timeloop_1_time_step = mupif.timestep.TimeStep(time=timeloop_1_time, dt=timeloop_1_dt, targetTime=timeloop_1_target_time, number=timeloop_1_time_step_number)
            
            # execution code of model_1 (Thermo-mechanical class workflow)
            self.getModel('model_1').set(self.constant_property_1, 'top_temperature')
            self.getModel('model_1').solveStep(timeloop_1_time_step)
            
            # execution code of model_2 (Field export to image)
            self.getModel('model_2').set(self.getModel('model_1').get(mupif.DataID.FID_Temperature, timeloop_1_time_step.getTime(), 'temperature'), '')
            self.getModel('model_2').solveStep(timeloop_1_time_step)
            
            # execution code of model_3 (Field export to image)
            self.getModel('model_3').set(self.getModel('model_1').get(mupif.DataID.FID_Displacement, timeloop_1_time_step.getTime(), 'displacement'), '')
            self.getModel('model_3').solveStep(timeloop_1_time_step)
        


if __name__ == '__main__':
    problem = ThermoMechanicalExecutionWorkflow_02()

    # these metadata are supposed to be filled before execution
    md = {
        'Execution': {
            'ID': 'N/A',
            'Use_case_ID': 'N/A',
            'Task_ID': 'N/A'
        }
    }
    problem.initialize(metadata=md)
    problem.solve()
    problem.terminate()

    print('Simulation has finished.')

