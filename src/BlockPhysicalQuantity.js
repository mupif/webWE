class BlockPhysicalQuantity extends Block{
    constructor(editor, parent_block, value, units){
        super(editor, parent_block);
        this.value = value;
        this.units = units;
        this.name = 'PhysicalQuantity';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.PhysicalQuantity', false, 'mupif.ValueType.Scalar'));
    }

    generateCodeName(all_blocks, base_name='constant_physical_quantity_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.Physics.PhysicalQuantities.PhysicalQuantity("+this.value+", '"+this.units+"')");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
    }

    getExecutionCode(indent=0, time="", timestep="tstep"){
        return [];
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_value', '', 'Value'), 'Set');
        this.getMenu().addItemIntoSubMenu(new VisualMenuItem('set_units', '', 'Units'), 'Set');
    }

    setValue(val){
        this.value = val;
        this.setDataSlotText(this.output_slots[0], "value = "+this.value);
    }

    myquery_proceed(action, p1=null, p2=null){
        if(action==='set_value') {
            this.value = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Value set to "'+this.value+'"', 'green');
        }
        if(action==='set_units') {
            this.units = document.getElementById('myQuery_temp_val').value;
            logToMyConsole('Units set to "'+this.units+'"', 'green');
        }
        super.myquery_proceed(action, p1, p2);
    }

    modificationQuery(keyword, value = null) {
        if(keyword === 'set_value'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Set Value:</b>&nbsp;';
            q_html += '<input type="text" id="myQuery_temp_val" value="'+this.value+'" style="width:100px;">';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }
        if(keyword === 'set_units'){
            myquery_temp_instance = this;
            let q_html = '';
            q_html += '<b>Choose Units:</b>&nbsp;';
            q_html += '<select id="myQuery_temp_val">';
            for(let i=0;i<mupif_Units.length;i++) {
                q_html += '<option value="'+mupif_Units[i]+'"';
                if(this.units === mupif_Units[i])
                    q_html += ' selected';
                q_html += '>'+mupif_Units[i]+'</option>';
            }
            q_html += '</select>';
            q_html += '&nbsp;<button onclick="myquery_temp_instance.myquery_proceed(\''+keyword+'\');">OK</button>';

            myQuery_show(q_html);
        }


        super.modificationQuery(keyword, value);
    }

    getClassName() {
        return 'BlockConstPhysicalQuantity';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['value'] = this.value;
        dict['units'] = this.units;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_physicalquantity';
    }

    getBlockHtmlName(){
        return 'Physical Quantity';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>\'' + this.value + '\'</b>';
        html += '<br>';
        html += 'Units = <b>\'' + this.units + '\'</b>';

        html += '</div>';
        return html;
    }

}