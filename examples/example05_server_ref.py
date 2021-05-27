import mupif
import copy
import example05

if __name__ == '__main__':
    # code to run the jobmanager server

    ns = mupif.pyroutil.connectNameServer(nshost='127.0.0.1', nsport=9090)

    jobMan = mupif.SimpleJobManager(
        appClass=example05.ThermoMechanicalClassWorkflow_02,
        server='127.0.0.1',
        nshost='127.0.0.1',
        nsport=9090,
        ns=ns,
        appName='ThermoMechanicalClassWorkflow_02_jobman',
        jobManWorkDir='.',
        maxJobs=10
    )

    mupif.pyroutil.runJobManagerServer(
        server='127.0.0.1',
        port=44382,
        nshost='127.0.0.1',
        nsport=9090,
        jobman=jobMan
    )

