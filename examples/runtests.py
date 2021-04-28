import os
import filecmp

for test_number in range(1, 3):
    print("Running example number %d\n----------" % test_number)
    os.system("node nodejs_test.js %d" % test_number)

    f1 = "example%02d.json" % test_number
    f2 = "example%02d_copy.json" % test_number

    result = filecmp.cmp(f1, f2, shallow=False)
    if result:
        print("Files %s and %s are identical." % (f1, f2))
    else:
        print("ERROR: Files %s and %s are NOT identical!\n" % (f1, f2))
    print("----------\n")
