import { useRef, useEffect } from '@wordpress/element';
import { MAX_COLS, PREFIX } from '../../src/constants';
const getGridInner = ( element ) => {
    let node = element.parentElement;
    while ( node ) {
        if ( node.classList.contains( `${PREFIX}__inner` ) ) return node;
        node = node.parentElement;
    }
    return null;
};

const snapToColumn = ( mouseX, gridRect, type, cols ) => {
    const colWidth = gridRect.width / cols;
    const relativeX = mouseX - gridRect.left;
    
    // Calculate the nearest grid line (0 to maxCols)
    const line = Math.round( relativeX / colWidth );
    
    if ( type === 'start' ) {
        // Line 0 is actually column start 1
        return Math.max( 1, Math.min( cols, line + 1 ) );
    } else {
        // Line 1 is the end of column 1 (track 2)
        // Line X is the end of column max cols (track maxCols+1)
        return Math.max( 2, Math.min( cols + 1, line + 1 ) );
    }
};

export default function ResizeHandle( { side, className, onUpdate, cols = MAX_COLS } ) {
    const handleRef = useRef();

    // Using a Ref to store drag state so that mousemove handlers
    const dragData = useRef({
        isDragging: false,
        gridRect: null,
        lastSnapped: null,
        className: className,
        cols: cols,
    });

    // Update the Ref whenever the prop className changes
    useEffect(() => {
        dragData.current.className = className;
    }, [className]);

    useEffect(() => {
        dragData.current.cols = cols;
    }, [cols]);

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
                side === 'left' ? 'start' : 'end',
                dragData.current.cols
            );

            if (snapped !== dragData.current.lastSnapped) {
                dragData.current.lastSnapped = snapped;
                onUpdate(side, snapped, dragData.current.className);
            }
        };


        const onMouseUp = () => {
        // Check the Ref directly

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