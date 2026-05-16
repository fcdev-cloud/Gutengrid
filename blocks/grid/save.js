import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
    const { columnGap, rowGap } = attributes;

    const blockProps = useBlockProps.save( {
        className: 'gg',
        style: {
            columnGap,
            rowGap,
            '--gg-column-gap': columnGap,
            '--gg-row-gap': rowGap,
        },
    } );

    return (
        <div { ...blockProps }>
            <div className="gg__inner">
                <InnerBlocks.Content />
            </div>
        </div>
    );
}