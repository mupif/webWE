from os import listdir
from os.path import isfile, join

mypath = '../src'
onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]

files = ['../src/Init.js']

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