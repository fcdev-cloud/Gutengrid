import { __ } from '@wordpress/i18n';

const VALID_NAME  = /^[a-z0-9_-]+$/;
const VALID_WIDTH = /^\d+(\.\d+)?(px|em|rem|vw|vh|%)$/;
const VALID_GAP   = /^\d+(\.\d+)?(px|em|rem|vw|vh|%)$/;


export const validateBase = ( base ) => {
    const errors = {};

    if ( base.colGap && ! VALID_GAP.test( base.colGap ) ) {
        errors.colGap = __( 'Must be a valid CSS length e.g. 1.5rem.', 'gutengrid' );
    }

    if ( base.rowGap && ! VALID_GAP.test( base.rowGap ) ) {
        errors.rowGap = __( 'Must be a valid CSS length e.g. 1.5rem.', 'gutengrid' );
    }

    if ( base.cols && ( base.cols < 1 || base.cols > 12 ) ) {
        errors.cols = __( 'Cols must be between 1 and 12.', 'gutengrid' );
    }

    return errors;
};

export const validateBreakpoints = ( breakpoints ) => {
    const errors  = {};
    const seenNames = {};

    breakpoints.forEach( ( bp ) => {
        const rowErrors = {};

        if ( ! bp.name ) {
            rowErrors.name = __( 'Name is required.', 'gutengrid' );
        } else if ( ! VALID_NAME.test( bp.name ) ) {
            rowErrors.name = __( 'Lowercase letters, numbers, - and _ only.', 'gutengrid' );
        } else if ( seenNames[ bp.name ] ) {
            rowErrors.name = __( 'Name must be unique.', 'gutengrid' );
        }

        if ( bp.name ) {
            seenNames[ bp.name ] = true;
        }

        if ( ! bp.width ) {
            rowErrors.width = __( 'Width is required.', 'gutengrid' );
        } else if ( ! VALID_WIDTH.test( bp.width ) ) {
            rowErrors.width = __( 'Must be a valid CSS length e.g. 768px.', 'gutengrid' );
        }

        if ( bp.colGap && ! VALID_GAP.test( bp.colGap ) ) {
            rowErrors.colGap = __( 'Must be a valid CSS length e.g. 1.5rem.', 'gutengrid' );
        }

        if ( bp.rowGap && ! VALID_GAP.test( bp.rowGap ) ) {
            rowErrors.rowGap = __( 'Must be a valid CSS length e.g. 1.5rem.', 'gutengrid' );
        }

        if ( bp.cols && ( bp.cols < 1 || bp.cols > 12 ) ) {
            rowErrors.cols = __( 'Cols must be between 1 and 12.', 'gutengrid' );
        }

        if ( Object.keys( rowErrors ).length > 0 ) {
            errors[ bp.id ] = rowErrors;
        }
    } );

    return errors;
};