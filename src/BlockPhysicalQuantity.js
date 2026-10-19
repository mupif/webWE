class BlockPhysicalQuantity extends Block{
    constructor(editor, parent_block, value, units){
        super(editor, parent_block);
        this.value = value;
        this.units = units;
        this.name = 'PhysicalQuantity';

        this.addOutputSlot(new Slot(this, 'out', 'value', 'value = '+this.value, 'mupif.PhysicalQuantity', false, 'mupif.DataID.ID_None', '', '', '', units, 'Scalar'));
    }

    generateCodeName(all_blocks, base_name='constant_physical_quantity_'){
        super.generateCodeName(all_blocks, base_name);
    }

    generateOutputDataSlotGetFunction(slot, time=""){
        return "self." + this.getCodeName();
    }

    getInitCode(indent=0){
        let code = super.getInitCode();
        code.push("self."+this.code_name+" = "+this.value+"*mupif.U."+this.units+"");
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
     * @returns {EditableParameter[]} value and units of the quantity
     */
    getParameters(){
        return [
            {key: 'value', label: 'Value', type: 'text', value: String(this.value)},
            {key: 'units', label: 'Units', type: 'select', value: this.units, options: parameterOptions(mupif_Units)}
        ];
    }

    /**
     * The output slot carries a copy of the units (set when the block is constructed, e.g., from a project
     * file), which is updated as well.
     *
     * @param {string} key - 'value' or 'units'
     * @param {string} value
     * @returns {boolean} true when the value was accepted
     */
    setParameter(key, value){
        if(key === 'value' && String(value).trim() !== ''){
            this.value = String(value).trim();
            return true;
        }
        if(key === 'units'){
            this.units = value;
            this.getSlots('out')[0].units = value;
            return true;
        }
        return false;
    }

    defineMenu() {
        super.defineMenu();
        this.addMoveMenuItems();
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
        return 'we_block we_block_data';
    }

    getBlockHtmlName(){
        return 'Quantity';
    }

    getBlockHtml_params(){
        let html = '';
        html += '<div class="bl_params">';
        html += 'Value = <b>' + this.value + '</b>';
        html += '<br>';
        html += 'Units = <b>' + this.units + '</b>';

        html += '</div>';
        return html;
    }

}