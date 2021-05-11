module.exports = {
    schema : {
        "type": "object",
        "properties": {
            "blocks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "classname": {"type": "string"},
                        "uid": {"type": "string"},
                        "parent_uid": {"type": "string"},
                        "slot_in_uids": {"type": "array", "items": {"type": "string"}},
                        "slot_out_uids": {"type": "array", "items": {"type": "string"}},
                        "ext_slots": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "type": {"type": "string"},
                                    "obj_type": {"type": "string"},
                                    "obj_id": {"type": "string"},
                                    "inout": {"type": "string"},
                                    "uid": {"type": "string"}
                                },
                                "required": ["name", "type", "obj_type", "obj_id", "inout", "uid"]
                            }
                        },
                        "metadata": {
                            "type": "object",
                            "properties": {
                                "ClassName": {"type": "string"},
                                "ModuleName": {"type": "string"},
                                "Name": {"type": "string"},
                                "ID": {"type": "string"},
                                "Inputs": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "Name": {"type": "string"},
                                            "Type_ID": {"type": "string"},
                                            "Type": {"type": "string"},
                                            "Obj_ID": {"type": ["array", "string", "number"]},
                                            "Required": {"type": "boolean"}
                                        },
                                        "required": ["Name", "Type_ID", "Type", "Obj_ID", "Required"]
                                    }
                                },
                                "Outputs": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "Name": {"type": "string"},
                                            "Type_ID": {"type": "string"},
                                            "Type": {"type": "string"},
                                            "Obj_ID": {"type": ["array", "string", "number"]}
                                        },
                                        "required": ["Name", "Type_ID", "Type", "Obj_ID"]
                                    }
                                },
                                "Execution_settings": {
                                    "type": "object",
                                    "properties": {
                                        "Type": {"type": "string", "enum": ["Local", "Distributed"]},
                                        "nshost": {"type": "string"},
                                        "nsport": {"type": "string"},
                                        "jobManName": {"type": "string"}
                                    },
                                    "anyOf": [
                                        {
                                            "properties": {
                                                "Type": { "const": "Local" }
                                            }
                                        },
                                        { "required": ["nshost", "nsport", "jobManName"] }
                                    ]
                                }
                            },
                            "required": ["ClassName", "ModuleName", "Name", "ID", "Inputs", "Outputs", "Execution_settings"]
                        },
                        "model_input_file_name": {"type": "string"},
                        "model_input_file_directory": {"type": "string"},
                    },
                    "required": ["classname", "uid", "parent_uid"],
                    "allOf": [
                        {
                            "anyOf": [
                                {
                                    "not": {
                                        "properties": {
                                            "classname": { "const": "BlockWorkflow" }
                                        }
                                    }
                                },
                                { "required": ["ext_slots"] }
                            ]
                        },
                        {
                            "anyOf": [
                                {
                                    "properties": {
                                        "classname": { "const": "BlockWorkflow" }
                                    }
                                },
                                { "required": ["slot_in_uids", "slot_out_uids"] }
                            ]
                        },
                        {
                            "anyOf": [
                                {
                                    "not": {
                                        "properties": {
                                            "classname": { "const": "BlockModel" }
                                        }
                                    }
                                },
                                { "required": ["metadata", "model_input_file_name", "model_input_file_directory"] }
                            ],
                        }
                    ]
                }
            },
            "datalinks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ds1_uid": {"type": "string"},
                        "ds2_uid": {"type": "string"},
                    },
                    "required": ["ds1_uid", "ds2_uid"]
                }
            },
            "settings": {
                "type": "object",
                "properties": {
                    "settings_project_name": {"type": "string"},
                    "settings_project_classname": {"type": "string"},
                    "settings_project_id": {"type": "string"},
                },
                "required": ["settings_project_name", "settings_project_classname", "settings_project_id"]
            },
            "required": ["blocks", "datalinks", "settings"]
        }
    }
};