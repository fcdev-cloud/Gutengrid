<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GutenGrid_CSS_Generator {

    const GENERATED_FILE = 'gutengrid/gutengrid-grid.css';
    const COLUMNS        = 12;
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
        $css = "/* GutenGrid Generated CSS */\n\n";

        $css .= self::build_root_variables( $breakpoints );
        $css .= self::build_container_css();
        $css .= self::build_z_index_classes();

        // Base utility classes — no container query, applies below first breakpoint
        $css .= "/* Base Utilities */\n";
        $css .= self::build_utility_classes( 'base' );

        // Per-breakpoint utility classes with ranged container queries
        foreach ( $breakpoints as $index => $bp ) {
            $min_width  = $bp['width'];
            $next_bp    = $breakpoints[ $index + 1 ] ?? null;
            $max_width  = $next_bp ? $next_bp['width'] : null;

            $css .= "/* Breakpoint: {$bp['name']} ({$min_width}" . ( $max_width ? " — {$max_width}" : "+" ) . ") */\n";

            if ( $max_width ) {
                $css .= "@container (min-width: {$min_width}) and (max-width: calc( {$max_width} - 1px )) {\n";
            } else {
                // Last breakpoint — no upper bound
                $css .= "@container (min-width: {$min_width}) {\n";
            }

            $css .= self::build_utility_classes( $bp['name'] );
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

        $css  = ":root {\n";
        $css .= "    --gg-col-gap: {$base['colGap']};\n";
        $css .= "    --gg-row-gap: {$base['rowGap']};\n";
        $css .= "    --gg-cols: {$base['cols']};\n";
        $css .= "}\n\n";

        foreach ( $breakpoints as $bp ) {
            $col_gap = $bp['colGap'] ?? '1.5rem';
            $row_gap = $bp['rowGap'] ?? '1.5rem';
            $cols    = $bp['cols']   ?? self::COLUMNS;

            $css .= "@media (min-width: {$bp['width']}) {\n";
            $css .= "    :root {\n";
            $css .= "        --gg-{$bp['name']}-col-gap: {$col_gap};\n";
            $css .= "        --gg-{$bp['name']}-row-gap: {$row_gap};\n";
            $css .= "        --gg-{$bp['name']}-cols: {$cols};\n";
            $css .= "    }\n";
            $css .= "}\n\n";
        }

        return $css;
    }

    private static function build_container_css() {
        $prefix = self::PREFIX;
        $cols   = self::COLUMNS;

        return <<<CSS
.{$prefix} {
    container-type: inline-size;
}

.{$prefix}__inner {
    display: grid;
    grid-template-columns: repeat( var( --gg-cols, {$cols} ), 1fr );
    column-gap: var( --gg-col-gap, 1.5rem );
    row-gap: var( --gg-row-gap, 1.5rem );
}

.{$prefix}__inner > * {
    margin-block-start: 0 !important;
    margin-block-end: 0 !important;
    grid-column: span var( --gg-cols, {$cols} );
}

CSS;
    }

    private static function build_z_index_classes() {
        $prefix = self::PREFIX;
        $css    = "/* Z-Index / Layering */\n";

        $css .= ".{$prefix}-z-neg { z-index: -1; }\n";
        $css .= ".{$prefix}-z-top { z-index: 100; }\n";

        for ( $i = 1; $i <= 10; $i++ ) {
            $css .= ".{$prefix}-z-{$i} { z-index: {$i}; }\n";
        }

        return $css . "\n";
    }

    private static function build_utility_classes( $bp ) {
        $prefix = self::PREFIX;
        $infix  = $bp === 'base' ? '' : "-{$bp}";
        $css    = '';

        // Column start: 1–13
        for ( $i = 1; $i <= self::COLUMNS + 1; $i++ ) {
            $css .= ".{$prefix}{$infix}-col-s-{$i} { grid-column-start: {$i}; }\n";
        }

        // Column span: 1–12
        for ( $i = 1; $i <= self::COLUMNS; $i++ ) {
            $css .= ".{$prefix}{$infix}-col-z-{$i} { grid-column-end: span {$i}; }\n";
        }

        // Row start: 1–20
        for ( $i = 1; $i <= 20; $i++ ) {
            $css .= ".{$prefix}{$infix}-row-s-{$i} { grid-row-start: {$i}; }\n";
        }

        return $css;
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