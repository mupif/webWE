import os
import filecmp
from termcolor import colored

rp = os.path.realpath(__file__)
dirname = "%s%s" % (os.path.dirname(rp), os.path.sep)

os.system("rm -f ./example01.py")
os.system("rm -f ./example02.py")
os.system("rm -f ./example03.py")
os.system("rm -f ./example04.py")
os.system("rm -f ./example05.py")
os.system("rm -f ./example05_server.py")
os.system("rm -f ./example06.py")

os.system("rm -f ./example01_copy.json")
os.system("rm -f ./example02_copy.json")
os.system("rm -f ./example03_copy.json")
os.system("rm -f ./example04_copy.json")
os.system("rm -f ./example05_copy.json")
os.system("rm -f ./example06_copy.json")

os.system("python unify.py")

tests = [
    [1, "exec"],
    [2, "class"],
    [3, "exec"],
    [4, "exec"],
    [5, "class"],
    [5, "server"],
    [6, "exec"],
]

all_tests_ok = True
failed_tests = []

for test_number in range(0, len(tests)):
    print("Running example number %d\n----------" % tests[test_number][0])
    os.system("node %sapp_test.js %d %s" % (dirname, tests[test_number][0], tests[test_number][1]))

    if tests[test_number][1] != "server":
        f1 = "%sexample%02d.json" % (dirname, tests[test_number][0])
        f2 = "%sexample%02d_copy.json" % (dirname, tests[test_number][0])
    
        result = filecmp.cmp(f1, f2, shallow=False)
        if result:
            print(colored("Files %s and %s are identical." % (f1, f2), "green"))
        else:
            print(colored("!    ERROR: Files %s and %s are NOT identical!" % (f1, f2), "red"))
            all_tests_ok = False
            failed_tests.append(tests[test_number][0])
    
    server_add = ""
    if tests[test_number][1] == "server":
        server_add = "_server"

    f1 = "%sexample%02d%s.py" % (dirname, tests[test_number][0], server_add)
    f2 = "%sexample%02d%s_ref.py" % (dirname, tests[test_number][0], server_add)

    result = filecmp.cmp(f1, f2, shallow=False)
    if result:
        print(colored("Files %s and %s are identical." % (f1, f2), "green"))
    else:
        print(colored("!    ERROR: Files %s and %s are NOT identical!" % (f1, f2), "red"))
        all_tests_ok = False
        failed_tests.append(tests[test_number][0])

    print("----------\n")
    
if all_tests_ok:
    print(colored("ALL TESTS PASSED :)", "green"))
else:
    print(colored("SOME TESTS FAILED :(", "red"))
    print(colored(failed_tests, "red"))
