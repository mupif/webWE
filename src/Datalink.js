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
            'classname': this.getClassName(),
            'ds1_uid': this.slot1.getUID(),
            'ds2_uid': this.slot2.getUID()
        };
    }

    getDatalinkHtml(){
        let div_a;
        let div_b;
        let br_a;
        let br_b;
        //
        let div_workflow = document.getElementById('workflowSubContainer');
        let br_workflow = div_workflow.getBoundingClientRect();
        let s_x = br_workflow.x;
        let s_y = br_workflow.y;
        //
        div_a = document.getElementById('point_'+this.slot1.getUID());
        div_b = document.getElementById('point_'+this.slot2.getUID());
        br_a = div_a.getBoundingClientRect();
        br_b = div_b.getBoundingClientRect();
        //
        // return this.createDatalinkSimpleLine(br_a.x-s_x, br_a.y-s_y, br_b.x-s_x, br_b.y-s_y);
        return this.createDatalingSpline(br_a.x-s_x, br_a.y-s_y, br_b.x-s_x, br_b.y-s_y);
    }

    getDatalinkDiv(){
        return document.getElementById(this.id);
    }

    // createDatalinkSimpleDiv(x, y, length, angle) {
    //     let classname_add = '';
    //     if(selected_datalink === this)
    //         classname_add = '_selected';
    //
    //     let html = '';
    //     html += '' +
    //         '<div class="we_simple_datalink'+classname_add+'" id="'+this.id+'" style="' +
    //         'width: ' + length + 'px;' +
    //         'height: 0px;' +
    //         '-moz-transform: rotate(' + angle + 'rad);' +
    //         '-webkit-transform: rotate(' + angle + 'rad);' +
    //         '-o-transform: rotate(' + angle + 'rad);' +
    //         '-ms-transform: rotate(' + angle + 'rad);' +
    //         'top: ' + y + 'px;' +
    //         'left: ' + x + 'px;' +
    //         '" ' +
    //         'onmousedown="anyClick(event, \'\', \''+this.id+'\');"' +
    //         ' onmouseup="one_elem_check_disabling_propagation=false;">' +
    //         '</div>';
    //     return html;
    // }
    //
    // createDatalinkSimpleLine(x1, y1, x2, y2) {
    //     let a = x1 - x2,
    //         b = y1 - y2,
    //         c = Math.sqrt(a * a + b * b);
    //     let sx = (x1 + x2) / 2,
    //         sy = (y1 + y2) / 2;
    //     let x = sx - c / 2,
    //         y = sy;
    //     let alpha = Math.PI - Math.atan2(-b, a);
    //     return this.createDatalinkSimpleDiv(x, y, c, alpha);
    // }

    createDatalinkLineDiv(x, y, length, angle) {
        let html = '';
        html += '' +
            '<div class="we_datalink_sub" style="' +
            'width: ' + length + 'px;' +
            'height: 0;' +
            '-moz-transform: rotate(' + angle + 'rad);' +
            '-webkit-transform: rotate(' + angle + 'rad);' +
            '-o-transform: rotate(' + angle + 'rad);' +
            '-ms-transform: rotate(' + angle + 'rad);' +
            'top: ' + y + 'px;' +
            'left: ' + x + 'px;' +
            '" ' +
            'onmousedown="anyClick(event, \'\', \''+this.id+'\');"' +
            ' onmouseup="one_elem_check_disabling_propagation=false;"' +
            ' onmouseenter="datalinkHoverIn(\''+this.id+'\')"' +
            ' onmouseleave="datalinkHoverOut()">' +
            '</div>';
        return html;
    }

    createDatalinkSubLine(x1, y1, x2, y2){
        let a = x1 - x2,
            b = y1 - y2,
            c = Math.sqrt(a * a + b * b);
        let sx = (x1 + x2) / 2,
            sy = (y1 + y2) / 2;
        let x = sx - c / 2,
            y = sy;
        let alpha = Math.PI - Math.atan2(-b, a);
        return this.createDatalinkLineDiv(x, y, c, alpha);
    }

    createDatalingSpline(x1, y1, x2, y2){
        let classname_add = '';
        if(selected_datalink === this)
            classname_add = '_selected';

        let html = '<div class="we_datalink'+classname_add+'" id="'+this.id+'">';


        if(y1 === y2)
            html += this.createDatalinkSubLine(x1, y1, x2, y2);
        else{
            let dx = x2-x1;
            let dy = y2-y1;
            let diag_len = Math.sqrt(dx*dx+dy*dy);
            let div_elem_len = 5;

            let x1_, x2_, y1_, y2_;
            let division = Math.ceil(diag_len/div_elem_len);
            let d_alpha = Math.PI/division;
            let xc = 0.5*(x1+x2);
            let yc = 0.5*(y1+y2);
            let alpha=-Math.PI/2.;

            for(let iloc = 0; iloc < division;iloc++) {
                x1_ = x1+dx/division*iloc;
                y1_ = yc+Math.sin(alpha)*0.5*dy;
                x2_ = x1+dx/division*(iloc+1);
                y2_ = yc+Math.sin(alpha+d_alpha)*0.5*dy;
                html += this.createDatalinkSubLine(x1_, y1_, x2_, y2_);
                alpha += d_alpha;
            }

        }



        html += '<div>';
        return html;
    }



}

