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
                        "uuid": {"type": "string"},
                        "parent_uuid": {"type": "string"},
                    },
                    "required": ["classname", "uuid", "parent_uuid"]
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