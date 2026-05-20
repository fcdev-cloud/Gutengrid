<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GutenGrid_Assets {

    public function __construct() {
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_assets' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
        add_filter( 'block_editor_settings_all', [ $this, 'inject_editor_styles' ] );
    }

    /**
     * Editor assets — block JS and editor-only styles
     */
    public function enqueue_editor_assets() {
        $asset = require GUTENGRID_DIR . 'build/index.asset.php';

        wp_enqueue_script(
            'gutengrid-editor',
            GUTENGRID_URL . 'build/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        wp_enqueue_style(
            'gutengrid-editor-style',
            GUTENGRID_URL . 'build/index.css',
            [],
            $asset['version']
        );

        // Enqueue the dynamically generated container query CSS in the editor too
        $generated_css = GutenGrid_CSS_Generator::get_generated_file_url();

        if ( $generated_css ) {
            wp_enqueue_style(
                'gutengrid-grid',
                $generated_css,
                [ 'gutengrid-editor-style' ],
                GutenGrid_CSS_Generator::get_generated_file_version()
            );
        }
    }


    public function inject_editor_styles( $settings ) {
        $generated_css = GutenGrid_CSS_Generator::get_generated_file_url() . '?ver=' . GutenGrid_CSS_Generator::get_generated_file_version();

        if ( ! $generated_css ) {
            return $settings;
        }
        $settings['ggBase'] = GutenGrid_Options::get_base();
        $settings['styles'][] = [
            'css' => sprintf(
                '@import url("%s");',
                esc_url( $generated_css )
            ),
        ];

        $breakpoints  = GutenGrid_Options::get_breakpoints();
        $device_types = [ [ 'name' => 'Desktop', 'label' => 'Desktop' ] ];

        foreach ( $breakpoints as $bp ) {
            $device_types[] = [
                'name'   => $bp['name'],
                'label'  => strtoupper( $bp['name'] ),
                'width'  => $bp['width'],
                'colGap' => $bp['colGap'] ?? '1.5rem',
                'rowGap' => $bp['rowGap'] ?? '1.5rem',
                'cols'   => $bp['cols']   ?? GutenGrid_Options::get_max_cols(),
            ];
        }

        $settings['deviceTypes'] = $device_types;

        return $settings;
    }

    /**
     * Frontend assets — generated container query stylesheet
     */
    public function enqueue_frontend_assets() {
        $generated_css = GutenGrid_CSS_Generator::get_generated_file_url();

        wp_enqueue_style(
            'gutengrid-style',
            GUTENGRID_URL . 'build/style-index.css',
            [],
            GUTENGRID_VERSION
        );

        // Enqueue the dynamically generated container query CSS if it exists
        if ( $generated_css ) {
            wp_enqueue_style(
                'gutengrid-grid',
                $generated_css,
                [ 'gutengrid-style' ],
                GutenGrid_CSS_Generator::get_generated_file_version()
            );
        }
    }

    /**
     * Admin options page assets
     */
    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'settings_page_gutengrid' ) {
            return;
        }

        $asset = require GUTENGRID_DIR . 'build/admin.asset.php';

        wp_enqueue_script(
            'gutengrid-admin',
            GUTENGRID_URL . 'build/admin.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        wp_enqueue_style(
            'gutengrid-admin-style',
            GUTENGRID_URL . 'build/admin.css',
            [],
            $asset['version']
        );

        // Pass breakpoints and REST nonce to the admin JS
        wp_localize_script(
            'gutengrid-admin',
            'gutengridAdmin',
            [
                'breakpoints' => GutenGrid_Options::get_breakpoints(),
                'nonce'       => wp_create_nonce( 'wp_rest' ),
                'restUrl'     => rest_url( 'gutengrid/v1' ),
            ]
        );
    }
}