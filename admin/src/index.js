import { render } from '@wordpress/element';
import App from './App';
import './styles/admin.scss';

const root = document.getElementById( 'gutengrid-admin' );

if ( root ) {
    render( <App />, root );
}