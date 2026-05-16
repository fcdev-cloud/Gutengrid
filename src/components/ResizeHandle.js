import { useRef, useEffect } from '@wordpress/element';

const COLS = 12;

const getGridInner = ( element ) => {
    let node = element.parentElement;
    while ( node ) {
        if ( node.classList.contains( 'gg__inner' ) ) return node;
        node = node.parentElement;
    }
    return null;
};

const snapToColumn = ( mouseX, gridRect, type ) => {
    const colWidth = gridRect.width / COLS;
    const relativeX = mouseX - gridRect.left;
    
    // Calculate the nearest grid line (0 to 12)
    const line = Math.round( relativeX / colWidth );
    
    if ( type === 'start' ) {
        // Line 0 is actually column start 1
        return Math.max( 1, Math.min( COLS, line + 1 ) );
    } else {
        // Line 1 is the end of column 1 (track 2)
        // Line 12 is the end of column 12 (track 13)
        return Math.max( 2, Math.min( COLS + 1, line + 1 ) );
    }
};

export default function ResizeHandle( { side, className, onUpdate } ) {
    const handleRef = useRef();
    
    // We store the 'active' state in a Ref so the Window listeners 
    // can access the latest values without being re-registered.
    const dragData = useRef({
        isDragging: false,
        gridRect: null,
        lastSnapped: null,
        className: className,
    });

    // Update the Ref whenever the prop className changes
    useEffect(() => {
        dragData.current.className = className;
    }, [className]);

    useEffect(() => {
        // Get the actual document the handle lives in (the iframe)
        const localDoc = handleRef.current?.ownerDocument || document;
        // Get the top-level document (the main editor UI)
        const topDoc = window.top.document;

        const onMouseMove = (e) => {
            // Only execute if this specific handle instance is the one being dragged
            if (!dragData.current.isDragging || !dragData.current.gridRect) return;
            
            const snapped = snapToColumn(
                e.clientX,
                dragData.current.gridRect,
                side === 'left' ? 'start' : 'end'
            );

            if (snapped !== dragData.current.lastSnapped) {
                dragData.current.lastSnapped = snapped;
                onUpdate(side, snapped, dragData.current.className);
            }
        };


        const onMouseUp = () => {
        // Check the Ref directly
            console.log('Mouse up detected. Was dragging:', dragData.current.isDragging);
            if (dragData.current.isDragging) {
                dragData.current.isDragging = false;
                document.body.classList.remove('is-resizing-gutengrid');
            }
        };
        // Attach listeners to BOTH documents
        localDoc.addEventListener('mousemove', onMouseMove);
        localDoc.addEventListener('mouseup', onMouseUp);

        return () => {
            localDoc.removeEventListener('mousemove', onMouseMove);
            localDoc.removeEventListener('mouseup', onMouseUp);
            topDoc.removeEventListener('mouseup', onMouseUp);
        };
    }, [side, onUpdate]);

    const onMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const gridInner = getGridInner(handleRef.current);
        if (!gridInner) return;

        dragData.current.gridRect = gridInner.getBoundingClientRect();
        dragData.current.isDragging = true;
        dragData.current.lastSnapped = null;

        document.body.classList.add('is-resizing-gutengrid');
    };

    return (
        <div
            ref={handleRef}
            onMouseDown={onMouseDown}
            className={`gutengrid-resize-handle gutengrid-resize-handle--${side}`}
            aria-hidden="true"
        />
    );
}