"""
Regression tests of the workflow editor code generator.

For every example ``exampleNN.json`` the script

1. rebuilds ``project.js`` from ``src/*.js`` (see ``unify.py``),
2. runs ``node app_test.js NN <mode>`` which loads the JSON, regenerates the
   JSON (``exampleNN_copy.json``) and the Python code (``exampleNN.py``),
3. compares the regenerated JSON with the original one (round-trip test) and
   the generated code with the reference ``exampleNN_ref.py``,
4. runs the additional Node unit tests listed in ``UNIT_TESTS``.

The script can be started from any directory. It exits with a non-zero status
when any test fails, so it can be used in CI.

Requirements: ``node`` on ``PATH`` and the Node package ``jsonschema``
(``npm install`` in the repository root). ``termcolor`` is optional.
"""
import os
import sys
import filecmp
import subprocess

try:
    from termcolor import colored
except ImportError:  # termcolor is a cosmetic dependency only
    def colored(text, color):
        return text

dirname = os.path.dirname(os.path.realpath(__file__))

#: (example number, code generation mode) pairs; mode is one of exec|class|server
tests = [
    [1, "exec"],
    [2, "class"],
    [3, "exec"],
    [4, "exec"],
    [5, "class"],
    [5, "server"],
    [6, "exec"],
]

#: standalone Node unit test scripts (paths relative to this directory);
#: each script must exit with a non-zero status on failure
UNIT_TESTS = ["test_layout_json.js"]


def path(name):
    """
    :param str name: file name relative to the examples directory
    :return: absolute path of the file
    :rtype: str
    """
    return os.path.join(dirname, name)


def remove_generated_files():
    """Remove outputs of previous runs so that stale files cannot pass a comparison."""
    for number, mode in tests:
        suffix = "_server" if mode == "server" else ""
        for name in ("example%02d%s.py" % (number, suffix), "example%02d_copy.json" % number):
            if os.path.exists(path(name)):
                os.remove(path(name))


def compare(f1, f2):
    """
    Compare two files byte by byte and print the result.

    :param str f1: first file
    :param str f2: second file
    :return: True when the files are identical
    :rtype: bool
    """
    if os.path.exists(f2) and filecmp.cmp(f1, f2, shallow=False):
        print(colored("Files %s and %s are identical." % (f1, f2), "green"))
        return True
    print(colored("!    ERROR: Files %s and %s are NOT identical!" % (f1, f2), "red"))
    return False


def main():
    """
    Run all tests.

    :return: process exit status (0 when all tests passed)
    :rtype: int
    """
    remove_generated_files()
    subprocess.run([sys.executable, "unify.py"], cwd=dirname, check=True)

    failed_tests = []

    for number, mode in tests:
        print("Running example number %d\n----------" % number)
        subprocess.run(["node", path("app_test.js"), str(number), mode], cwd=dirname)

        if mode != "server":
            if not compare(path("example%02d.json" % number), path("example%02d_copy.json" % number)):
                failed_tests.append(number)

        suffix = "_server" if mode == "server" else ""
        if not compare(path("example%02d%s.py" % (number, suffix)), path("example%02d%s_ref.py" % (number, suffix))):
            failed_tests.append(number)
        print("----------\n")

    for script in UNIT_TESTS:
        print("Running unit tests %s\n----------" % script)
        if subprocess.run(["node", path(script)], cwd=dirname).returncode != 0:
            print(colored("!    ERROR: unit tests %s failed" % script, "red"))
            failed_tests.append(script)
        print("----------\n")

    if not failed_tests:
        print(colored("ALL TESTS PASSED :)", "green"))
        return 0
    print(colored("SOME TESTS FAILED :(", "red"))
    print(colored(failed_tests, "red"))
    return 1


if __name__ == '__main__':
    sys.exit(main())
