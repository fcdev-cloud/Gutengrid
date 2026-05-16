import { __ } from '@wordpress/i18n';

export default function SaveButton( { onClick, isSaving, disabled } ) {
    return (
        <button
            className="button button-primary gutengrid-admin__save"
            onClick={ onClick }
            disabled={ disabled }
        >
            { isSaving
                ? __( 'Saving…', 'gutengrid' )
                : __( 'Save breakpoints', 'gutengrid' )
            }
        </button>
    );
}