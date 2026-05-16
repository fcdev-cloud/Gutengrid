import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { buildInlineStyles } from '../../src/utils/buildInlineStyles';

export default function Save( { attributes } ) {
    const { colGap, rowGap, breakpointGaps, cols, breakpointCols } = attributes;

    const blockProps = useBlockProps.save( {
        className: 'gg',
        style: buildInlineStyles( attributes ),
    } );

    return (
        <div { ...blockProps }>
            <div className="gg__inner">
                <InnerBlocks.Content />
            </div>
        </div>
    );
}