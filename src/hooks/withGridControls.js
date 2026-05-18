import { addFilter, hasFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { PanelBody, 
        SelectControl, 
        ToolbarDropdownMenu, 
        ToolbarGroup, 
        ToolbarButton, 
        ToolbarItem 
    } from '@wordpress/components';
import { justifyLeft, 
        justifyCenter, 
        justifyRight, 
        justifyStretch, 
        justifyTop, 
        justifyCenterVertical, 
        justifyBottom, 
        justifyStretchVertical,
        chevronLeft,
        chevronRight
    } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import ResizeHandle from '../components/ResizeHandle';

const GRID_BLOCK_NAME = 'gutengrid/grid';
const PREFIX = 'gg';
const MAX_COLS = 12;

/**
 * Utility: Generate Select Options
 */
const colStartOptions = [
    { label: 'Auto', value: '0' },
    ...Array.from( { length: MAX_COLS + 1 }, ( _, i ) => ( {
        label: String( i + 1 ),
        value: String( i + 1 ),
    } ) ),
];

const colSpanOptions = Array.from( { length: MAX_COLS }, ( _, i ) => ( {
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
        justifySelf: getMatch( new RegExp( `${ prefix }${ infix }-js-(start|center|end|stretch)` ) ),
        alignSelf:   getMatch( new RegExp( `${ prefix }${ infix }-as-(start|center|end|stretch)` ) ),
        order:      getMatch( new RegExp( `${ prefix }${ infix }-order-(\\d+)` ) ),
    };
};

/**
 * Utility: Update/Strip classes for a specific breakpoint
 */
const updateGridClasses = ( className, bp, data ) => {
    const { colStart, colSpan, rowStart, zIndex, justifySelf, alignSelf, order } = data;
    const prefix = PREFIX;
    const infix = bp === 'base' ? '' : `-${ bp }`;

    const stripped = ( className || '' )
        .split( ' ' )
        .filter( ( c ) => {
            // Remove col/row classes for THIS breakpoint
            const isPlacement = c.match( new RegExp( `^${ prefix }${ infix }-(col-s|col-z|row-s)-` ) );
            // Remove global z-index class
            const isZIndex = c.match( new RegExp( `^${ prefix }-z-` ) );
            // Remove Alignment classes for THIS breakpoint
            const isAlignment = c.match( new RegExp( `^${ prefix }${ infix }-(js|as)-` ) ); 
            
            // Remove order classes for THIS breakpoint
            const isOrder = c.match( new RegExp( `^${ prefix }${ infix }-order-` ) );
            return ! isPlacement && ! isZIndex && ! isAlignment && ! isOrder;
        } )
        .join( ' ' );

    return [
        stripped,
        colStart    ? `${ prefix }${ infix }-col-s-${ colStart }`    : '',
        colSpan     ? `${ prefix }${ infix }-col-z-${ colSpan }`     : '',
        rowStart    ? `${ prefix }${ infix }-row-s-${ rowStart }`    : '',
        zIndex      ? `${ prefix }-z-${ zIndex }`                    : '',
        justifySelf ? `${ prefix }${ infix }-js-${ justifySelf }`    : '',
        alignSelf   ? `${ prefix }${ infix }-as-${ alignSelf }`      : '',
        order ? `${ prefix }${ infix }-order-${ order }` : '',
    ]
        .filter( Boolean )
        .join( ' ' )
        .trim();
};

const withGridControls = createHigherOrderComponent( ( BlockEdit ) => {
    return ( props ) => {
        const { clientId, attributes, setAttributes, isSelected } = props;
        const { className = '' } = attributes;

        const { isInsideGrid, currentInfix, breakpoints, activeCols } = useSelect( ( select ) => {
                const { getBlockParents, getBlockName, getBlock } = select( 'core/block-editor' );
                const { getBreakpoints }                          = select( 'gutengrid/options' );
                const editorStore                                 = select( 'core/editor' );
                const editPostStore                               = select( 'core/edit-post' );

                const device = (
                    editPostStore?.__experimentalGetPreviewDeviceType?.() ||
                    editorStore?.getDeviceType?.() ||
                    'Desktop'
                );

                const parents         = getBlockParents( clientId );
                const immediateParent = parents[ parents.length - 1 ];
                const parentBlock     = getBlock( immediateParent );
                const allBps          = getBreakpoints() || [];
                const matchedBp       = allBps.find( ( b ) => b.name === device || b.label === device );
                const infix           = device === 'Desktop' ? 'base' : ( matchedBp ? matchedBp.name : 'base' );

                // Resolve active cols from parent block attributes
                const { cols, breakpointCols } = parentBlock?.attributes ?? {};
                const resolvedCols = (
                    ( infix !== 'base' && breakpointCols?.[ infix ] ) ||
                    cols ||
                    MAX_COLS
                );

                return {
                    isInsideGrid:  getBlockName( immediateParent ) === GRID_BLOCK_NAME,
                    currentInfix:  infix,
                    breakpoints:   allBps,
                    activeCols:    resolvedCols,
                };
            }, [ clientId ] );

        if ( ! isInsideGrid ) {
            return <BlockEdit { ...props } />;
        }

        const handleUpdate = ( side, snapped ) => {
            const bp      = currentInfix;
            const current = parseGridClasses( className, bp );
            const base    = parseGridClasses( className, 'base' );

            const hasExplicitStart = current.colStart || base.colStart;
            const start = parseInt( current.colStart || base.colStart || 1 );
            const span  = parseInt( current.colSpan  || base.colSpan  || MAX_COLS );

            const newData = { ...current };

            if ( side === 'left' ) {
                const end = start + span;
                newData.colStart = snapped;
                newData.colSpan  = Math.max( 1, end - snapped );
            } else {
                newData.colSpan  = Math.max( 1, snapped - start );
                newData.colStart = hasExplicitStart ? String( start ) : '0';
            }

            setAttributes( { className: updateGridClasses( className, bp, newData ) } );
        };

        const currentParsed = parseGridClasses( className, currentInfix );

        const handleAlignmentToggle = ( key, val ) => {
            const newData = {
                ...currentParsed,
                [ key ]: currentParsed[ key ] === val ? '' : val,
            };
            setAttributes( { className: updateGridClasses( className, currentInfix, newData ) } );
        };

        // Row start stepper for toolbar buttons
        const handleRowStep = ( direction ) => {
            const current = parseInt( currentParsed.rowStart ) || 0;
            const next    = current + direction;
            const newData = {
                ...currentParsed,
                rowStart: next < 1 ? '' : String( Math.min( next, 20 ) ),
            };
            setAttributes( { className: updateGridClasses( className, currentInfix, newData ) } );
        };

        // Order stepper for toolbar buttons
        const handleOrderStep = ( direction ) => {
            const current = parseInt( currentParsed.order ) || 0;
            const next    = current + direction;
            const newData = {
                ...currentParsed,
                order: next < 1 ? '' : String( Math.min( next, 20 ) ),
            };
            setAttributes( { className: updateGridClasses( className, currentInfix, newData ) } );
        };

        const renderControls = ( bp ) => {
            const current = parseGridClasses( className, bp );
            const alignmentOptions = [
                            { label: '—',       value: '' },
                            { label: 'Start',   value: 'start' },
                            { label: 'Center',  value: 'center' },
                            { label: 'End',     value: 'end' },
                            { label: 'Stretch', value: 'stretch' },
                        ];
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
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <SelectControl
                            label={ __( 'Horizontal Align', 'gutengrid' ) }
                            value={ current.justifySelf }
                            options={ alignmentOptions }
                            onChange={ ( val ) => updateField( 'justifySelf', val ) }
                        />
                        <SelectControl
                            label={ __( 'Vertical Align', 'gutengrid' ) }
                            value={ current.alignSelf }
                            options={ alignmentOptions }
                            onChange={ ( val ) => updateField( 'alignSelf', val ) }
                        />
                    </div>
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <SelectControl
                            label={ __( 'Order', 'gutengrid' ) }
                            value={ current.order }
                            options={ [
                                { label: '—', value: '' },
                                ...Array.from( { length: 20 }, ( _, i ) => ( {
                                    label: String( i + 1 ),
                                    value: String( i + 1 ),
                                } ) ),
                            ] }
                            onChange={ ( val ) => updateField( 'order', val ) }
                        />
                    </div>
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
                <div className={ `gutengrid-resize-container ${ gridPlacementClasses }${ isSelected ? ' gutengrid-bring-to-front' : '' }` } style={ { position: 'relative' } }>
                    <BlockEdit { ...props } />
                    
                    { isSelected && (
                        <>
                            <ResizeHandle
                                side="left"
                                className={ className }
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="right"
                                className={ className }
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                        </>
                    ) }
                </div>

                <BlockControls>
                    <ToolbarDropdownMenu
                        icon={ justifyStretch }
                        label={ __( 'Horizontal alignment', 'gutengrid' ) }
                        controls={ [
                            {
                                icon:     justifyLeft,
                                title:    __( 'Start', 'gutengrid' ),
                                isActive: currentParsed.justifySelf === 'start',
                                onClick:  () => handleAlignmentToggle( 'justifySelf', 'start' ),
                            },
                            {
                                icon:     justifyCenter,
                                title:    __( 'Center', 'gutengrid' ),
                                isActive: currentParsed.justifySelf === 'center',
                                onClick:  () => handleAlignmentToggle( 'justifySelf', 'center' ),
                            },
                            {
                                icon:     justifyRight,
                                title:    __( 'End', 'gutengrid' ),
                                isActive: currentParsed.justifySelf === 'end',
                                onClick:  () => handleAlignmentToggle( 'justifySelf', 'end' ),
                            },
                            {
                                icon:     justifyStretch,
                                title:    __( 'Stretch', 'gutengrid' ),
                                isActive: currentParsed.justifySelf === 'stretch',
                                onClick:  () => handleAlignmentToggle( 'justifySelf', 'stretch' ),
                            },
                        ] }
                    />
                    <ToolbarDropdownMenu
                        icon={ justifyStretchVertical }
                        label={ __( 'Vertical alignment', 'gutengrid' ) }
                        controls={ [
                            {
                                icon:     justifyTop,
                                title:    __( 'Start', 'gutengrid' ),
                                isActive: currentParsed.alignSelf === 'start',
                                onClick:  () => handleAlignmentToggle( 'alignSelf', 'start' ),
                            },
                            {
                                icon:     justifyCenterVertical,
                                title:    __( 'Center', 'gutengrid' ),
                                isActive: currentParsed.alignSelf === 'center',
                                onClick:  () => handleAlignmentToggle( 'alignSelf', 'center' ),
                            },
                            {
                                icon:     justifyBottom,
                                title:    __( 'End', 'gutengrid' ),
                                isActive: currentParsed.alignSelf === 'end',
                                onClick:  () => handleAlignmentToggle( 'alignSelf', 'end' ),
                            },
                            {
                                icon:     justifyStretchVertical,
                                title:    __( 'Stretch', 'gutengrid' ),
                                isActive: currentParsed.alignSelf === 'stretch',
                                onClick:  () => handleAlignmentToggle( 'alignSelf', 'stretch' ),
                            },
                        ] }
                    />
                    <ToolbarGroup 
                    className='gutengrid-toolbar-separator'
                    label={ __( 'Row start', 'gutengrid' ) }>
                        <ToolbarItem>
                            { ( itemProps ) => (
                                <span { ...itemProps } style={ { padding: '0 6px', fontSize: '11px', alignSelf: 'center', color: '#757575' } }>
                                    { __( 'Row', 'gutengrid' ) }
                                </span>
                            ) }
                        </ToolbarItem>
                        <ToolbarButton
                            icon={ chevronLeft }
                            label={ __( 'Decrease row start', 'gutengrid' ) }
                            className='gutengrid-stepper-button'
                            disabled={ ! currentParsed.rowStart }
                            onClick={ () => handleRowStep( -1 ) }
                        />
                        <ToolbarItem>
                            { ( itemProps ) => (
                                <span { ...itemProps } style={ { padding: '0 6px', fontSize: '11px', alignSelf: 'center', color: '#757575' } }>
                                    { currentParsed.rowStart ? currentParsed.rowStart : '—' }
                                </span>
                            ) }
                        </ToolbarItem>
                        <ToolbarButton
                            icon={ chevronRight }
                            label={ __( 'Increase row start', 'gutengrid' ) }
                            disabled={ currentParsed.rowStart === '20' }
                            className='gutengrid-stepper-button'
                            onClick={ () => handleRowStep( 1 ) }
                        />
                    </ToolbarGroup>
                    <ToolbarGroup 
                    className='gutengrid-toolbar-separator'
                    label={ __( 'Order', 'gutengrid' ) }>
                        <ToolbarItem>
                            { ( itemProps ) => (
                                <span { ...itemProps } style={ { padding: '0 6px', fontSize: '11px', alignSelf: 'center', color: '#757575' } }>
                                    { __( 'Order', 'gutengrid' ) }
                                </span>
                            ) }
                        </ToolbarItem>
                        <ToolbarButton
                            icon={ chevronLeft }
                            label={ __( 'Decrease order', 'gutengrid' ) }
                            className='gutengrid-stepper-button'
                            disabled={ ! currentParsed.order }
                            onClick={ () => handleOrderStep( -1 ) }
                        />
                        <ToolbarItem>
                            { ( itemProps ) => (
                                <span { ...itemProps } style={ { padding: '0 6px', fontSize: '11px', alignSelf: 'center', color: '#757575' } }>
                                    { currentParsed.order ? currentParsed.order : '—' }
                                </span>
                            ) }
                        </ToolbarItem>
                        <ToolbarButton
                            icon={ chevronRight }
                            label={ __( 'Increase order', 'gutengrid' ) }
                            disabled={ currentParsed.order === '20' }
                            className='gutengrid-stepper-button'
                            onClick={ () => handleOrderStep( 1 ) }
                        />
                    </ToolbarGroup>
                </BlockControls>
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