/**
 * Zooming and panning of the workflow canvas.
 *
 * Responsibility
 * --------------
 * ``CanvasZoomPan`` changes the transformation (scale and translation) of the JointJS paper, which fills the
 * whole editor area:
 *
 * - the mouse wheel zooms in and out about the mouse pointer (also the pinch gesture of touchpads, which
 *   browsers report as wheel events with the Ctrl key);
 * - dragging the blank canvas pans it;
 * - ``zoomBy``, ``zoomTo``, ``fit`` serve the toolbar buttons.
 *
 * Model -> view sync
 * ------------------
 * The transformation is a property of the view only; it is not saved with the project and it is kept when the
 * canvas is rebuilt from the model.
 *
 * JointJS features used
 * ---------------------
 * ``dia.Paper`` transformations (``scale``, ``translate``, ``matrix``, ``clientToLocalPoint``,
 * ``transformToFitContent``) and the paper's blank pointer events.
 */

/** Smallest and largest zoom factor. */
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
/** Zoom factor change per toolbar click. */
const ZOOM_STEP = 1.2;

class CanvasZoomPan{
    /**
     * @param {joint.dia.Paper} paper - paper filling its host element
     * @param {function(number): void} [onChange] - called with the new scale after every zoom change
     */
    constructor(paper, onChange=null){
        this.paper = paper;
        this.onChange = onChange;
        /** Start of the current panning drag, or null. @type {{x: number, y: number, tx: number, ty: number}|null} */
        this.pan = null;

        paper.el.addEventListener('wheel', evt => this.onWheel(evt), {passive: false});
        paper.on('blank:pointerdown', evt => this.startPan(evt));
        paper.on('blank:pointermove', evt => this.movePan(evt));
        paper.on('blank:pointerup', () => this.endPan());
    }

    /** @returns {number} current zoom factor */
    getScale(){
        return this.paper.scale().sx;
    }

    /**
     * Zoom to the given factor, keeping the given point of the paper element fixed.
     *
     * @param {number} scale - new zoom factor (clamped to ZOOM_MIN..ZOOM_MAX)
     * @param {{x: number, y: number}} [fixed] - point in client coordinates which stays in place (default: center
     *        of the paper element)
     */
    zoomTo(scale, fixed=null){
        scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale));
        let rect = this.paper.el.getBoundingClientRect();
        if(fixed === null)
            fixed = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
        // the canvas point under ``fixed`` must stay under it: client = rect + translate + local * scale
        let local = this.paper.clientToLocalPoint(fixed.x, fixed.y);
        this.paper.scale(scale, scale);
        this.paper.translate(fixed.x - rect.left - local.x * scale, fixed.y - rect.top - local.y * scale);
        if(this.onChange)
            this.onChange(scale);
    }

    /**
     * Multiply the zoom factor.
     *
     * @param {number} factor - e.g., ZOOM_STEP to zoom in, 1/ZOOM_STEP to zoom out
     */
    zoomBy(factor){
        this.zoomTo(this.getScale() * factor);
    }

    /**
     * Show the whole workflow (never enlarged above 100 %).
     */
    fit(){
        if(this.paper.model.getCells().length === 0){
            this.paper.scale(1, 1);
            this.paper.translate(40, 56);
        }else{
            this.paper.transformToFitContent({
                // extra space at the top for the toolbar
                padding: {top: 56, right: 40, bottom: 40, left: 40},
                minScale: ZOOM_MIN, maxScale: 1, horizontalAlign: 'middle', verticalAlign: 'top'
            });
        }
        if(this.onChange)
            this.onChange(this.getScale());
    }

    /**
     * Wheel: zoom about the mouse pointer.
     *
     * @param {WheelEvent} evt
     */
    onWheel(evt){
        evt.preventDefault();
        // deltaMode 1 = lines (e.g., Firefox); pinch gestures report small pixel deltas with ctrlKey
        let delta = evt.deltaY * (evt.deltaMode === 1 ? 16 : 1);
        let factor = Math.exp(-delta * (evt.ctrlKey ? 0.01 : 0.0015));
        this.zoomTo(this.getScale() * factor, {x: evt.clientX, y: evt.clientY});
    }

    /** @param {Event} evt - pointer down on the blank canvas */
    startPan(evt){
        let t = this.paper.translate();
        this.pan = {x: evt.clientX, y: evt.clientY, tx: t.tx, ty: t.ty};
        this.paper.el.classList.add('panning');
    }

    /** @param {Event} evt - pointer move while panning */
    movePan(evt){
        if(this.pan === null)
            return;
        this.paper.translate(this.pan.tx + evt.clientX - this.pan.x, this.pan.ty + evt.clientY - this.pan.y);
    }

    /** End of panning. */
    endPan(){
        this.pan = null;
        this.paper.el.classList.remove('panning');
    }
}
