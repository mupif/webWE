import mupif
import copy
import example02
import logging
log = logging.getLogger()


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
        
        # __init__ code of constant_physical_quantity_1 (PhysicalQuantity)
        self.constant_physical_quantity_1 = 0.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_2 (PhysicalQuantity)
        self.constant_physical_quantity_2 = 10.0*mupif.U.s
        
        # __init__ code of constant_physical_quantity_3 (PhysicalQuantity)
        self.constant_physical_quantity_3 = 0.5*mupif.U.s
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=(10.0,), propID=mupif.PropertyID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.deg_C, time=None, objectID=0)
        
        # __init__ code of model_1 (Thermo-mechanical class workflow)
        self.model_1 = example02.ThermoMechanicalClassWorkflow_01()

        self.setMetadata('Model_refs_ID', [])
        self.registerModel(self.model_1)
    
    def initialize(self, file='', workdir='', targetTime=0*mupif.Q.s, metadata={}, validateMetaData=True, **kwargs):
        
        self.updateMetadata(dictionary=metadata)
        
        execMD = {
            'Execution': {
                'ID': self.getMetadata('Execution.ID'),
                'Use_case_ID': self.getMetadata('Execution.Use_case_ID'),
                'Task_ID': self.getMetadata('Execution.Task_ID')
            }
        }
        
        # initialization code of model_1 (Thermo-mechanical class workflow)
        self.model_1.initialize(file='', workdir='', metadata=execMD)
        
        mupif.workflow.Workflow.initialize(self, file=file, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)
    
    def terminate(self):
        pass
        self.model_1.terminate()
    
    def solve(self, runInBackground=False):
        pass
        
        # execution code of timeloop_1 (TimeLoop)
        timeloop_1_time = self.constant_physical_quantity_1
        timeloop_1_target_time = self.constant_physical_quantity_2
        timeloop_1_compute = True
        timeloop_1_time_step_number = 0
        while timeloop_1_compute:
            timeloop_1_time_step_number += 1
        
            timeloop_1_dt = min([self.constant_physical_quantity_3, self.model_1.getCriticalTimeStep()])
            timeloop_1_time = min(timeloop_1_time.inUnitsOf('s').getValue()+timeloop_1_dt.inUnitsOf('s').getValue(), timeloop_1_target_time.inUnitsOf('s').getValue())*mupif.U.s
        
            if timeloop_1_time.inUnitsOf('s').getValue() + 1.e-6 > timeloop_1_target_time.inUnitsOf('s').getValue():
                timeloop_1_compute = False
            
            timeloop_1_time_step = mupif.timestep.TimeStep(time=timeloop_1_time, dt=timeloop_1_dt, targetTime=timeloop_1_target_time, number=timeloop_1_time_step_number)
            
            # execution code of model_1 (Thermo-mechanical class workflow)
            self.model_1.set(self.constant_property_1, 'top_temperature')
            self.model_1.solveStep(timeloop_1_time_step)
        


if __name__ == '__main__':
    problem = ThermoMechanicalExecutionWorkflow_02()
    
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

