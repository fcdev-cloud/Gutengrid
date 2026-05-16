import { addFilter, hasFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import ResizeHandle from '../components/ResizeHandle';

const GRID_BLOCK_NAME = 'gutengrid/grid';
const PREFIX = 'gg';

/**
 * Utility: Generate Select Options
 */
const colStartOptions = Array.from( { length: 13 }, ( _, i ) => ( {
    label: String( i + 1 ),
    value: String( i + 1 ),
} ) );

const colSpanOptions = Array.from( { length: 12 }, ( _, i ) => ( {
    label: String( i + 1 ),
    value: String( i + 1 ),
} ) );

const rowOptions = Array.from( { length: 20 }, ( _, i ) => ( {
    label: String( i + 1 ),
    value: String( i + 1 ),
} ) );

/**
 * Utility: Parse classes for a specific breakpoint
 */
const parseGridClasses = ( className, bp ) => {
    const prefix = PREFIX;
    const infix = bp === 'base' ? '' : `-${ bp }`;

    const getMatch = ( regex ) => {
        const match = ( className || '' ).match( regex );
        return match?.[ 1 ] ?? '';
    };

    return {
        colStart: getMatch( new RegExp( `${ prefix }${ infix }-col-s-(\\d+)` ) ),
        colSpan:  getMatch( new RegExp( `${ prefix }${ infix }-col-z-(\\d+)` ) ),
        rowStart: getMatch( new RegExp( `${ prefix }${ infix }-row-s-(\\d+)` ) ),
        zIndex:   getMatch( new RegExp( `${ prefix }-z-(\\d+|top|neg)` ) ),
    };
};

/**
 * Utility: Update/Strip classes for a specific breakpoint
 */
const updateGridClasses = ( className, bp, data ) => {
    const { colStart, colSpan, rowStart, zIndex } = data;
    const prefix = PREFIX;
    const infix = bp === 'base' ? '' : `-${ bp }`;

    const stripped = ( className || '' )
        .split( ' ' )
        .filter( ( c ) => {
            // Remove col/row classes for THIS breakpoint
            const isPlacement = c.match( new RegExp( `^${ prefix }${ infix }-(col-s|col-z|row-s)-` ) );
            // Remove global z-index class
            const isZIndex = c.match( new RegExp( `^${ prefix }-z-` ) );
            return ! isPlacement && ! isZIndex;
        } )
        .join( ' ' );

    return [
        stripped,
        colStart ? `${ prefix }${ infix }-col-s-${ colStart }` : '',
        colSpan  ? `${ prefix }${ infix }-col-z-${ colSpan }`   : '',
        rowStart ? `${ prefix }${ infix }-row-s-${ rowStart }`  : '',
        zIndex   ? `${ prefix }-z-${ zIndex }`                  : '',
    ]
        .filter( Boolean )
        .join( ' ' )
        .trim();
};

const withGridControls = createHigherOrderComponent( ( BlockEdit ) => {
    return ( props ) => {
        const { clientId, attributes, setAttributes, isSelected } = props;
        const { className = '' } = attributes;

        const { isInsideGrid, currentInfix, breakpoints } = useSelect( ( select ) => {
            const { getBlockParents, getBlockName } = select( 'core/block-editor' );
            const { getBreakpoints } = select( 'gutengrid/options' );

            const editPostStore = select( 'core/edit-post' );
            const editorStore = select( 'core/editor' );
            
            const device = (
                editPostStore?.__experimentalGetPreviewDeviceType?.() || 
                editorStore?.getDeviceType?.() || 
                'Desktop'
            );

            const parents = getBlockParents( clientId );
            const immediateParent = parents[ parents.length - 1 ];
            const allBps = getBreakpoints() || [];
            const matchedBp = allBps.find( b => b.name === device || b.label === device );

            return {
                isInsideGrid: getBlockName( immediateParent ) === GRID_BLOCK_NAME,
                currentInfix: device === 'Desktop' ? 'base' : ( matchedBp ? matchedBp.name : 'base' ),
                breakpoints: allBps,
            };
        }, [ clientId ] );

        if ( ! isInsideGrid ) {
            return <BlockEdit { ...props } />;
        }

        const handleUpdate = ( side, snapped ) => {
            const bp = currentInfix;
            const current = parseGridClasses( className, bp );
            const base = parseGridClasses( className, 'base' );

            const start = parseInt( current.colStart || base.colStart || 1 );
            const span  = parseInt( current.colSpan || base.colSpan || 12 );

            const newData = { ...current };

            if ( side === 'left' ) {
                const end = start + span;
                newData.colStart = snapped;
                newData.colSpan = Math.max( 1, end - snapped );
            } else {
                newData.colSpan = Math.max( 1, snapped - start );
                newData.colStart = start;
            }

            setAttributes( { className: updateGridClasses( className, bp, newData ) } );
        };

        const renderControls = ( bp ) => {
            const current = parseGridClasses( className, bp );

            const updateField = ( key, val ) => {
                const newData = { ...current, [ key ]: val };
                setAttributes( {
                    className: updateGridClasses( className, bp, newData ),
                } );
            };

            return (
                <div key={ bp } className="gutengrid-controls__breakpoint">
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <SelectControl
                            label={ __( 'Col start', 'gutengrid' ) }
                            value={ current.colStart }
                            options={ [ { label: '—', value: '' }, ...colStartOptions ] }
                            onChange={ ( val ) => updateField( 'colStart', val ) }
                        />
                        <SelectControl
                            label={ __( 'Col span', 'gutengrid' ) }
                            value={ current.colSpan }
                            options={ [ { label: '—', value: '' }, ...colSpanOptions ] }
                            onChange={ ( val ) => updateField( 'colSpan', val ) }
                        />
                    </div>
                    <SelectControl
                        label={ __( 'Row Start', 'gutengrid' ) }
                        value={ current.rowStart }
                        options={ [ { label: __( 'Auto', 'gutengrid' ), value: '' }, ...rowOptions ] }
                        onChange={ ( val ) => updateField( 'rowStart', val ) }
                        help={ __( 'Explicitly set the row index.', 'gutengrid' ) }
                    />
                </div>
            );
        };

        const gridPlacementClasses = ( className || '' )
            .split( ' ' )
            .filter( ( c ) => c.startsWith( `${PREFIX}-` ) )
            .join( ' ' );

        const currentData = parseGridClasses( className, 'base' );

        return (
            <>
                <div className={ `gutengrid-resize-container ${ gridPlacementClasses }` } style={ { position: 'relative' } }>
                    <BlockEdit { ...props } />
                    
                    { isSelected && (
                        <>
                            <ResizeHandle
                                side="left"
                                className={ className }
                                onUpdate={ handleUpdate }
                            />
                            <ResizeHandle
                                side="right"
                                className={ className }
                                onUpdate={ handleUpdate }
                            />
                        </>
                    ) }
                </div>

                <InspectorControls>
                    <PanelBody
                        title={ __( 'Grid Placement', 'gutengrid' ) }
                        initialOpen={ true }
                    >
                        <SelectControl
                            label={ __( 'Layer (Z-Index)', 'gutengrid' ) }
                            value={ currentData.zIndex }
                            options={ [
                                { label: __( 'Default', 'gutengrid' ), value: '' },
                                { label: __( 'Background (-1)', 'gutengrid' ), value: 'neg' },
                                ...Array.from( { length: 10 }, ( _, i ) => ( { label: String( i + 1 ), value: String( i + 1 ) } ) ),
                                { label: __( 'Bring to Front', 'gutengrid' ), value: 'top' },
                            ] }
                            onChange={ ( val ) => setAttributes( { 
                                className: updateGridClasses( className, 'base', { ...currentData, zIndex: val } ) 
                            } ) }
                        />

                        <hr style={ { margin: '16px 0' } } />

                        <p className="gutengrid-controls__label" style={ { fontWeight: 'bold', marginBottom: '8px' } }>
                            { __( 'Base', 'gutengrid' ) }
                        </p>
                        { renderControls( 'base' ) }

                        { breakpoints.map( ( bp ) => (
                            <div key={ bp.name } style={ { marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '16px' } }>
                                <p className="gutengrid-controls__label" style={ { fontWeight: 'bold', marginBottom: '8px' } }>
                                    { bp.label || bp.name }
                                </p>
                                { renderControls( bp.name ) }
                            </div>
                        ) ) }
                    </PanelBody>
                </InspectorControls>
            </>
        );
    };
}, 'withGridControls' );

if ( ! hasFilter( 'editor.BlockEdit', 'gutengrid/with-grid-controls' ) ) {
    addFilter(
        'editor.BlockEdit',
        'gutengrid/with-grid-controls',
        withGridControls
    );
}