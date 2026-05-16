<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GutenGrid_Options {

    const BASE_OPTION_KEY = 'gutengrid_base';
    const DEFAULT_BASE = [
        'colGap' => '1.5rem',
        'rowGap' => '1.5rem',
        'cols'   => 12,
    ];

    const OPTION_KEY = 'gutengrid_breakpoints';

    const DEFAULT_BREAKPOINTS = [
        [
            'name'   => 'sm',
            'width'  => '400px',
            'colGap' => '1.5rem',
            'rowGap' => '1.5rem',
            'cols'   => 12,
        ],
        [
            'name'   => 'md',
            'width'  => '600px',
            'colGap' => '1.5rem',
            'rowGap' => '1.5rem',
            'cols'   => 12,
        ],
        [
            'name'   => 'lg',
            'width'  => '900px',
            'colGap' => '1.5rem',
            'rowGap' => '1.5rem',
            'cols'   => 12,
        ]
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
            self::BASE_OPTION_KEY,
            [
                'type'              => 'object',
                'sanitize_callback' => [ $this, 'sanitize_base' ],
                'default'           => self::DEFAULT_BASE,
            ]
        );

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
            '/base',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [ $this, 'rest_get_base' ],
                    'permission_callback' => '__return_true',
                ],
                [
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => [ $this, 'rest_update_base' ],
                    'permission_callback' => function() {
                        return current_user_can( 'manage_options' );
                    },
                ],
            ]
        );

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


    public function rest_get_base() {
        return rest_ensure_response( self::get_base() );
    }

    public function rest_get_breakpoints() {
        return rest_ensure_response( self::get_breakpoints() );
    }

    

    public function rest_update_base( WP_REST_Request $request ) {
        $base      = $request->get_json_params();
        $sanitized = $this->sanitize_base( $base );

        update_option( self::BASE_OPTION_KEY, $sanitized );

        // Regenerate CSS with updated base settings
        GutenGrid_CSS_Generator::generate();

        return rest_ensure_response( $sanitized );
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
     * Get the base settings from the database, falling back to defaults
     */
    public static function get_base() {
        return get_option( self::BASE_OPTION_KEY, self::DEFAULT_BASE );
    }

    /**
     * Get breakpoints from the database, falling back to defaults
     */
    public static function get_breakpoints() {
        return get_option( self::OPTION_KEY, self::DEFAULT_BREAKPOINTS );
    }


    /**
     * Sanitize the base settings before saving
     */
    public function sanitize_base( $base ) {
        if ( ! is_array( $base ) ) {
            return self::DEFAULT_BASE;
        }

        return [
            'colGap' => sanitize_text_field( $base['colGap'] ?? '1.5rem' ),
            'rowGap' => sanitize_text_field( $base['rowGap'] ?? '1.5rem' ),
            'cols'   => absint( $base['cols'] ?? 12 ),
        ];
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
                        'name'   => sanitize_key( $bp['name'] ),
                        'width'  => sanitize_text_field( $bp['width'] ),
                        'colGap' => sanitize_text_field( $bp['colGap'] ?? '1.5rem' ),
                        'rowGap' => sanitize_text_field( $bp['rowGap'] ?? '1.5rem' ),
                        'cols'   => absint( $bp['cols'] ?? 12 ),
                    ];
                }, $breakpoints )
            )
        );
    }
}