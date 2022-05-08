import mupif
import copy
import example05

if __name__ == '__main__':
    # code to run the jobmanager server

    ns = mupif.pyroutil.connectNameServer()

    jobMan = mupif.SimpleJobManager(
        ns=ns,
        appClass=example05.ThermoMechanicalClassWorkflow_02,
        appName='ThermoMechanicalClassWorkflow_02_jobman',
        jobManWorkDir='.',
        maxJobs=10
    ).runServer()

