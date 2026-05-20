import { __ } from '@wordpress/i18n';
import { MAX_COLS } from '../../../src/constants';
export default function BaseSettings( { base, errors, onChange } ) {
    const { colGap, rowGap, cols } = base;

    return (
        <div className="gutengrid-admin__base">
            <h2>{ __( 'Base Settings', 'gutengrid' ) }</h2>
            <p className="gutengrid-admin__base-description">
                { __( 'Default grid settings. Falls back to these values when no other breakpoints are matched.', 'gutengrid' ) }
            </p>

            <div className="gutengrid-admin__fields">
                <div className="gutengrid-admin__field">
                    <label>{ __( 'Col gap', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ colGap ?? '1.5rem' }
                        onChange={ ( e ) => onChange( 'colGap', e.target.value ) }
                        placeholder="1.5rem"
                        className={ errors?.colGap ? 'has-error' : '' }
                    />
                    { errors?.colGap && (
                        <span className="gutengrid-admin__error">{ errors.colGap }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Row gap', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ rowGap ?? '1.5rem' }
                        onChange={ ( e ) => onChange( 'rowGap', e.target.value ) }
                        placeholder="1.5rem"
                        className={ errors?.rowGap ? 'has-error' : '' }
                    />
                    { errors?.rowGap && (
                        <span className="gutengrid-admin__error">{ errors.rowGap }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Cols', 'gutengrid' ) }</label>
                    <input
                        type="number"
                        value={ cols ?? MAX_COLS }
                        min="1"
                        max={ MAX_COLS }
                        onChange={ ( e ) => onChange( 'cols', parseInt( e.target.value ) ) }
                        className={ errors?.cols ? 'has-error' : '' }
                    />
                    { errors?.cols && (
                        <span className="gutengrid-admin__error">{ errors.cols }</span>
                    ) }
                </div>
            </div>
        </div>
    );
}