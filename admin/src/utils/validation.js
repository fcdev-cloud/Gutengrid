import { __ } from '@wordpress/i18n';

const VALID_NAME  = /^[a-z0-9_-]+$/;
const VALID_WIDTH = /^\d+(\.\d+)?(px|em|rem|vw|vh|%)$/;

/**
 * Validate all breakpoints and return an errors object keyed by row id.
 * 
 * {
 *   'md-0': { name: 'Name is required' },
 *   'lg-1': { width: 'Must be a valid CSS length' },
 * }
 */
export const validateBreakpoints = ( breakpoints ) => {
    const errors = {};
    const seenNames = {};

    breakpoints.forEach( ( bp ) => {
        const rowErrors = {};

        // Name validation
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

        // Width validation
        if ( ! bp.width ) {
            rowErrors.width = __( 'Width is required.', 'gutengrid' );
        } else if ( ! VALID_WIDTH.test( bp.width ) ) {
            rowErrors.width = __( 'Must be a valid CSS length e.g. 768px.', 'gutengrid' );
        }

        if ( Object.keys( rowErrors ).length > 0 ) {
            errors[ bp.id ] = rowErrors;
        }
    } );

    return errors;
};