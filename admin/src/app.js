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
import BaseSettings from './components/BaseSettings';
import SaveButton from './components/SaveButton';
import Notice from './components/Notice';
import { validateBreakpoints, validateBase } from './utils/validation';

export default function App() {
    const [ breakpoints, setBreakpoints ] = useState( [] );
    const [ base, setBase ]               = useState( { colGap: '1.5rem', rowGap: '1.5rem', cols: 12 } );
    const [ notice, setNotice ]           = useState( null );
    const [ isSaving, setIsSaving ]       = useState( false );
    const [ isLoading, setIsLoading ]     = useState( true );

    const sensors = useSensors(
        useSensor( PointerSensor ),
        useSensor( KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        } )
    );

    useEffect( () => {
        Promise.all( [
            fetch( `${ gutengridAdmin.restUrl }/breakpoints`, {
                headers: { 'X-WP-Nonce': gutengridAdmin.nonce },
            } ).then( ( res ) => res.json() ),
            fetch( `${ gutengridAdmin.restUrl }/base`, {
                headers: { 'X-WP-Nonce': gutengridAdmin.nonce },
            } ).then( ( res ) => res.json() ),
        ] )
            .then( ( [ breakpointData, baseData ] ) => {
                setBreakpoints(
                    breakpointData.map( ( bp, i ) => ( { ...bp, id: `${ bp.name }-${ i }` } ) )
                );
                setBase( baseData );
            } )
            .finally( () => setIsLoading( false ) );
    }, [] );

    const baseErrors       = validateBase( base );
    const breakpointErrors = validateBreakpoints( breakpoints );
    const hasErrors        = Object.keys( baseErrors ).length > 0 || Object.keys( breakpointErrors ).length > 0;

    const handleDragEnd = ( event ) => {
        const { active, over } = event;
        if ( active.id === over?.id ) return;

        setBreakpoints( ( prev ) => {
            const oldIndex = prev.findIndex( ( bp ) => bp.id === active.id );
            const newIndex = prev.findIndex( ( bp ) => bp.id === over.id );
            return arrayMove( prev, oldIndex, newIndex );
        } );
    };

    const handleBreakpointChange = ( id, field, value ) => {
        setBreakpoints( ( prev ) =>
            prev.map( ( bp ) => bp.id === id ? { ...bp, [ field ]: value } : bp )
        );
    };

    const handleBaseChange = ( field, value ) => {
        setBase( ( prev ) => ( { ...prev, [ field ]: value } ) );
    };

    const handleAdd = () => {
        const id = `new-${ Date.now() }`;
        setBreakpoints( ( prev ) => [
            ...prev,
            { id, name: '', width: '', colGap: '1.5rem', rowGap: '1.5rem', cols: 12 },
        ] );
    };

    const handleRemove = ( id ) => {
        setBreakpoints( ( prev ) => prev.filter( ( bp ) => bp.id !== id ) );
    };

    const handleSave = async () => {
        setIsSaving( true );
        setNotice( null );

        try {
            await Promise.all( [
                fetch( `${ gutengridAdmin.restUrl }/breakpoints`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': gutengridAdmin.nonce,
                    },
                    body: JSON.stringify(
                        breakpoints.map( ( { id, ...bp } ) => bp )
                    ),
                } ),
                fetch( `${ gutengridAdmin.restUrl }/base`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': gutengridAdmin.nonce,
                    },
                    body: JSON.stringify( base ),
                } ),
            ] );

            setNotice( { type: 'success', message: __( 'Settings saved.', 'gutengrid' ) } );
        } catch {
            setNotice( { type: 'error', message: __( 'Failed to save settings.', 'gutengrid' ) } );
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

            <BaseSettings
                base={ base }
                errors={ baseErrors }
                onChange={ handleBaseChange }
            />

            <hr className="gutengrid-admin__divider" />

            <h2>{ __( 'Breakpoints', 'gutengrid' ) }</h2>

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
                            errors={ breakpointErrors[ bp.id ] ?? {} }
                            onChange={ handleBreakpointChange }
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