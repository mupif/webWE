class BlockInputFile extends Block{
    constructor(editor, parent_block, filename){
        super(editor, parent_block);
        this.filename = filename;
        this.name = 'InputFile';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'filename = '+this.filename, 'mupif.PyroFile', false, 'None'));
    }

    generateCodeName(all_blocks, base_name='input_file_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.PyroFile(filename='"+this.filename+"', mode='rb')");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        //return [];
        let code = super.getInitializationCode();
        code.push("self.daemon.register(self."+this.code_name+")");
        return push_indents_before_each_line(code, indent);
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_value', '', 'Input&nbsp;file'), 'Set');
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_file') {
            this.value = document.getElementById('myQuery_temp_val').value;
            console.log('Value set to "'+this.filename+'"');
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        if(keyword === 'set_file'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Input file:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.filename+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }

        super.modificationQuery(keyword, value);
    }

    getClassName() {
        return 'BlockInputFile';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['filename'] = this.filename;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_input_file';
    }

    getBlockHtmlName(){
        return 'Input File';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Filename = <b>\'' + this.filename + '\'</b>';

        html += '</div>';
        return html;
    }

}