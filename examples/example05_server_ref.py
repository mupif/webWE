import mupif
import copy
import example05

if __name__ == '__main__':
    # code to run the jobmanager server

    ns = mupif.pyroutil.connectNameServer(nshost='127.0.0.1', nsport=9090)

    jobMan = mupif.SimpleJobManager(
        ns=ns,
        appClass=example05.ThermoMechanicalClassWorkflow_02,
        appName='ThermoMechanicalClassWorkflow_02_jobman',
        jobManWorkDir='.',
        maxJobs=10
    ).runServer()

