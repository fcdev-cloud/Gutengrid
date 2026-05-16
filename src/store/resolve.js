import { register, createReduxStore } from '@wordpress/data';

export const resolvers = {
    async getBreakpoints() {
        const { dispatch } = await import( './index' );
        dispatch( 'gutengrid/options' ).fetchBreakpoints();
    },
};