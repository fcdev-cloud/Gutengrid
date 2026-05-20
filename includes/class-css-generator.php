<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if(!function_exists('var_error_log')) {
    function var_error_log( $object=null ){
        ob_start();
        var_dump( $object );
        $content = ob_get_contents();
        ob_end_clean();
        error_log( $content );
    }
}

class GutenGrid_CSS_Generator {

    const GENERATED_FILE = 'gutengrid/gutengrid-grid.css';
    const PREFIX         = 'gg';

    public static function generate( $breakpoints = null ) {
        if ( null === $breakpoints ) {
            $breakpoints = GutenGrid_Options::get_breakpoints();
        }

        $css = self::build_css( $breakpoints );

        $upload_dir = wp_upload_dir();
        $file_dir   = $upload_dir['basedir'] . '/gutengrid';
        $file_path  = $upload_dir['basedir'] . '/' . self::GENERATED_FILE;

        if ( ! file_exists( $file_dir ) ) {
            wp_mkdir_p( $file_dir );
        }

        file_put_contents( $file_path, $css );

        update_option( 'gutengrid_css_version', time() );
    }

    private static function build_css( $breakpoints ) {
        $prefix = self::PREFIX;
        $css = "/* GutenGrid Generated CSS */\n\n";
        $css .= self::build_root_variables( $breakpoints );
        $css .= self::build_container_css();

        // Per-breakpoint utility classes with ranged media queries
        foreach ( $breakpoints as $index => $bp ) {
            $prev_bp    = $breakpoints[ $index - 1 ] ?? null;
            $min_width  = $prev_bp ? $prev_bp['width'] : '0px';
            $max_width  = $bp['width'];
            $max_cols = GutenGrid_Options::get_max_cols();
            $css .='/* Utility classes for breakpoint: ' . $bp['name'] . " */\n";
            
            $css .= "@media (min-width: calc({$min_width} + 1px)) and (max-width: {$max_width}) {\n";
            $css .= ".{$prefix}__inner > * {\n";
            $css .= "    grid-column-start: var( --{$prefix}-col-start-{$bp['name']}, var( --{$prefix}-col-start, auto ) );\n";
            $css .= "    grid-column-end:   span var( --{$prefix}-col-span-{$bp['name']}, var( --{$prefix}-col-span, var( --{$prefix}-cols, {$max_cols} ) ) );\n";
            $css .= "    grid-row-start:    var( --{$prefix}-row-start-{$bp['name']}, var( --{$prefix}-row-start, auto ) );\n";
            $css .= "    grid-row-end:      span var( --{$prefix}-row-span-{$bp['name']}, var( --{$prefix}-row-span, 1 ) );\n";
            $css .= "    justify-self:      var( --{$prefix}-justify-self-{$bp['name']}, var( --{$prefix}-justify-self ) );\n";
            $css .= "    align-self:        var( --{$prefix}-align-self-{$bp['name']}, var( --{$prefix}-align-self ) );\n";
            $css .= "    order:             var( --{$prefix}-order-{$bp['name']}, var( --{$prefix}-order ) );\n";
            $css .= "}\n\n";
            $css .= "}\n\n";
        }

        return $css;
    }

    /**
     * Global CSS custom property defaults.
     * Per-breakpoint defaults use standard media queries on :root
     */
    private static function build_root_variables( $breakpoints ) {
        $base = GutenGrid_Options::get_base();
        $prefix = self::PREFIX;
        $css  = ":root {\n";
        $css .= "    --{$prefix}-col-gap: {$base['colGap']};\n";
        $css .= "    --{$prefix}-row-gap: {$base['rowGap']};\n";
        $css .= "    --{$prefix}-cols: {$base['cols']};\n";
        $css .= "    --{$prefix}-z-index: 1";
        $css .= "}\n\n";

        foreach ( $breakpoints as $index => $bp ) {
            $prev_bp    = $breakpoints[ $index - 1 ] ?? null;
            $min_width  = $prev_bp ? $prev_bp['width'] : '0px';
            $max_width  = $bp['width'];
            $col_gap = $bp['colGap'] ?? '1.5rem';
            $row_gap = $bp['rowGap'] ?? '1.5rem';
            $cols    = $bp['cols']   ?? GutenGrid_Options::get_max_cols();

            $css .= "@media (min-width: calc({$min_width} + 1px)) and (max-width: {$max_width}) {\n";
            $css .= "    :root {\n";
            $css .= "        --{$prefix}-{$bp['name']}-col-gap: {$col_gap};\n";
            $css .= "        --{$prefix}-{$bp['name']}-row-gap: {$row_gap};\n";
            $css .= "        --{$prefix}-{$bp['name']}-cols: {$cols};\n";
            $css .= "    }\n";
            $css .= "}\n\n";
        }

        return $css;
    }

    private static function build_container_css() {
        $prefix = self::PREFIX;
        $cols   = GutenGrid_Options::get_max_cols();

        return <<<CSS
.{$prefix} {
    container-type: inline-size;
}

.{$prefix}__inner {
    display: grid;
    grid-template-columns: repeat( var( --{$prefix}-cols, {$cols} ), 1fr );
    column-gap: var( --{$prefix}-col-gap, 1.5rem );
    row-gap: var( --{$prefix}-row-gap, 1.5rem );
}

.{$prefix}__inner > * {
    margin-block-start: 0 !important;
    margin-block-end: 0 !important;
    grid-column-start: var( --{$prefix}-col-start, auto );
    grid-column-end:   span var( --{$prefix}-col-span, var( --{$prefix}-cols, {$cols} ) );
    grid-row-start:    var( --{$prefix}-row-start, auto );
    grid-row-end:      span var( --{$prefix}-row-span, 1 );
    justify-self:      var( --{$prefix}-justify-self );
    align-self:        var( --{$prefix}-align-self );
    order:             var( --{$prefix}-order );
    z-index:           var(--{$prefix}-z-index, 1);
}

CSS;
    }


    public static function get_generated_file_url() {
        $upload_dir = wp_upload_dir();
        $file_path  = $upload_dir['basedir'] . '/' . self::GENERATED_FILE;

        if ( ! file_exists( $file_path ) ) {
            return false;
        }

        return $upload_dir['baseurl'] . '/' . self::GENERATED_FILE;
    }

    public static function get_generated_file_version() {
        return get_option( 'gutengrid_css_version', '1.0.0' );
    }
}
