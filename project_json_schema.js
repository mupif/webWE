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
                                            "Obj_ID": {"type": ["array", "string"]},
                                            "Required": {"type": "boolean"},
                                            "Set_at": {"type": "string", "enum": ["initialization", "timestep"]}
                                        },
                                        "required": ["Name", "Type_ID", "Type", "Required", "Set_at"]
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
                                        "required": ["Name", "Type_ID", "Type"]
                                    }
                                },
                                "Execution_settings": {
                                    "type": "object",
                                    "properties": {
                                        "Type": {"type": "string", "enum": ["Local", "Distributed"]},
                                        "nshost": {"type": "string"},// optional
                                        "nsport": {"type": "string"},// optional
                                        "jobManName": {"type": "string"}
                                    },
                                    "anyOf": [
                                        {
                                            "properties": {
                                                "Type": { "const": "Local" }
                                            }
                                        },
                                        { "required": ["jobManName"] }
                                    ]
                                }
                            },
                            "required": ["ClassName", "ModuleName", "Name", "ID", "Inputs", "Outputs", "Execution_settings"]
                        },
                        //"model_input_file_name": {"type": "array"},
                        "model_working_directory": {"type": "string"},
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
                                { "required": ["metadata", "model_working_directory"] }
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
                    "project_name": {"type": "string"},
                    "project_classname": {"type": "string"},
                    "project_id": {"type": "string"},
                    "project_nshost": {"type": "string"},// optional
                    "project_nsport": {"type": "string"},// optional
                    "connection_type": {"type": "string", "enum": ["Local", "Distributed"]},// valid in case of class workflow
                    "jobman_settings": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "server_host": {"type": "string"},
                            "server_port": {"type": "string"},
                            "nshost": {"type": "string"},// optional
                            "nsport": {"type": "string"}// optional
                        },
                        "required": ["name", "server_host", "server_port"]
                    },
                    "script_name_base": {"type": "string"}
                },
                "required": ["project_name", "project_classname", "project_id", "connection_type"]
            },
            "required": ["blocks", "datalinks", "settings"]
        }
    }
};