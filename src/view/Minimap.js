/**
 * Minimap: an overview of the whole workflow in the bottom-right corner of the canvas.
 *
 * Responsibility
 * --------------
 * ``CanvasMinimap`` shows the canvas graph scaled down to fit a small box, with a rectangle marking the part of
 * the workflow visible in the editor. Clicking or dragging in the minimap moves the visible part there. It can be
 * hidden (View menu; remembered by the browser).
 *
 * Model -> view sync
 * ------------------
 * The minimap is a second, non-interactive JointJS paper rendering the same graph as the canvas, so it follows
 * every change of the cells automatically. Its scale is adapted when the content changes (deferred to the next
 * animation frame), and the viewport rectangle follows the zooming and panning of the canvas paper ('scale' and
 * 'translate' events).
 *
 * JointJS features used
 * ---------------------
 * a second ``dia.Paper`` on the same ``dia.Graph`` (``interactive: false``), ``transformToFitContent``,
 * ``localToPaperPoint``/``paperToLocalPoint`` and the paper ``scale``/``translate`` events.
 */

/** Size of the minimap box (px). */
const MINIMAP_WIDTH = 220;
const MINIMAP_HEIGHT = 150;

class CanvasMinimap{
    /**
     * @param {CanvasView} canvas - the canvas whose graph and paper are shown
     */
    constructor(canvas){
        this.canvas = canvas;
        this.el = document.createElement('div');
        this.el.className = 'canvas_minimap';
        this.el.title = 'Overview: click or drag to move the view';
        let paper_el = document.createElement('div');
        let viewport = document.createElement('div');
        viewport.className = 'canvas_minimap_viewport';
        this.el.appendChild(paper_el);
        this.el.appendChild(viewport);
        this.viewport_el = viewport;
        canvas.el.parentElement.appendChild(this.el);

        this.paper = new joint.dia.Paper({
            el: paper_el,
            model: canvas.graph,
            cellViewNamespace: joint.shapes,
            width: MINIMAP_WIDTH,
            height: MINIMAP_HEIGHT,
            interactive: false,
            async: false,
            sorting: joint.dia.Paper.sorting.APPROX
        });
        /** Pending deferred fit (animation frame id), or null. @type {number|null} */
        this.pending = null;
        /** True while the user drags in the minimap. @type {boolean} */
        this.dragging = false;

        let graph = canvas.graph;
        graph.on('reset add remove change:position change:size', () => this.scheduleFit());
        canvas.paper.on('scale translate resize', () => this.updateViewport());
        this.el.addEventListener('pointerdown', evt => {
            this.dragging = true;
            this.el.setPointerCapture(evt.pointerId);
            this.centerAt(evt);
        });
        this.el.addEventListener('pointermove', evt => {
            if(this.dragging)
                this.centerAt(evt);
        });
        this.el.addEventListener('pointerup', () => { this.dragging = false; });
        // the canvas changes its size with the window and when the side panels are collapsed or resized
        new ResizeObserver(() => this.updateViewport()).observe(canvas.el);
        this.setVisible(canvas.loadOption('mupif_we_show_minimap', true), false);
    }

    /**
     * Show or hide the minimap.
     *
     * @param {boolean} visible
     * @param {boolean} [remember=true] - store the choice in the browser
     */
    setVisible(visible, remember=true){
        this.visible = visible;
        this.el.style.display = visible ? '' : 'none';
        if(remember)
            this.canvas.saveOption('mupif_we_show_minimap', visible);
        if(visible)
            this.fit();
    }

    /**
     * Fit the content into the minimap in the next animation frame (several requests are merged).
     */
    scheduleFit(){
        if(this.pending === null && this.visible)
            this.pending = requestAnimationFrame(() => {
                this.pending = null;
                this.fit();
            });
    }

    /**
     * Scale the minimap so that the whole workflow fits into it and redraw the viewport rectangle.
     */
    fit(){
        if(this.canvas.graph.getCells().length)
            this.paper.transformToFitContent({padding: 8, minScale: 0.005, maxScale: 0.5,
                horizontalAlign: 'middle', verticalAlign: 'middle'});
        this.updateViewport();
    }

    /**
     * Draw the rectangle of the part of the workflow visible on the canvas.
     */
    updateViewport(){
        if(!this.visible)
            return;
        let main = this.canvas.paper;
        let rect = main.el.getBoundingClientRect();
        // visible area in canvas (local) coordinates -> minimap paper coordinates
        let a = main.clientToLocalPoint(rect.left, rect.top);
        let b = main.clientToLocalPoint(rect.right, rect.bottom);
        let p = this.paper.localToPaperPoint(a);
        let q = this.paper.localToPaperPoint(b);
        let x = Math.max(0, p.x), y = Math.max(0, p.y);
        let w = Math.min(MINIMAP_WIDTH, q.x) - x, h = Math.min(MINIMAP_HEIGHT, q.y) - y;
        Object.assign(this.viewport_el.style, {
            left: x + 'px', top: y + 'px', width: Math.max(4, w) + 'px', height: Math.max(4, h) + 'px'
        });
    }

    /**
     * Move the canvas view so that the point of the minimap under the pointer is in the middle of the canvas.
     *
     * @param {PointerEvent} evt
     */
    centerAt(evt){
        let box = this.el.getBoundingClientRect();
        let local = this.paper.paperToLocalPoint(evt.clientX - box.left, evt.clientY - box.top);
        let main = this.canvas.paper;
        let rect = main.el.getBoundingClientRect();
        let s = main.scale().sx;
        main.translate(rect.width / 2 - local.x * s, rect.height / 2 - local.y * s);
    }
}
