import { addFilter, hasFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { PREFIX } from '../constants';

const propMap = {
    colStart:    `--${PREFIX}-col-start`,
    colSpan:     `--${PREFIX}-col-span`,
    rowStart:    `--${PREFIX}-row-start`,
    rowSpan:     `--${PREFIX}-row-span`,
    justifySelf: `--${PREFIX}-justify-self`,
    alignSelf:   `--${PREFIX}-align-self`,
    order:       `--${PREFIX}-order`,
    zIndex:      `--${PREFIX}-z-index`
};

// Add custom gutengrid attributes to blocks
const addGutengridStylesAttribute = ( settings ) => {
    return {
        ...settings,
        attributes: {
            ...settings.attributes,
            gutengridStyles: {
                type:    'object',
                default: {},
            },
        },
    };
};
if ( ! hasFilter( 'blocks.registerBlockType', 'gutengrid/add-gutengrid-styles-attribute' ) ) {
    addFilter(
        'blocks.registerBlockType',
        'gutengrid/add-gutengrid-styles-attribute',
        addGutengridStylesAttribute
    );
}

export const buildGutengridStyles = ( gutengridStyles ) => {
    const style = {};

    Object.entries( gutengridStyles ).forEach( ( [ bp, values ] ) => {
        const infix = bp === 'base' ? '' : `-${ bp }`;

        Object.entries( values ).forEach( ( [ key, val ] ) => {
            if ( val && propMap[ key ] ) {
                style[ `${ propMap[ key ] }${ infix }` ] = val;
            }
        } );
    } );

    return style;
};

const applyGutengridStyles = ( props, blockType, attributes ) => {
    const { gutengridStyles } = attributes;

    if ( ! gutengridStyles || ! Object.keys( gutengridStyles ).length ) {
        return props;
    }

    const style = buildGutengridStyles( gutengridStyles );

    return { ...props, style: { ...( props.style ?? {} ), ...style } };
};
if ( ! hasFilter( 'blocks.getSaveContent.extraProps', 'gutengrid/apply-gutengrid-styles' ) ) {
    addFilter(
        'blocks.getSaveContent.extraProps',
        'gutengrid/apply-gutengrid-styles',
        applyGutengridStyles
    );
}


const withGutengridEditorStyles = createHigherOrderComponent( ( BlockListBlock ) => {
    return ( props ) => {
        const { attributes, wrapperProps } = props;
        const { gutengridStyles } = attributes;

        if ( ! gutengridStyles || ! Object.keys( gutengridStyles ).length ) {
            return <BlockListBlock { ...props } />;
        }

        const style = buildGutengridStyles( gutengridStyles );

        return <BlockListBlock { ...props } wrapperProps={ {
            ...wrapperProps,
            style: { ...( wrapperProps?.style ?? {} ), ...style },
        } } />;
    };
}, 'withGutengridEditorStyles' );


if ( ! hasFilter( 'editor.BlockListBlock', 'gutengrid/with-gutengrid-editor-styles' ) ) {
    addFilter(
        'editor.BlockListBlock',
        'gutengrid/with-gutengrid-editor-styles',
        withGutengridEditorStyles
    );
}