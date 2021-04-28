import os
import filecmp

rp = os.path.realpath(__file__)
dirname = "%s%s" % (os.path.dirname(rp), os.path.sep)

for test_number in range(1, 3):
    print("Running example number %d\n----------" % test_number)
    os.system("node %snodejs_test.js %d" % (dirname, test_number))

    f1 = "%sexample%02d.json" % (dirname, test_number)
    f2 = "%sexample%02d_copy.json" % (dirname, test_number)

    result = filecmp.cmp(f1, f2, shallow=False)
    if result:
        print("Files %s and %s are identical." % (f1, f2))
    else:
        print("ERROR: Files %s and %s are NOT identical!" % (f1, f2))
    print("----------\n")
