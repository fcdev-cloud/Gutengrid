//Builds an inline style object of CSS variable overrides for a gutengrid block.
import { PREFIX } from "../constants";
export const buildInlineStyles = ( { colGap, rowGap, cols, breakpointGaps, breakpointCols } ) => {
    const styles = {};

    if ( colGap ) styles[ `--${PREFIX}-col-gap` ] = colGap;
    if ( rowGap ) styles[ `--${PREFIX}-row-gap` ] = rowGap;
    if ( cols )   styles[ `--${PREFIX}-cols` ]     = cols;

    if ( breakpointGaps ) {
        Object.entries( breakpointGaps ).forEach( ( [ bp, gaps ] ) => {
            if ( gaps.colGap ) styles[ `--${PREFIX}-${ bp }-col-gap` ] = gaps.colGap;
            if ( gaps.rowGap ) styles[ `--${PREFIX}-${ bp }-row-gap` ] = gaps.rowGap;
        } );
    }

    if ( breakpointCols ) {
        Object.entries( breakpointCols ).forEach( ( [ bp, count ] ) => {
            if ( count ) styles[ `--${PREFIX}-${ bp }-cols` ] = count;
        } );
    }

    return styles;
};