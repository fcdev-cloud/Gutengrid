//Builds an inline style object of CSS variable overrides for a gutengrid block.

export const buildInlineStyles = ( { colGap, rowGap, cols, breakpointGaps, breakpointCols } ) => {
    const styles = {};

    if ( colGap ) styles[ '--gg-col-gap' ] = colGap;
    if ( rowGap ) styles[ '--gg-row-gap' ] = rowGap;
    if ( cols )   styles[ '--gg-cols' ]     = cols;

    if ( breakpointGaps ) {
        Object.entries( breakpointGaps ).forEach( ( [ bp, gaps ] ) => {
            if ( gaps.colGap ) styles[ `--gg-${ bp }-col-gap` ] = gaps.colGap;
            if ( gaps.rowGap ) styles[ `--gg-${ bp }-row-gap` ] = gaps.rowGap;
        } );
    }

    if ( breakpointCols ) {
        Object.entries( breakpointCols ).forEach( ( [ bp, count ] ) => {
            if ( count ) styles[ `--gg-${ bp }-cols` ] = count;
        } );
    }

    return styles;
};