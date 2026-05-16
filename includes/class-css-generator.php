<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GutenGrid_CSS_Generator {

    const GENERATED_FILE = 'gutengrid/gutengrid-grid.css';
    const COLUMNS        = 12;
    const PREFIX         = 'gg';

    /**
     * Generate the container query stylesheet and write it to the uploads directory
     */
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

    /**
     * Build the full CSS string
     */
    private static function build_css( $breakpoints ) {
        $css = "/* GutenGrid Generated CSS */\n\n";

        // Base grid container and item resets
        $css .= self::build_container_css();

        // Global Z-Index Utilities
        $css .= self::build_z_index_classes();

        // Mobile and desktop utility classes
        $css .= "/* Base Utilities */\n";
        $css .= self::build_utility_classes( 'base' );

        // breakpoint utility classes
        foreach ( $breakpoints as $bp ) {
            $css .= "/* Breakpoint: {$bp['label']} ({$bp['width']}) */\n";
            $css .= "@media (min-width: {$bp['width']}) {\n";
            $css .= self::build_utility_classes( $bp['name'] );
            $css .= "}\n\n";
        }

        return $css;
    }

    /**
     * The core grid container styles
     */
    private static function build_container_css() {
        $prefix = self::PREFIX;
        return "
.{$prefix} {
    container-type: inline-size;
}

.{$prefix}__inner {
    display: grid;
    grid-template-columns: repeat( " . self::COLUMNS . ", 1fr );
    column-gap: var( --gutengrid-column-gap, 1.5rem );
    row-gap: var( --gutengrid-row-gap, 1.5rem );
}

.{$prefix}__inner > * {
    margin-block-start: 0 !important;
    margin-block-end: 0 !important;
    grid-column: span " . self::COLUMNS . "; /* Default full width */
}\n\n";
    }

    /**
     * Build Z-Index classes
     */
    private static function build_z_index_classes() {
        $prefix = self::PREFIX;
        $css = "/* Z-Index / Layering */\n";
        
        // Negative and Top
        $css .= ".{$prefix}-z-neg { z-index: -1; }\n";
        $css .= ".{$prefix}-z-top { z-index: 100; }\n";

        // 1-10 scale
        for ( $i = 1; $i <= 10; $i++ ) {
            $css .= ".{$prefix}-z-{$i} { z-index: {$i}; }\n";
        }
        
        return $css . "\n";
    }

    /**
     * Build col-start, col-span, and row-start classes for a given breakpoint
     */
    private static function build_utility_classes( $bp ) {
        $prefix = self::PREFIX;
        $infix  = $bp === 'base' ? '' : "-{$bp}";
        $css    = "";

        // Column Start: 1–13
        for ( $i = 1; $i <= self::COLUMNS + 1; $i++ ) {
            $css .= ".{$prefix}{$infix}-col-s-{$i} { grid-column-start: {$i}; }\n";
        }

        // Column Span: 1–12
        for ( $i = 1; $i <= self::COLUMNS; $i++ ) {
            $css .= ".{$prefix}{$infix}-col-z-{$i} { grid-column-end: span {$i}; }\n";
        }

        // Row Start: 1–20 (Decent range for reordering)
        for ( $i = 1; $i <= 20; $i++ ) {
            $css .= ".{$prefix}{$infix}-row-s-{$i} { grid-row-start: {$i}; }\n";
        }

        return $css;
    }

    /**
     * Get the URL of the generated CSS file
     */
    public static function get_generated_file_url() {
        $upload_dir = wp_upload_dir();
        $file_path  = $upload_dir['basedir'] . '/' . self::GENERATED_FILE;

        if ( ! file_exists( $file_path ) ) {
            return false;
        }

        return $upload_dir['baseurl'] . '/' . self::GENERATED_FILE;
    }

    /**
     * Get the version timestamp for cache busting
     */
    public static function get_generated_file_version() {
        return get_option( 'gutengrid_css_version', '1.0.0' );
    }
}