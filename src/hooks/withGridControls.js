import { addFilter, hasFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { PanelBody,
        SelectControl,
        TextControl,
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
import { __ } from '@wordpress/i18n';
import { MAX_COLS, GRID_BLOCK_NAME } from '../../src/constants';
import ResizeHandle from '../components/ResizeHandle';

/**
 * Utility: Get styles for a specific breakpoint
 */
const getBpStyles = ( gutengridStyles, bp ) => {
    return gutengridStyles?.[ bp ] ?? {};
}

/**
 * Utility: Update styles for a specific breakpoint
 */
const updateBpStyles = ( gutengridStyles, bp, newValues ) => {
    const updatedStyles =  {
        ...gutengridStyles,
        [ bp ]: {
            ...( gutengridStyles?.[ bp ] ?? {} ),
            ...newValues,
        },
    };
    console.log(updatedStyles);
    return updatedStyles;
};




const withGridControls = createHigherOrderComponent( ( BlockEdit ) => {
    
    return ( props ) => {
        const { clientId, attributes, setAttributes, isSelected } = props;
        const { gutengridStyles = {} } = attributes;

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

        const currentParsed = getBpStyles( gutengridStyles, currentInfix );

        const handleUpdate = ( side, snapped ) => {
            const bp      = currentInfix;
            const current = getBpStyles( gutengridStyles, bp );
            const base    = getBpStyles( gutengridStyles, 'base' );

            const hasExplicitStart = current.colStart || base.colStart;
            const start = parseInt( current.colStart || base.colStart || 1 );
            const span  = parseInt( current.colSpan  || base.colSpan  || MAX_COLS );

            const newData = { ...current };

            if ( side === 'left' ) {
                const end = start + span;
                newData.colStart = String( snapped );
                newData.colSpan  = String( Math.max( 1, end - snapped ) );
            } else {
                newData.colSpan  = String( Math.max( 1, snapped - start ) );
                newData.colStart = hasExplicitStart ? String( start ) : '0';
            }

            setAttributes( { gutengridStyles: updateBpStyles( gutengridStyles, bp, newData ) } );
        };

        const handleAlignmentToggle = ( key, val ) => {
            const newValue = currentParsed[ key ] === val ? '' : val;
            setAttributes( {
                gutengridStyles: updateBpStyles( gutengridStyles, currentInfix, { [ key ]: newValue } ),
            } );
        };

        const handleRowStep = ( direction ) => {
            const current = parseInt( currentParsed.rowStart ) || 0;
            const next    = current + direction;
            setAttributes( {
                gutengridStyles: updateBpStyles( gutengridStyles, currentInfix, {
                    rowStart: next < 1 ? '' : String( next ),
                } ),
            } );
        };

        const handleOrderStep = ( direction ) => {
            const current = parseInt( currentParsed.order ) || 0;
            const next    = current + direction;
            setAttributes( {
                gutengridStyles: updateBpStyles( gutengridStyles, currentInfix, {
                    order: next < 1 ? '' : String( Math.min( next, 20 ) ),
                } ),
            } );
        };

        const renderControls = ( bp ) => {
            const current = getBpStyles( gutengridStyles, bp );
            const alignmentOptions = [
                { label: '—',       value: '' },
                { label: 'Start',   value: 'start' },
                { label: 'Center',  value: 'center' },
                { label: 'End',     value: 'end' },
                { label: 'Stretch', value: 'stretch' },
            ];

            const updateField = ( key, val ) => {
                setAttributes( {
                    gutengridStyles: updateBpStyles( gutengridStyles, bp, { [ key ]: val } ),
                } );
            };

            return (
                <div key={ bp } className="gutengrid-controls__breakpoint">
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <TextControl
                            label={ __( 'Col start', 'gutengrid' ) }
                            type="number"
                            min="0"
                            max={MAX_COLS}
                            value={ current.colStart ?? '' }
                            onChange={ ( val ) => updateField( 'colStart', val ) }
                        />
                        <TextControl
                            label={ __( 'Col span', 'gutengrid' ) }
                            type="number"
                            min="0"
                            max={MAX_COLS + 1}
                            value={ current.colSpan ?? '' }
                            onChange={ ( val ) => updateField( 'colSpan', val ) }
                        />
                    </div>
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <TextControl
                            label={ __( 'Row start', 'gutengrid' ) }
                            type="number"
                            min="0"
                            value={ current.rowStart ?? '' }
                            onChange={ ( val ) => updateField( 'rowStart', val ) }
                        />
                        <TextControl
                            label={ __( 'Row span', 'gutengrid' ) }
                            type="number"
                            min="0"
                            value={ current.rowSpan ?? '' }
                            onChange={ ( val ) => updateField( 'rowSpan', val ) }
                        />
                    </div>
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <SelectControl
                            label={ __( 'Horizontal Align', 'gutengrid' ) }
                            value={ current.justifySelf ?? '' }
                            options={ alignmentOptions }
                            onChange={ ( val ) => updateField( 'justifySelf', val ) }
                        />
                        <SelectControl
                            label={ __( 'Vertical Align', 'gutengrid' ) }
                            value={ current.alignSelf ?? '' }
                            options={ alignmentOptions }
                            onChange={ ( val ) => updateField( 'alignSelf', val ) }
                        />
                    </div>
                    <TextControl
                        label={ __( 'Order', 'gutengrid' ) }
                        type="number"
                        value={ current.order ?? '' }
                        onChange={ ( val ) => updateField( 'order', val ) }
                    />
                </div>
            );
        };

        return (
            <>
                <div className={ `gutengrid-resize-container${ isSelected ? ' gutengrid-bring-to-front' : '' }` } style={ { position: 'relative' } }>
                    <BlockEdit { ...props } />

                    { isSelected && (
                        <>
                            <ResizeHandle
                                side="top-left"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="top"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="top-right"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="right"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="bottom-right"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="bottom"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="bottom-left"
                                onUpdate={ handleUpdate }
                                cols={ activeCols }
                            />
                            <ResizeHandle
                                side="left"
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
                        <TextControl
                            label={ __( 'Layer (Z-Index)', 'gutengrid' ) }
                            type="number"
                            value={ getBpStyles( gutengridStyles, 'base' ).zIndex ?? '' }
                            onChange={ ( val ) => setAttributes( {
                                gutengridStyles: updateBpStyles( gutengridStyles, 'base', { zIndex: val } ),
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