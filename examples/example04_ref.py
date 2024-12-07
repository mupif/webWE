import mupif
import copy
import Pyro5
import threading
import time
import os
import field_export
import logging
log = logging.getLogger()


@Pyro5.api.expose
class ThermoMechanicalExecutionWorkflow_01(mupif.Workflow):

    def __init__(self, metadata=None):
        MD = {
            "ClassName": "ThermoMechanicalExecutionWorkflow_01",
            "ModuleName": "example01",
            "Name": "Thermo-mechanical execution workflow",
            "ID": "thermomechanical_exec_workflow_01",
            "Description": "",
            "Inputs": [
            ],
            "Outputs": [
            ],
            "Models": [
                {
                    "Name": "model_1",
                    "Jobmanager": "JobMan_ThermalNonstat",
                    "Instantiate": True
                },
                {
                    "Name": "model_2",
                    "Jobmanager": "JobMan_ThermalNonstat",
                    "Instantiate": True
                },
                {
                    "Name": "model_3",
                    "Module": "field_export",
                    "Class": "field_export_to_image",
                    "Instantiate": True
                },
                {
                    "Name": "model_4",
                    "Module": "field_export",
                    "Class": "field_export_to_image",
                    "Instantiate": True
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
        
        # __init__ code of constant_property_2 (Property)
        self.constant_property_2 = mupif.property.ConstantProperty(value=0.0, propID=mupif.DataID.PID_Temperature, valueType=mupif.ValueType.Scalar, unit=mupif.U.degC, time=None)
        
        # __init__ code of input_file_1 (InputFile)
        self.input_file_1 = mupif.PyroFile(filename='inputT.in', mode='rb')
        
        # __init__ code of input_file_2 (InputFile)
        self.input_file_2 = mupif.PyroFile(filename='inputM.in', mode='rb')

    def initialize(self, workdir='', metadata=None, validateMetaData=True, **kwargs):
        super().initialize(workdir=workdir, metadata=metadata, validateMetaData=validateMetaData, **kwargs)

        ns = mupif.pyroutil.connectNameserver()
        self.daemon = mupif.pyroutil.getDaemon(ns)
        
        # initialization code of input_file_1 (InputFile)
        self.daemon.register(self.input_file_1)
        
        # initialization code of input_file_2 (InputFile)
        self.daemon.register(self.input_file_2)

        self.getModel('model_1').set(self.input_file_1, 'input_file_thermal_nonstat')

        self.getModel('model_2').set(self.input_file_2, 'input_file_mechanical')

    def solve(self, runInBackground=False):
        pass
        
        # execution code of timeloop_1 (Timeloop)
        timeloop_1_time = self.constant_physical_quantity_1
        timeloop_1_target_time = self.constant_physical_quantity_2
        timeloop_1_compute = True
        timeloop_1_time_step_number = 0
        while timeloop_1_compute:
            timeloop_1_time_step_number += 1
        
            timeloop_1_dt = min([self.constant_physical_quantity_3, self.getModel('model_1').getCriticalTimeStep(), self.getModel('model_2').getCriticalTimeStep(), self.getModel('model_3').getCriticalTimeStep(), self.getModel('model_4').getCriticalTimeStep()])
            timeloop_1_time = min(timeloop_1_time.inUnitsOf('s').getValue()+timeloop_1_dt.inUnitsOf('s').getValue(), timeloop_1_target_time.inUnitsOf('s').getValue())*mupif.U.s
        
            if timeloop_1_time.inUnitsOf('s').getValue() + 1.e-6 > timeloop_1_target_time.inUnitsOf('s').getValue():
                timeloop_1_compute = False
            
            timeloop_1_time_step = mupif.timestep.TimeStep(time=timeloop_1_time, dt=timeloop_1_dt, targetTime=timeloop_1_target_time, number=timeloop_1_time_step_number)
            
            # execution code of model_1 (Non-stationary thermal problem)
            self.getModel('model_1').set(self.constant_property_1, 'Cauchy top')
            self.getModel('model_1').set(self.constant_property_2, 'Dirichlet left')
            self.getModel('model_1').set(self.constant_property_2, 'Dirichlet right')
            self.getModel('model_1').solveStep(tstep=timeloop_1_time_step, runInBackground=False)
            
            # execution code of model_2 (Plane stress linear elastic)
            self.getModel('model_2').set(self.getModel('model_1').get(mupif.DataID.FID_Temperature, timeloop_1_time_step.getTime(), ''), '')
            self.getModel('model_2').solveStep(tstep=timeloop_1_time_step, runInBackground=False)
            
            # execution code of model_3 (Field export to image)
            self.getModel('model_3').set(self.getModel('model_1').get(mupif.DataID.FID_Temperature, timeloop_1_time_step.getTime(), ''), '')
            self.getModel('model_3').solveStep(tstep=timeloop_1_time_step, runInBackground=False)
            
            # execution code of model_4 (Field export to image)
            self.getModel('model_4').set(self.getModel('model_2').get(mupif.DataID.FID_Displacement, timeloop_1_time_step.getTime(), ''), '')
            self.getModel('model_4').solveStep(tstep=timeloop_1_time_step, runInBackground=False)
        


if __name__ == '__main__':
    problem = ThermoMechanicalExecutionWorkflow_01()

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

