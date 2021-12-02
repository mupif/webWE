import mupif


class field_export_to_image(mupif.model.Model):
    def __init__(self, metadata={}):
        MD = {
            "ClassName": "field_export_to_image",
            "ModuleName": "field_export",
            "Name": "Field export to image",
            "ID": "field_export_to_image",
            "Description": "Exports MuPIF Field into an image file",
            "Version_date": "1.0.0, Jan 2021",
            "Inputs": [
                {"Name": "field", "Type": "mupif.Field", "Required": False, "Type_ID": "mupif.DataID.FID_Temperature", "Obj_ID": ""}
            ],
            "Outputs": [],
            "Execution_type": "Local"
        }
        mupif.model.Model.__init__(self, metadata=MD)
        self.updateMetadata(metadata)

        mupif.model.Model.__init__(self)
        self.field = None
        self.step_number = 0
        self.filename_base = "ImageField"

    def initialize(self, workdir='', metaData={}, validateMetaData=False, **kwargs):
        pass

    def setField(self, field, objectID=0):
        """
        :param mupif.field.Field field:
        :param objectID:
        :return:
        """
        self.field = field

    def solveStep(self, tstep, stageID=0, runInBackground=False):
        if self.field:
            if not self.step_number:
                if self.field.fieldID == mupif.DataID.FID_Temperature:
                    self.filename_base = "Fig_Temperature"
                if self.field.fieldID == mupif.DataID.FID_Displacement:
                    self.filename_base = "Fig_Displacement"

            self.step_number += 1
            self.field.plot2D(fileName="%s_%d" % (self.filename_base, self.step_number))

    def getCriticalTimeStep(self):
        return 1000.*mupif.U.s