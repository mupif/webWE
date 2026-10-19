class BlockInputFile extends Block{
    constructor(editor, parent_block, filename=""){
        super(editor, parent_block);
        this.filename = filename;
        this.name = 'InputFile';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'filename = '+this.filename, 'mupif.PyroFile', false, 'None', '', '', '', 'none'));
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

    /**
     * @returns {boolean} false; the block emits no execution code, its value is evaluated where a
     *                   consumer reads it, so it takes no part in the execution order
     */
    isExecutable(){
        return false;
    }

    getExecutionCode(indent=0, timestep="", solvefunc=false){
        return [];
    }

    /**
     * @returns {EditableParameter[]} name of the input file
     */
    getParameters(){
        return [{key: 'filename', label: 'File name', type: 'text', value: this.filename}];
    }

    /**
     * @param {string} key - 'filename'
     * @param {string} value
     * @returns {boolean} true when the value was accepted
     */
    setParameter(key, value){
        if(key === 'filename'){
            this.filename = String(value).trim();
            return true;
        }
        return false;
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
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