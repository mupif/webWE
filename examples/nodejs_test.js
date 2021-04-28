
function deepEqual(x, y) {
    return (x && y && typeof x === 'object' && typeof y === 'object') ?
        (Object.keys(x).length === Object.keys(y).length) &&
        Object.keys(x).reduce(function(isEqual, key) {
            return isEqual && deepEqual(x[key], y[key]);
        }, true) : (x === y);
}

const project_json_schema = require("../project_json_schema");

const process = require("process");

if(process.argv.length >= 3) {

    let ex_number = parseInt(process.argv[2]);

    let filename_base = "" + ex_number;
    if(ex_number < 10)
        filename_base = "0" + filename_base;
    filename_base = "example" + filename_base;


    const fs = require("fs");

    eval(fs.readFileSync("../project.js") + "");

    let editor = main();

    console.log("Loading JSON file '" + filename_base + ".json'");
    let json_data = JSON.parse(fs.readFileSync(filename_base + ".json"));

    let Validator = require("jsonschema").Validator;
    let v = new Validator();
    let res = v.validate(json_data, project_json_schema.schema);

    if(res.valid) {
        console.log("Successful validation of JSON against schema.");

        editor.loadFromJsonData(json_data);

        let code = editor.getExecutionCode();

        console.log("Writing generated code to file '" + filename_base + ".py'");
        fs.writeFile(filename_base + ".py", code, err => {
            if (err) {
                console.error(err);
                return;
            }
        });

        let json_str = JSON.stringify(editor.getJSON(), null, 4);

        console.log("Writing generated JSON to file '" + filename_base + "_copy.json'");
        fs.writeFile(filename_base + "_copy.json", json_str, err => {
            if (err) {
                console.error(err);
                return;
            }
        });

    }else{
        console.log("Unsuccessful validation of JSON against schema!");
        console.log(res);
    }
}