import { __ } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function BreakpointRow( { breakpoint, errors, onChange, onRemove } ) {
    const { id, name, width, colGap, rowGap, cols } = breakpoint;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable( { id } );

    const style = {
        transform: CSS.Transform.toString( transform ),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={ setNodeRef }
            style={ style }
            className="gutengrid-admin__row"
        >
            <button
                className="gutengrid-admin__drag-handle"
                { ...attributes }
                { ...listeners }
                aria-label={ __( 'Drag to reorder', 'gutengrid' ) }
            >
                ⠿
            </button>

            <div className="gutengrid-admin__fields">
                <div className="gutengrid-admin__field">
                    <label>{ __( 'Name', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ name }
                        onChange={ ( e ) => onChange( id, 'name', e.target.value ) }
                        placeholder="md"
                        className={ errors.name ? 'has-error' : '' }
                    />
                    { errors.name && (
                        <span className="gutengrid-admin__error">{ errors.name }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Min width', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ width }
                        onChange={ ( e ) => onChange( id, 'width', e.target.value ) }
                        placeholder="768px"
                        className={ errors.width ? 'has-error' : '' }
                    />
                    { errors.width && (
                        <span className="gutengrid-admin__error">{ errors.width }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Col gap', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ colGap ?? '1.5rem' }
                        onChange={ ( e ) => onChange( id, 'colGap', e.target.value ) }
                        placeholder="1.5rem"
                        className={ errors.colGap ? 'has-error' : '' }
                    />
                    { errors.colGap && (
                        <span className="gutengrid-admin__error">{ errors.colGap }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Row gap', 'gutengrid' ) }</label>
                    <input
                        type="text"
                        value={ rowGap ?? '1.5rem' }
                        onChange={ ( e ) => onChange( id, 'rowGap', e.target.value ) }
                        placeholder="1.5rem"
                        className={ errors.rowGap ? 'has-error' : '' }
                    />
                    { errors.rowGap && (
                        <span className="gutengrid-admin__error">{ errors.rowGap }</span>
                    ) }
                </div>

                <div className="gutengrid-admin__field">
                    <label>{ __( 'Cols', 'gutengrid' ) }</label>
                    <input
                        type="number"
                        value={ cols ?? 12 }
                        min="1"
                        max="12"
                        onChange={ ( e ) => onChange( id, 'cols', parseInt( e.target.value ) ) }
                        className={ errors.cols ? 'has-error' : '' }
                    />
                    { errors.cols && (
                        <span className="gutengrid-admin__error">{ errors.cols }</span>
                    ) }
                </div>
            </div>

            <button
                className="gutengrid-admin__remove"
                onClick={ () => onRemove( id ) }
                aria-label={ __( 'Remove breakpoint', 'gutengrid' ) }
            >
                ✕
            </button>
        </div>
    );
}