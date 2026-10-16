let datalink_id = 0;
function generateNewDatalinkID(){
    datalink_id += 1;
    return 'datalink_'+datalink_id;
}

class Datalink{
    constructor(slot1, slot2) {
        this.id = generateNewDatalinkID();
        this.slot1 = slot1;
        this.slot2 = slot2;
    }

    getClassName(){
        return 'DataLink';
    }

    getDictForJSON(){
        return {
            'ds1_uid': this.slot1.getUID(),
            'ds2_uid': this.slot2.getUID()
        };
    }



}

