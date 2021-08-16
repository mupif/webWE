import mupif
import copy
import Pyro5
import threading
import example02
import field_export
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalExecutionWorkflow_02(mupif.workflow.Workflow):

    def __init__(self, metadata={}):
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
        }
        mupif.workflow.Workflow.__init__(self, metadata=MD)
        self.updateMetadata(metadata)
        self.daemon = None
        
        # __init__ code of constant_physical_quantity_1 (PhysicalQuantity)
        self.constant_physical_quantity_1 = 0.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_2 (PhysicalQuantity)
        self.constant_physical_quantity_2 = 10.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_3 (PhysicalQuantity)
        self.constant_physical_quantity_3 = 0.5*mupif.U.s
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=(10.0,), propID=mupif.DataID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.deg_C, time=None, objectID=0)
        
        # __init__ code of input_file_1 (InputFile)
        self.input_file_1 = mupif.PyroFile(filename='inputT.in', mode='rb')
        
        # __init__ code of input_file_2 (InputFile)
        self.input_file_2 = mupif.PyroFile(filename='inputM.in', mode='rb')
        
        # __init__ code of model_1 (Thermo-mechanical class workflow)
        self.model_1 = None  # instances of models are created in the initialize function
        
        # __init__ code of model_2 (Field export to image)
        self.model_2 = None  # instances of models are created in the initialize function
        
        # __init__ code of model_3 (Field export to image)
        self.model_3 = None  # instances of models are created in the initialize function


    def initialize(self, workdir='', targetTime=0*mupif.Q.s, metadata={}, validateMetaData=True, **kwargs):

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

        
        # initialization code of input_file_1 (InputFile)
        self.daemon.register(self.input_file_1)
        
        # initialization code of input_file_2 (InputFile)
        self.daemon.register(self.input_file_2)
        
        # initialization code of model_1 (Thermo-mechanical class workflow)
        self.model_1 = example02.ThermoMechanicalClassWorkflow_01()
        self.model_1.initialize(workdir='', metadata=execMD)
        
        # initialization code of model_2 (Field export to image)
        self.model_2 = field_export.field_export_to_image()
        self.model_2.initialize(workdir='', metadata=execMD)
        
        # initialization code of model_3 (Field export to image)
        self.model_3 = field_export.field_export_to_image()
        self.model_3.initialize(workdir='', metadata=execMD)

        self.registerModel(self.model_1, "model_1")
        self.registerModel(self.model_2, "model_2")
        self.registerModel(self.model_3, "model_3")

        mupif.Workflow.initialize(self, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)

        self.model_1.set(self.input_file_1, 'input_file_thermal')

        self.model_1.set(self.input_file_2, 'input_file_mechanical')

    def terminate(self):
        pass
        self.model_1.terminate()
        self.model_2.terminate()
        self.model_3.terminate()

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
            self.model_1.set(self.constant_property_1, 'top_temperature')
            self.model_1.solveStep(timeloop_1_time_step)
            
            # execution code of model_2 (Field export to image)
            self.model_2.set(self.model_1.get(mupif.DataID.FID_Temperature, timeloop_1_time_step.getTime(), 'temperature'), 0)
            self.model_2.solveStep(timeloop_1_time_step)
            
            # execution code of model_3 (Field export to image)
            self.model_3.set(self.model_1.get(mupif.DataID.FID_Displacement, timeloop_1_time_step.getTime(), 'displacement'), 0)
            self.model_3.solveStep(timeloop_1_time_step)
        


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

