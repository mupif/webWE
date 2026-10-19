class BlockProperty extends Block{
    constructor(editor, parent_block, value, property_id, value_type, units){
        super(editor, parent_block);
        this.value = value;
        this.property_id = property_id;
        this.value_type = value_type;
        this.units = units;
        this.name = 'Property';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.Property', false, this.property_id, '', '', '', units, this.value_type));
    }

    generateCodeName(all_blocks, base_name='constant_property_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = mupif.property.ConstantProperty(value="+this.value+", propID="+this.property_id+", valueType="+this.value_type+", unit=mupif.U."+this.units+", time=None)");
        return push_indents_before_each_line(code, indent);
    }

    getInitializationCode(indent=0, metaDataStr="{}"){
        return [];
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
     * @returns {EditableParameter[]} value, units, property ID and value type of the property (the DataID and
     *          ValueType are shown without their ``mupif.DataID.``/``mupif.ValueType.`` prefixes)
     */
    getParameters(){
        return [
            {key: 'value', label: 'Value', type: 'text', value: String(this.value)},
            {key: 'units', label: 'Units', type: 'select', value: this.units, options: parameterOptions(mupif_Units)},
            {key: 'property_id', label: 'Property ID', type: 'select', value: this.property_id.replace('mupif.DataID.', ''),
                options: parameterOptions(mupif_DataID)},
            {key: 'value_type', label: 'Value type', type: 'select', value: this.value_type.replace('mupif.ValueType.', ''),
                options: parameterOptions(mupif_ValueType)}
        ];
    }

    /**
     * The output slot carries copies of the units, property ID and value type (set when the block is
     * constructed, e.g., from a project file), which are updated as well.
     *
     * @param {string} key - 'value', 'units', 'property_id' or 'value_type'
     * @param {string} value - for 'property_id' and 'value_type' without the mupif prefix
     * @returns {boolean} true when the value was accepted
     */
    setParameter(key, value){
        let slot = this.getSlots('out')[0];
        if(key === 'value' && String(value).trim() !== ''){
            this.value = String(value).trim();
            return true;
        }
        if(key === 'units'){
            this.units = slot.units = value;
            return true;
        }
        if(key === 'property_id'){
            this.property_id = slot.obj_type = 'mupif.DataID.' + value;
            return true;
        }
        if(key === 'value_type'){
            this.value_type = slot.value_type = 'mupif.ValueType.' + value;
            return true;
        }
        return false;
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
    }

    getClassName() {
        return 'BlockConstProperty';
    }

    getDictForJSON() {
        let dict = super.getDictForJSON();
        dict['value'] = this.value;
        dict['units'] = this.units;
        dict['propID'] = this.property_id;
        dict['valueType'] = this.value_type;
        return dict;
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getBlockHtmlClass(){
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Property';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>' + this.value + '</b>';
        html += '<br>';
        html += 'Units = <b>' + this.units + '</b>';
        html += '<br>';
        html += 'ValueType = <b>' + this.value_type.replace('mupif.ValueType.', '') + '</b>';
        html += '<br>';
        html += 'PropertyID = <b>' + this.property_id.replace('mupif.DataID.', '') + '</b>';

        html += '</div>';
        return html;
    }

}