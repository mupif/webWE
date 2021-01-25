<?php
if(isset($_GET['action'])){
    $action = $_GET['action'];
    if($action == 'get_metadata_from_json_file'){
        if(isset($_FILES['myfiles'])){
            $countfiles = count($_FILES['myfiles']['name']);
            for($i=0;$i<$countfiles;$i++) {
                $filename = $_FILES['myfiles']['name'][$i];
                $file_content = file_get_contents($_FILES["myfiles"]['tmp_name'][$i]);
                echo $file_content;
            }
        }
    }
    if($action == 'get_metadata_from_json_file_on_server'){
        if(isset($_GET['myfilename'])){
            $file_content = file_get_contents($_GET['myfilename']);
            echo $file_content;
        }
    }
}