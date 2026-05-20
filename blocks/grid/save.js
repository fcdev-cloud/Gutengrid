import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { buildInlineStyles } from '../../src/utils/buildInlineStyles';
import { PREFIX } from '../../src/constants';

export default function Save( { attributes } ) {
    const { colGap, rowGap, breakpointGaps, cols, breakpointCols } = attributes;

    const blockProps = useBlockProps.save( {
        className: `${PREFIX}`,
        style: buildInlineStyles( attributes ),
    } );

    return (
        <div { ...blockProps }>
            <div className={`${PREFIX}__inner`}>
                <InnerBlocks.Content />
            </div>
        </div>
    );
}