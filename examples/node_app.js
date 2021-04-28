
const project_json_schema = require('../project_json_schema');

const process = require('process');

if(process.argv.length >= 3) {

    const fs = require('fs');

    eval(fs.readFileSync('../project.js') + '');

    let editor = main();

    console.log('Loading JSON file \'' + process.argv[2] + '\'');
    let json_data = JSON.parse(fs.readFileSync(process.argv[2]));

    let Validator = require('jsonschema').Validator;
    let v = new Validator();
    let res = v.validate(json_data, project_json_schema.schema);

    if(res.valid) {
        console.log('Successful validation of JSON against schema.');

        editor.loadFromJsonData(json_data);

        let code = editor.getExecutionCode();

        console.log('Writing generated code to file \'' + process.argv[3] + '\'');
        fs.writeFile(process.argv[3], code, err => {
            if (err) {
                console.error(err);
                return;
            }
        });

        // console.log(code);

    }else{
        console.log('Unsuccessful validation of JSON against schema!');
        console.log(res);
    }
}