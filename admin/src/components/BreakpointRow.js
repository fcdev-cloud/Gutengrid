import { __ } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function BreakpointRow( { breakpoint, errors, onChange, onRemove } ) {
    const { id, name, width } = breakpoint;

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