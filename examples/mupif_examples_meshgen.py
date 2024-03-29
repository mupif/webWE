import sys
sys.path.append("C:\Projects\mupif_fork_stan")

# This file is a copy of file 'meshgen.py' in MuPIF project to allow running examples in this directory.
#
from builtins import range
import mupif
from mupif import cell
from mupif import vertex

# debug flag
debug = 0


def meshgen(origin, size, nx, ny, tria=False):
    """
    Generates a simple mesh on rectangular domain
    Params:
      origin(tuple): x,y coordinates of origin (lower left corner)
      size(tuple): tuple containing size in x and y directions
      nx(int): number of elements in x direction
      ny(int): number of elements in y direction
      tria(bool): when True, triangular mesh generated, quad otherwise
    """
    dx = size[0] / nx
    dy = size[1] / ny

    num = 0
    vertexlist = []
    celllist = []

    mesh = mupif.UnstructuredMesh()
    # generate vertices
    for ix in range(nx + 1):
        for iy in range(ny + 1):
            if debug:
                print("Adding vertex %d: %f %f %f " % (num, ix * dx, iy * dy, 0.0))
            vertexlist.append(
                vertex.Vertex(number=num, label=num, coords=(origin[0] + 1.0 * ix * dx, origin[1] + 1.0 * iy * dy, 0.0)))
            num = num + 1

    # generate cells
    num = 1
    for ix in range(nx):
        for iy in range(ny):
            si = iy + ix * (ny + 1)  # index of lower left node
            if not tria:
                if debug:
                    print("Adding quad %d: %d %d %d %d" % (num, si, si + ny + 1, si + ny + 2, si + 1))
                celllist.append(cell.Quad_2d_lin(mesh=mesh, number=num, label=num, vertices=(si, si + ny + 1, si + ny + 2, si + 1)))
                num = num + 1
            else:
                if debug:
                    print("Adding tria %d: %d %d %d" % (num, si, si + ny + 1, si + ny + 2))
                celllist.append(cell.Triangle_2d_lin(mesh=mesh, number=num, label=num, vertices=(si, si + ny + 1, si + ny + 2)))
                num = num + 1
                if debug:
                    print("Adding tria %d: %d %d %d" % (num, si, si + ny + 2, si + 1))
                celllist.append(cell.Triangle_2d_lin(mesh=mesh, number=num, label=num, vertices=(si, si + ny + 2, si + 1)))
                num = num + 1

    mesh.setup(vertexlist, celllist)
    return mesh

