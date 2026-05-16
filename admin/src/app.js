import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';

import BreakpointRow from './components/BreakpointRow';
import SaveButton from './components/SaveButton';
import Notice from './components/Notice';
import { validateBreakpoints } from './utils/validation';

export default function App() {
    const [ breakpoints, setBreakpoints ] = useState( [] );
    const [ notice, setNotice ]           = useState( null );
    const [ isSaving, setIsSaving ]       = useState( false );
    const [ isLoading, setIsLoading ]     = useState( true );

    const sensors = useSensors(
        useSensor( PointerSensor ),
        useSensor( KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        } )
    );

    // Fetch breakpoints from REST on mount
    useEffect( () => {
        fetch( `${ gutengridAdmin.restUrl }/breakpoints`, {
            headers: {
                'X-WP-Nonce': gutengridAdmin.nonce,
            },
        } )
            .then( ( res ) => res.json() )
            .then( ( data ) => {
                // Attach a stable id to each row for dnd-kit
                setBreakpoints(
                    data.map( ( bp, i ) => ( { ...bp, id: `${ bp.name }-${ i }` } ) )
                );
            } )
            .finally( () => setIsLoading( false ) );
    }, [] );

    const errors = validateBreakpoints( breakpoints );
    const hasErrors = Object.keys( errors ).length > 0;

    const handleDragEnd = ( event ) => {
        const { active, over } = event;
        if ( active.id === over?.id ) return;

        setBreakpoints( ( prev ) => {
            const oldIndex = prev.findIndex( ( bp ) => bp.id === active.id );
            const newIndex = prev.findIndex( ( bp ) => bp.id === over.id );
            return arrayMove( prev, oldIndex, newIndex );
        } );
    };

    const handleChange = ( id, field, value ) => {
        setBreakpoints( ( prev ) =>
            prev.map( ( bp ) =>
                bp.id === id ? { ...bp, [ field ]: value } : bp
            )
        );
    };

    const handleAdd = () => {
        const id = `new-${ Date.now() }`;
        setBreakpoints( ( prev ) => [
            ...prev,
            { id, name: '', width: '' },
        ] );
    };

    const handleRemove = ( id ) => {
        setBreakpoints( ( prev ) => prev.filter( ( bp ) => bp.id !== id ) );
    };

    const handleSave = async () => {
        setIsSaving( true );
        setNotice( null );

        try {
            const res = await fetch( `${ gutengridAdmin.restUrl }/breakpoints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': gutengridAdmin.nonce,
                },
                body: JSON.stringify(
                    // Strip the client-side id before sending to PHP
                    breakpoints.map( ( { id, ...bp } ) => bp )
                ),
            } );

            if ( ! res.ok ) throw new Error();

            setNotice( { type: 'success', message: __( 'Breakpoints saved.', 'gutengrid' ) } );
        } catch {
            setNotice( { type: 'error', message: __( 'Failed to save breakpoints.', 'gutengrid' ) } );
        } finally {
            setIsSaving( false );
        }
    };

    if ( isLoading ) {
        return <p>{ __( 'Loading…', 'gutengrid' ) }</p>;
    }

    return (
        <div className="gutengrid-admin">
            <h1>{ __( 'GutenGrid Settings', 'gutengrid' ) }</h1>

            { notice && (
                <Notice
                    type={ notice.type }
                    message={ notice.message }
                    onDismiss={ () => setNotice( null ) }
                />
            ) }

            <DndContext
                sensors={ sensors }
                collisionDetection={ closestCenter }
                onDragEnd={ handleDragEnd }
            >
                <SortableContext
                    items={ breakpoints.map( ( bp ) => bp.id ) }
                    strategy={ verticalListSortingStrategy }
                >
                    { breakpoints.map( ( bp ) => (
                        <BreakpointRow
                            key={ bp.id }
                            breakpoint={ bp }
                            errors={ errors[ bp.id ] ?? {} }
                            onChange={ handleChange }
                            onRemove={ handleRemove }
                        />
                    ) ) }
                </SortableContext>
            </DndContext>

            <button
                className="gutengrid-admin__add"
                onClick={ handleAdd }
            >
                { __( '+ Add breakpoint', 'gutengrid' ) }
            </button>

            <SaveButton
                onClick={ handleSave }
                isSaving={ isSaving }
                disabled={ hasErrors || isSaving }
            />
        </div>
    );
}