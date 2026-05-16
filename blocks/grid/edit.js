import { useState, useLayoutEffect, useRef } from '@wordpress/element';
import { useBlockProps, InnerBlocks, BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { column } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes } ) {
    const { columnGap, rowGap } = attributes;
    const [ showOverlay, setShowOverlay ] = useState( false );
    const ref = useRef();

    /**
     * Dispatch & Select
     * Core editor to manage device type state.
     */
    const { setDeviceType } = useDispatch( 'core/editor' );

    const breakpoints = useSelect( ( select ) => {
        // Fetch custom breakpoints injected via PHP settings
        return select( 'core/editor' ).getEditorSettings()?.deviceTypes ?? [];
    }, [] );

    const activeDevice = useSelect( ( select ) => {
        return select( 'core/editor' ).getDeviceType();
    }, [] );

    /**
     * Listens for changes to activeDevice and manually resizes the iframe 
     * from the parent document to match custom breakpoint widths.
     */
    useLayoutEffect( () => {
        // Reach out to the parent window to find the iframe
        const editorCanvas = window.parent.document.querySelector( 'iframe[name="editor-canvas"]' );
        
        if ( ! editorCanvas ) return;

        const currentBP = breakpoints.find( bp => bp.name === activeDevice );

        if ( currentBP && currentBP.width ) {
            editorCanvas.style.width = parseInt(currentBP.width) + 100 + 'px';
            editorCanvas.style.transition = 'width 0.3s ease-in-out';
            editorCanvas.style.margin = '0 auto';
            editorCanvas.style.display = 'block';
        } else {
            // Default back to 100% for Desktop or unrecognized types
            editorCanvas.style.width = '100%';
        }
    }, [ activeDevice, breakpoints ] );

    /**
     * Add grid to innerblocks layout 
     */
    useLayoutEffect( () => {
        if ( ! ref.current ) return;

        const layout = ref.current.querySelector( '.block-editor-block-list__layout' );

        if ( layout ) {
            layout.style.display = 'grid';
            layout.style.gridTemplateColumns = 'repeat( 12, 1fr )';
            layout.style.columnGap = columnGap;
            layout.style.rowGap = rowGap;
        }
    }, [ columnGap, rowGap ] );

    /**
     * pass the gaps as CSS variables to make them accessible to 
     * the overlay CSS and block styling.
     */
    const blockProps = useBlockProps( {
        className: `gutengrid ${ showOverlay ? 'gutengrid--overlay' : '' }`,
        style: {
            '--gutengrid-column-gap': columnGap,
            '--gutengrid-row-gap': rowGap,
        },
    } );

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
                    { /* Base/Desktop Button */ }
                    <ToolbarButton
                        label={ __( 'Desktop', 'gutengrid' ) }
                        isPressed={ activeDevice === 'Desktop' || ! activeDevice }
                        onClick={ () => setDeviceType( 'Desktop' ) }
                    >
                        { __( 'Base', 'gutengrid' ) }
                    </ToolbarButton>

                    { /* Dynamic Breakpoint Buttons */ }
                    { breakpoints.filter( bp => bp.name !== 'Desktop' ).map( ( bp ) => (
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

            <div { ...blockProps }>
                <div ref={ ref } className="gutengrid__inner">
                    <InnerBlocks />
                </div>
            </div>
        </>
    );
}