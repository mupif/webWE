import os
import filecmp

rp = os.path.realpath(__file__)
dirname = "%s%s" % (os.path.dirname(rp), os.path.sep)

tests = [
    [1, "exec"],
    [2, "class"],
    [3, "exec"],
    [4, "exec"],
    [5, "class"],
    [5, "server"],
    [6, "exec"],
]

for test_number in range(0, len(tests)):
    print("Running example number %d\n----------" % tests[test_number][0])
    os.system("node %sapp_test.js %d %s" % (dirname, tests[test_number][0], tests[test_number][1]))

    if tests[test_number][1] != "server":
        f1 = "%sexample%02d.json" % (dirname, tests[test_number][0])
        f2 = "%sexample%02d_copy.json" % (dirname, tests[test_number][0])
    
        result = filecmp.cmp(f1, f2, shallow=False)
        if result:
            print("Files %s and %s are identical." % (f1, f2))
        else:
            print("!    ERROR: Files %s and %s are NOT identical!" % (f1, f2))
    
    server_add = ""
    if tests[test_number][1] == "server":
        server_add = "_server"

    f1 = "%sexample%02d%s.py" % (dirname, tests[test_number][0], server_add)
    f2 = "%sexample%02d%s_ref.py" % (dirname, tests[test_number][0], server_add)

    result = filecmp.cmp(f1, f2, shallow=False)
    if result:
        print("Files %s and %s are identical." % (f1, f2))
    else:
        print("!    ERROR: Files %s and %s are NOT identical!" % (f1, f2))

    print("----------\n")
