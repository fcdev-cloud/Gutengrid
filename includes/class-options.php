<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GutenGrid_Options {

    const OPTION_KEY = 'gutengrid_breakpoints';

    const DEFAULT_BREAKPOINTS = [
        [
            'name'  => 'xl',
            'width' => '1200px',
        ],
        [
            'name'  => 'lg',
            'width' => '900px',
        ],
        [
            'name'  => 'md',
            'width' => '600px',
        ],
        [
            'name'  => 'sm',
            'width' => '400px',
        ],
    ];

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_options_page' ] );
        add_action( 'init', [ $this, 'register_settings' ] );
        add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
    }

    /**
     * Register the options page under Settings
     */
    public function register_options_page() {
        add_options_page(
            __( 'GutenGrid Settings', 'gutengrid' ),
            __( 'GutenGrid', 'gutengrid' ),
            'manage_options',
            'gutengrid',
            [ $this, 'render_options_page' ]
        );
    }

    /**
     * Render the options page — the React admin bundle mounts here
     */
    public function render_options_page() {
        echo '<div id="gutengrid-admin"></div>';
    }

    /**
     * Register the setting with the WordPress settings API
     */
    public function register_settings() {
        register_setting(
            'gutengrid',
            self::OPTION_KEY,
            [
                'type'              => 'array',
                'sanitize_callback' => [ $this, 'sanitize_breakpoints' ],
                'default'           => self::DEFAULT_BREAKPOINTS,
            ]
        );
    }

    /**
     * REST routes so the editor JS and admin React app can read/write breakpoints
     */
    public function register_rest_routes() {
        register_rest_route(
            'gutengrid/v1',
            '/breakpoints',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [ $this, 'rest_get_breakpoints' ],
                    'permission_callback' => '__return_true',
                ],
                [
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => [ $this, 'rest_update_breakpoints' ],
                    'permission_callback' => function() {
                        return current_user_can( 'manage_options' );
                    },
                ],
            ]
        );
    }

    public function rest_get_breakpoints() {
        return rest_ensure_response( self::get_breakpoints() );
    }

    public function rest_update_breakpoints( WP_REST_Request $request ) {
        $breakpoints = $request->get_json_params();
        $sanitized   = $this->sanitize_breakpoints( $breakpoints );

        update_option( self::OPTION_KEY, $sanitized );

        // Regenerate the container query stylesheet
        GutenGrid_CSS_Generator::generate( $sanitized );

        return rest_ensure_response( $sanitized );
    }

    /**
     * Get breakpoints from the database, falling back to defaults
     */
    public static function get_breakpoints() {
        return get_option( self::OPTION_KEY, self::DEFAULT_BREAKPOINTS );
    }

    /**
     * Sanitize breakpoints array before saving
     */
    public function sanitize_breakpoints( $breakpoints ) {
        if ( ! is_array( $breakpoints ) ) {
            return self::DEFAULT_BREAKPOINTS;
        }

        return array_values(
            array_filter(
                array_map( function( $bp ) {
                    if ( empty( $bp['name'] ) || empty( $bp['width'] ) ) {
                        return null;
                    }

                    return [
                        'name'  => sanitize_key( $bp['name'] ),
                        'width' => sanitize_text_field( $bp['width'] ),
                    ];
                }, $breakpoints )
            )
        );
    }
}