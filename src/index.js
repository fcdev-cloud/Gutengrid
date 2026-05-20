import '../blocks/grid/styles/editor.scss';
import './store';
import { registerBlockType } from '@wordpress/blocks';
import metadata from '../blocks/grid/block.json';
import edit from '../blocks/grid/edit';
import save from '../blocks/grid/save';
import './hooks/withGridControls';
import './filters/withGridStyles';

// Block registration
registerBlockType( metadata.name, {
    edit,
    save,
} );