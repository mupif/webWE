let slot_id = 1;

function generateNewSlotID(){
    let found = false;
    let name = '';
    while (!found) {
        slot_id += 1;
        name = 's'+slot_id;
        found = true;
        let slots = editor.workflowblock.getSlotsRecursive();
        for(let i=0;i<slots.length;i++) {
            if (slots[i].id === name) {
                found = false;
            }
        }
    }
    return name;
}

class Slot{
    /**
     * 
     * @param {Block} parent_block
     * @param {string} inout
     * @param {string} name
     * @param {string} text
     * @param {string} type
     * @param {boolean} required
     * @param {string|null} obj_type
     * @param {string} obj_id
     * @param {string} uid
     * @param {string} set_at
     * @param {string} units
     * @param {string} value_type
     */
    constructor(parent_block, inout, name, text, type, required=true, obj_type=null, obj_id='', uid='', set_at='', units='', value_type=''){
        this.id = generateNewSlotID();
        if(uid !== '')
            this.id = uid;

        this.code_name = name;
        this.name = name;
        this.text = text;
        this.parent_block = parent_block;
        // this.code_name = "";
        this.units = units;
        this.value_type = value_type;

        this.type = type;
        this.required = required;
        this.obj_id = obj_id;
        this.obj_type = obj_type;
        this.inout = inout;
        this.max_connections = 999;
        if(this.inout === 'in')
            this.max_connections = 1;
        this.external = false;
        
        this.set_at = set_at;
    }

    connected(){
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++)
            if(all_datalinks[i].slot1 === this || all_datalinks[i].slot2 === this)
                return true;
        return false;
    }

    getNumConnections(){
        let num = 0;
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++)
            if(all_datalinks[i].slot1 === this || all_datalinks[i].slot2 === this)
                num++;
        return num;
    }

    getLinkedDataSlot(){
        if(this.inout === 'out' && this.external === false)
            console.log('Warning: function getLinkedDataSlot should be used only for input dataslots!');
        let all_datalinks = this.getParentBlock().editor.datalinks;
        for(let i=0;i<all_datalinks.length;i++) {

            if (all_datalinks[i].slot2 === this)
                return all_datalinks[i].slot1;
            // following two lines should never be used due to the fact, that slot1 of each datalink should be an output dataslot
            if (all_datalinks[i].slot1 === this)
                return all_datalinks[i].slot2;
        }
        return null;
    }

    getDataID(){return this.obj_type;}

    getObjectID(){return this.obj_id;}

    getParentBlock(){return this.parent_block;}

    getCodeRepresentation(){return "self." + this.code_name;}
    
    getUnits(){return this.units;}

    getUID(){return this.id;}

    getName(){return this.name;}

    getClassName(){return 'Slot';}

    getValueType(){return this.value_type;}

    getDictForJSON(){
        return {
            'classname': this.getClassName(),
            'name': this.name,
            'type': this.type,
            'obj_type': this.obj_type,
            'obj_id': this.obj_id,
            'inout': this.inout,
            'uid': this.getUID()
        };
    }

    // #########################
    // ########## NEW ##########
    // #########################

    getSlotHtml(){
        let temp_inout = inout_invertor(this.inout, this.external);

        let html = '';
        if(temp_inout === 'in')
            html = '<div class="slot_input" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;"><div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div>'+this.name+'</div>';
        if(temp_inout === 'out')
            html = '<div class="slot_output" id="'+this.id+'" onmousedown="anyClick(event, \'\',\'\',\''+this.id+'\');" onmouseup="editor.one_elem_check_disabling_propagation=false;">'+this.name+'<div class="slot_marker" onmousedown="datalink_creation_begin(\''+this.getUID()+'\')" onmouseup="datalink_creation_finalize(\''+this.getUID()+'\');"><div class="slot_point" id="point_'+this.getUID()+'"></div></div></div>';
        return html;
    }

    getDataslotDiv(){
        return document.getElementById(this.id);
    }
}

class SlotExt extends Slot{
    /**
     * 
     * @param {Block} parent_block
     * @param {string} inout
     * @param {string} name
     * @param {string} text
     * @param {string} type
     * @param {boolean} required
     * @param {string} obj_type
     * @param {string} uid
     */
    constructor(parent_block, inout, name, text, type, required=true, obj_type='None', uid=''){
        super(parent_block, inout, name, text, type, required, obj_type, name, uid);
        this.external = true;
    }

    getClassName(){return 'SlotExt';}
}

function inout_invertor(val, invert){
    if(val==='in'){
        if(invert)
            return 'out';
        return 'in';
    }
    if(val==='out'){
        if(invert)
            return 'in';
        return 'out';
    }
    return '';
}