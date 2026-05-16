import { select, dispatch } from '@wordpress/data';
import { useState, useLayoutEffect, useRef } from '@wordpress/element';
import { useBlockProps, InnerBlocks, BlockControls, InspectorControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup, PanelBody, TextControl, SelectControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { column } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import { buildInlineStyles } from '../../src/utils/buildInlineStyles';

const colsOptions = [
    { label: __( 'Default', 'gutengrid' ), value: '' },
    ...Array.from( { length: 12 }, ( _, i ) => ( {
        label: String( i + 1 ),
        value: String( i + 1 ),
    } ) ),
];

export default function Edit( { attributes, setAttributes, clientId } ) {
    const { colGap, rowGap, breakpointGaps, cols, breakpointCols } = attributes;
    const [ showOverlay, setShowOverlay ] = useState( false );
    const ref = useRef();

    const { setDeviceType } = useDispatch( 'core/editor' );

    const breakpoints = useSelect( ( select ) => {
        return select( 'core/editor' ).getEditorSettings()?.deviceTypes ?? [];
    }, [] );

    const activeDevice = useSelect( ( select ) => {
        return select( 'core/editor' ).getDeviceType();
    }, [] );

    // Fetch global base settings — used as fallback when no block-level override is set
    const globalBase = useSelect( ( select ) => {
        return select( 'core/editor' ).getEditorSettings()?.ggBase ?? {
            colGap: '1.5rem',
            rowGap: '1.5rem',
            cols:   12,
        };
    }, [] );

    // Resolved base values — block attribute → global base setting
    const resolvedColGap = colGap || globalBase.colGap;
    const resolvedRowGap = rowGap || globalBase.rowGap;
    const resolvedCols   = cols   || globalBase.cols;

    /**
     * Resize the editor iframe to match the active breakpoint width.
     */
    useLayoutEffect( () => {
        const editorCanvas = window.parent.document.querySelector( 'iframe[name="editor-canvas"]' );

        if ( ! editorCanvas ) return;

        const currentBP = breakpoints.find( ( bp ) => bp.name === activeDevice );

        if ( currentBP && currentBP.width ) {
            editorCanvas.style.width      =  currentBP.width;
            editorCanvas.style.transition = 'width 0.3s ease-in-out';
            editorCanvas.style.margin     = '0 auto';
            editorCanvas.style.display    = 'block';
        } else {
            editorCanvas.style.width = '100%';
        }
    }, [ activeDevice, breakpoints ] );

    /**
     * Apply grid layout to Gutenberg's inner block wrapper.
     */
    useLayoutEffect( () => {
        if ( ! ref.current ) return;

        const layout = ref.current.querySelector( '.block-editor-block-list__layout' );

        if ( ! layout ) return;

        const activeBp = breakpoints.find( ( bp ) => bp.name === activeDevice );
        const bpName   = activeBp?.name;

        // Resolve cols — block breakpoint override → block base → global base → hardcoded default
        const activeCols = (
            ( bpName && breakpointCols?.[ bpName ] ) ||
            resolvedCols
        );

        // Resolve gaps — block breakpoint override → block base → global base → hardcoded default
        const activeColGap = (
            ( bpName && breakpointGaps?.[ bpName ]?.colGap ) ||
            resolvedColGap
        );

        const activeRowGap = (
            ( bpName && breakpointGaps?.[ bpName ]?.rowGap ) ||
            resolvedRowGap
        );

        layout.style.display             = 'grid';
        layout.style.gridTemplateColumns = `repeat( ${ activeCols }, 1fr )`;
        layout.style.columnGap           = activeColGap;
        layout.style.rowGap              = activeRowGap;

    }, [ resolvedColGap, resolvedRowGap, resolvedCols, breakpointCols, breakpointGaps, activeDevice, breakpoints ] );

    const blockProps = useBlockProps( {
        className: `gg ${ showOverlay ? 'gg--overlay' : '' }`,
        style: buildInlineStyles( attributes ),
    } );

    const handleColsChange = ( val ) => {
        const newCols = val ? parseInt( val ) : undefined;
        setAttributes( { cols: newCols } );

        const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );
        const effectiveCols = newCols || globalBase.cols;

        innerBlocks.forEach( ( block ) => {
            const { className = '' } = block.attributes;

            const cleaned = className
                .split( ' ' )
                .filter( ( c ) => {
                    const startMatch = c.match( /gg(?:-\w+)?-col-s-(\d+)/ );
                    const spanMatch  = c.match( /gg(?:-\w+)?-col-z-(\d+)/ );

                    if ( startMatch && parseInt( startMatch[ 1 ] ) > effectiveCols ) return false;
                    if ( spanMatch  && parseInt( spanMatch[ 1 ] )  > effectiveCols ) return false;

                    return true;
                } )
                .join( ' ' )
                .trim();

            if ( cleaned !== className ) {
                dispatch( 'core/block-editor' ).updateBlockAttributes(
                    block.clientId,
                    { className: cleaned }
                );
            }
        } );
    };

    const updateBreakpointGap = ( bp, field, value ) => {
        setAttributes( {
            breakpointGaps: {
                ...breakpointGaps,
                [ bp ]: {
                    ...( breakpointGaps?.[ bp ] ?? {} ),
                    [ field ]: value,
                },
            },
        } );
    };

    const updateBreakpointCols = ( bp, val ) => {
        const newCols     = val ? parseInt( val ) : undefined;
        const effectiveCols = newCols || globalBase.cols;

        setAttributes( {
            breakpointCols: {
                ...breakpointCols,
                [ bp ]: newCols,
            },
        } );

        const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );

        innerBlocks.forEach( ( block ) => {
            const { className = '' } = block.attributes;

            const cleaned = className
                .split( ' ' )
                .filter( ( c ) => {
                    const startMatch = c.match( new RegExp( `gg-${ bp }-col-s-(\\d+)` ) );
                    const spanMatch  = c.match( new RegExp( `gg-${ bp }-col-z-(\\d+)` ) );

                    if ( startMatch && parseInt( startMatch[ 1 ] ) > effectiveCols ) return false;
                    if ( spanMatch  && parseInt( spanMatch[ 1 ] )  > effectiveCols ) return false;

                    return true;
                } )
                .join( ' ' )
                .trim();

            if ( cleaned !== className ) {
                dispatch( 'core/block-editor' ).updateBlockAttributes(
                    block.clientId,
                    { className: cleaned }
                );
            }
        } );
    };

    const renderBreakpointFields = ( bp, label ) => {
        const gaps   = breakpointGaps?.[ bp ] ?? {};
        const bpCols = breakpointCols?.[ bp ] ?? '';

        // Get global breakpoint defaults from deviceTypes
        const globalBp = breakpoints.find( ( b ) => b.name === bp );

        return (
            <div key={ bp } style={ { marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '16px' } }>
                <p style={ { fontWeight: 600, marginBottom: '8px' } }>{ label }</p>
                <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                    <TextControl
                        label={ __( 'Col gap', 'gutengrid' ) }
                        value={ gaps.colGap ?? '' }
                        placeholder={ globalBp?.colGap ?? '1.5rem' }
                        onChange={ ( val ) => updateBreakpointGap( bp, 'colGap', val ) }
                    />
                    <TextControl
                        label={ __( 'Row gap', 'gutengrid' ) }
                        value={ gaps.rowGap ?? '' }
                        placeholder={ globalBp?.rowGap ?? '1.5rem' }
                        onChange={ ( val ) => updateBreakpointGap( bp, 'rowGap', val ) }
                    />
                </div>
                <SelectControl
                    label={ __( 'Cols', 'gutengrid' ) }
                    value={ bpCols }
                    options={ colsOptions }
                    onChange={ ( val ) => updateBreakpointCols( bp, val ) }
                />
            </div>
        );
    };

    const buildOverlayStyle = () => {
        const activeBp  = breakpoints.find( ( bp ) => bp.name === activeDevice );
        const bpName    = activeBp?.name;

        const activeCols = ( bpName && breakpointCols?.[ bpName ] ) || resolvedCols;
        const activeGap  = ( bpName && breakpointGaps?.[ bpName ]?.colGap ) || resolvedColGap;

        const colWidth  = `( ( 100% - ( ${ activeCols - 1 } * ${ activeGap } ) ) / ${ activeCols } )`;
        const bandWidth = `calc( ${ colWidth } )`;
        const stepWidth = `calc( ${ colWidth } + ${ activeGap } )`;

        return {
            backgroundImage: `repeating-linear-gradient(
                to right,
                rgba( 99, 102, 241, 0.08 ) 0,
                rgba( 99, 102, 241, 0.08 ) ${ bandWidth },
                transparent ${ bandWidth },
                transparent ${ stepWidth }
            )`,
            backgroundSize:       '100%',
            backgroundAttachment: 'local',
        };
    };

    return (
        <>
            <BlockControls>
                <ToolbarGroup>
                    <ToolbarButton
                        icon={ column }
                        label={ __( 'Toggle column overlay', 'gutengrid' ) }
                        onClick={ () => setShowOverlay( ( prev ) => ! prev ) }
                        isPressed={ showOverlay }
                    />
                </ToolbarGroup>

                <ToolbarGroup>
                    <ToolbarButton
                        label={ __( 'Desktop', 'gutengrid' ) }
                        isPressed={ activeDevice === 'Desktop' || ! activeDevice }
                        onClick={ () => setDeviceType( 'Desktop' ) }
                    >
                        { __( 'Base', 'gutengrid' ) }
                    </ToolbarButton>

                    { breakpoints.filter( ( bp ) => bp.name !== 'Desktop' ).map( ( bp ) => (
                        <ToolbarButton
                            key={ bp.name }
                            label={ bp.name }
                            isPressed={ activeDevice === bp.name }
                            onClick={ () => setDeviceType( bp.name ) }
                        >
                            { bp.name.toUpperCase() }
                        </ToolbarButton>
                    ) ) }
                </ToolbarGroup>
            </BlockControls>

            <InspectorControls>
                <PanelBody
                    title={ __( 'Grid Settings', 'gutengrid' ) }
                    initialOpen={ true }
                >
                    <p style={ { fontWeight: 600, marginBottom: '8px' } }>
                        { __( 'Base', 'gutengrid' ) }
                    </p>
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
                        <TextControl
                            label={ __( 'Col gap', 'gutengrid' ) }
                            value={ colGap }
                            placeholder={ globalBase.colGap }
                            onChange={ ( val ) => setAttributes( { colGap: val } ) }
                        />
                        <TextControl
                            label={ __( 'Row gap', 'gutengrid' ) }
                            value={ rowGap }
                            placeholder={ globalBase.rowGap }
                            onChange={ ( val ) => setAttributes( { rowGap: val } ) }
                        />
                    </div>
                    <SelectControl
                        label={ __( 'Cols', 'gutengrid' ) }
                        value={ cols }
                        options={ colsOptions }
                        onChange={ handleColsChange }
                    />

                    { breakpoints
                        .filter( ( bp ) => bp.name !== 'Desktop' )
                        .map( ( bp ) => renderBreakpointFields( bp.name, bp.label || bp.name.toUpperCase() ) )
                    }
                </PanelBody>
            </InspectorControls>

            <div { ...blockProps }>
                <div ref={ ref } className="gg__inner" style={ showOverlay ? buildOverlayStyle() : {} }>
                    <InnerBlocks />
                </div>
            </div>
        </>
    );
}