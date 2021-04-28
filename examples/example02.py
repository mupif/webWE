import mupif
import copy
import models
import logging
log = logging.getLogger()


class MyUnnamedProject(mupif.workflow.Workflow):
    
    def __init__(self, metadata={}):
        MD = {
            'Inputs': [],
            'Outputs': [],
        }
        mupif.workflow.Workflow.__init__(self, metadata=MD)
        self.setMetadata('Name', 'My unnamed project')
        self.setMetadata('ID', 'my_unnamed_project_01')
        self.setMetadata('Description', '')
        self.updateMetadata(metadata)
        
        # __init__ code of constant_property_1 (Property)
        self.constant_property_1 = mupif.property.ConstantProperty(value=(0.0,), propID=mupif.PropertyID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit='degC', time=None, objectID=0)
        
        # __init__ code of model_1 (Non-stationary thermal problem)
        self.model_1 = models.ThermalNonstatModel()
        
        # __init__ code of model_2 (Plane stress linear elastic)
        self.model_2 = models.MechanicalModel()

        self.setMetadata('Model_refs_ID', [])
    
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
        self.model_1.initialize(file='inputT13.in', workdir='', metadata=execMD)
        
        # initialization code of model_2 (Plane stress linear elastic)
        self.model_2.initialize(file='inputM13.in', workdir='', metadata=execMD)
        
        mupif.workflow.Workflow.initialize(self, file=file, workdir=workdir, targetTime=targetTime, metadata={}, validateMetaData=validateMetaData, **kwargs)
    
    def terminate(self):
        pass
        self.model_1.terminate()
        self.model_2.terminate()
    
    def solve(self, runInBackground=False):
        pass
        
        # execution code of model_1 (Non-stationary thermal problem)
        model_1_virtual_timestep = mupif.timestep.TimeStep(time=0*mupif.Q.s, dt=1*mupif.Q.s, targetTime=1*mupif.Q.s)
        self.model_1.set(self.external_input_1, 'Cauchy top')
        self.model_1.set(self.constant_property_1, 'Dirichlet bottom')
        self.model_1.set(self.constant_property_1, 'Dirichlet left')
        self.model_1.solveStep(model_1_virtual_timestep)
        
        # execution code of model_2 (Plane stress linear elastic)
        model_2_virtual_timestep = mupif.timestep.TimeStep(time=0*mupif.Q.s, dt=1*mupif.Q.s, targetTime=1*mupif.Q.s)
        self.model_2.set(self.model_1.get(mupif.FieldID.FID_Temperature, model_2_virtual_timestep.getTime(), 0), 0)
        self.model_2.solveStep(model_2_virtual_timestep)


if __name__ == '__main__':
    problem = MyUnnamedProject()
    
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

