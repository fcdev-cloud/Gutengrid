import { register, createReduxStore, dispatch } from '@wordpress/data';

const DEFAULT_STATE = {
    breakpoints: [],
    isLoading: false,
    hasLoaded: false,
};

const actions = {
    setBreakpoints( breakpoints ) {
        return { type: 'SET_BREAKPOINTS', breakpoints };
    },
    setIsLoading( isLoading ) {
        return { type: 'SET_IS_LOADING', isLoading };
    },
};

const selectors = {
    getBreakpoints: ( state ) => state.breakpoints,
    isLoading:      ( state ) => state.isLoading,
    hasLoaded:      ( state ) => state.hasLoaded,
};

const reducer = ( state = DEFAULT_STATE, action ) => {
    switch ( action.type ) {
        case 'SET_BREAKPOINTS':
            return { ...state, breakpoints: action.breakpoints, hasLoaded: true };
        case 'SET_IS_LOADING':
            return { ...state, isLoading: action.isLoading };
        default:
            return state;
    }
};

const resolvers = {
    async getBreakpoints() {
        dispatch( 'gutengrid/options' ).setIsLoading( true );
        try {
            const res = await fetch( `${ window.wpApiSettings.root }gutengrid/v1/breakpoints` );
            const data = await res.json();
            dispatch( 'gutengrid/options' ).setBreakpoints( data );
        } catch ( e ) {
            console.error( 'GutenGrid: failed to fetch breakpoints', e );
        } finally {
            dispatch( 'gutengrid/options' ).setIsLoading( false );
        }
    },
};

const store = createReduxStore( 'gutengrid/options', {
    reducer,
    actions,
    selectors,
    resolvers,
} );

register( store );