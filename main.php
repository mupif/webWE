<html lang="en">
<head>
    <title>Workflow Editor</title>
    <link rel="stylesheet" href="./StyleWE.css">
    <link rel="stylesheet" href="./StyleWE_blocks.css">
    <link rel="stylesheet" href="./StyleMyQuery.css">

    <script type="text/javascript" src="src/Init.js"></script>
    <script type="text/javascript">
        <?php
        if(isset($_GET['example_id'])){
            echo 'example_id = '.intval($_GET['example_id']).';';
        }
        ?>
    </script>
    <script type="text/javascript" src="src/example_metadata.js"></script>
    <script type="text/javascript" src="src/myQuery.js"></script>
    <script type="text/javascript" src="src/mupifData.js"></script>
    <script type="text/javascript" src="src/helpers.js"></script>
    <script type="text/javascript" src="src/Menu.js"></script>
    <script type="text/javascript" src="src/Slot.js"></script>
    <script type="text/javascript" src="src/Block.js"></script>
    <script type="text/javascript" src="src/BlockWorkflow.js"></script>
    <script type="text/javascript" src="src/BlockPhysicalQuantity.js"></script>
    <script type="text/javascript" src="src/BlockProperty.js"></script>
    <script type="text/javascript" src="src/BlockTimeloop.js"></script>
    <script type="text/javascript" src="src/BlockDoWhile.js"></script>
    <script type="text/javascript" src="src/BlockModel.js"></script>
    <script type="text/javascript" src="src/Datalink.js"></script>
    <script type="text/javascript" src="src/WorkflowEditor.js"></script>
    <script type="text/javascript" src="src/Main.js"></script>

    <?php
    if(isset($_POST['file_upload'])){
        $file_content = file_get_contents($_FILES["json_file"]['tmp_name']);
        echo '<script type="text/javascript">loaded_json = '.$file_content.';</script>';
    }
    ?>

</head>
<body onload="main(true)" oncontextmenu="return false;" onkeydown="keyPress(event);">
<div id="myQuery_container">
    <div id="myQuery_curtain" onclick="myQuery_hide();"></div>
    <div id="myQuery_input"></div>
</div>
<table id="main_table" cellspacing="0">
    <tr>
        <td colspan="3"><div id="div_caption">MuPIF Workflow Editor and Code Generator</div></td>
    </tr>
    <tr>
        <td>
            <div id="menu_new">
                <div class="melem_separator">navigation:</div>
                <div class="melem" id="nav_editor" onclick="focusOnEditor();">Editor</div>
                <div class="melem" id="nav_settings" onclick="editor.selectSettingsAndUpdate();">Settings</div>
                <div class="melem" id="nav_models" onclick="focusOnModelList();">Models</div>


                <div class="melem_separator">menu:</div>
                <div class="melem">Project
                    <div class="msubmenu">
                        <div class="melem" onclick="editor.menu_download_json();">Save to JSON</div>
                        <div class="melem" id="">
                            <form action="" method="post" enctype="multipart/form-data" style="margin:0;padding:0;" id="form_json_data">
                                <label for="form_json_file_selector" style="display:block;width:100%;height:100%;">
                                    Load from JSON
                                    <input type="file" id="form_json_file_selector" name="json_file" style="display:none;width:100px;" onchange="document.getElementById('form_json_data').submit();">
                                </label>
                                <input type="hidden" value="Load from JSON" name="file_upload">
                            </form>
                        </div>
                        <div class="melem" onclick="editor.menu_download_exec_code();">Generate Python Execution code</div>
                        <div class="melem" onclick="editor.menu_download_class_code();">Generate Python Class code</div>
                    </div>
                </div>

            </div>
        </td>
        <td>
            <div id="workflowContainer" onmousedown="anyClick(event, '');" onmouseup="editor.one_elem_check_disabling_propagation=false;editor.generateWorkflowHtml();">
                <div id="workflowSubContainer">

                </div>
            </div>

            <div id="projectSettingsContainer">
                <div id="block_list_of_settings"></div>
            </div>
            <div id="modelListContainer">
                <div id="block_list_of_models"></div>
            </div>
        </td>
        <td>
            <div id="outerMessageContainer"><div id="messageContainer"></div></div>
        </td>
    </tr>
</table>
</body>
</html>
