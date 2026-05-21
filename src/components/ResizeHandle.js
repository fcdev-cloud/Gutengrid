import { useRef, useEffect } from '@wordpress/element';
import { MAX_COLS, PREFIX } from '../../src/constants';

const getGridInner = ( element ) => {
    // Check to see if element is inside the inner container
    return element.closest( `.${PREFIX}__inner` );
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


const snapToRow = ( mouseY, gridInner ) => {
    const computedRows = getComputedStyle( gridInner ).gridTemplateRows;
    console.log('computed rows', computedRows);
    const rowSizes = computedRows.split( ' ' ).map( parseFloat );
    
    const gridTop = gridInner.getBoundingClientRect().top;
    const relativeY = mouseY - gridTop;

    let cumulative = 0;
    for ( let i = 0; i < rowSizes.length; i++ ) {
        cumulative += rowSizes[ i ];
        if ( relativeY <= cumulative ) {
            return i + 1; // 1-indexed row number
        }
    }

    return rowSizes.length + 1; // past the last row
};

export default function ResizeHandle( { side, onUpdate, cols = MAX_COLS } ) {
    const handleRef = useRef();

    // Using a Ref to store drag state so that mousemove handlers
    const dragData = useRef({
        isDragging: false,
        gridRect: null,
        gridInner: null,
        lastSnapped: null,
        cols: cols,
    });

    useEffect(() => {
        dragData.current.cols = cols;
    }, [cols]);

    useEffect(() => {
        // Get the actual document the handle lives in (the iframe)
        const localDoc = handleRef.current?.ownerDocument || document;

        // Get the top-level document (the main editor UI)
        const topDoc = window.top.document;

        const onMouseMove = (e) => {
            if (!dragData.current.isDragging || !dragData.current.gridRect) return;

            const { gridRect, gridInner, cols } = dragData.current;
            

            const movesCol = side.includes( 'left' ) || side.includes( 'right' );
            const movesRow = side.includes( 'top' )  || side.includes( 'bottom' );
            
            const colSnap = movesCol ? snapToColumn( e.clientX, gridRect, side.includes( 'left' ) ? 'start' : 'end', cols ) : null;
            const rowSnap = movesRow ? snapToRow( e.clientY, gridInner ) : null;


            const snapped = { col: colSnap, row: rowSnap };

            if ( snapped.col !== dragData.current.lastSnapped?.col || snapped.row !== dragData.current.lastSnapped?.row ) {
                dragData.current.lastSnapped = snapped;
                onUpdate( side, snapped );
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

        dragData.current.gridRect   = gridInner.getBoundingClientRect();
        dragData.current.gridInner  = gridInner;
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
