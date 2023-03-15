from os import listdir
from os.path import isfile, join

if __name__ == '__main__':
    mypath = '../src'
    onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
    
    files = [
        '../src/Init.js',
        '../src/Block.js',
        '../src/BlockDoWhile.js',
        '../src/BlockInputFile.js',
        '../src/BlockModel.js',
        '../src/BlockPhysicalQuantity.js',
        '../src/BlockProperty.js',
        '../src/BlockTimeloop.js',
        '../src/BlockWorkflow.js',
        '../src/BlockValueComparison.js',
        '../src/BlockPropertyToQuantity.js',
        '../src/BlockQuantityToProperty.js',
        '../src/BlockNumberToQuantity.js',
        '../src/BlockNumberToProperty.js',
        '../src/BlockDataListLength.js',
        '../src/BlockAllocateModelAtRuntime.js',
        '../src/BlockRunInBackground.js',
        '../src/BlockWaitForBackgroundProcesses.js',
        '../src/BlockVariable.js',
        '../src/BlockGetItemFromDataList.js',
        '../src/Datalink.js',
        '../src/helpers.js',
        '../src/Main.js',
        '../src/Menu.js',
        '../src/mupifData.js',
        '../src/myQuery.js',
        '../src/Slot.js',
        '../src/WorkflowEditor.js'
    ]
    
    for f in onlyfiles:
        if '../src/%s' % f not in files:
            files.append('../src/%s' % f)
    
    # print(files)
    
    fres = open('../project.js', 'w')
    
    for f in files:
        print('adding file %s' % f)
        ftemp = open(f, 'r')
        content = ftemp.read()
        fres.write('\n')
        fres.write(content)
        fres.write('\n')
        ftemp.close()
    
    fres.close()