<?php
/**
 * Plugin Name: GutenGrid
 * Plugin URI:  https://github.com/fcdev-cloud/Gutengrid
 * Description: A 12-column grid layout block for WordPress.
 * Version:     1.0.0
 * Author:      Frank Collins
 * License:     GPL-2.0-or-later
 * Text Domain: gutengrid
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'GUTENGRID_VERSION', '1.0.0' );
define( 'GUTENGRID_DIR', plugin_dir_path( __FILE__ ) );
define( 'GUTENGRID_URL', plugin_dir_url( __FILE__ ) );

require_once GUTENGRID_DIR . 'includes/class-assets.php';
require_once GUTENGRID_DIR . 'includes/class-options.php';
require_once GUTENGRID_DIR . 'includes/class-css-generator.php';

function gutengrid_init() {
    register_block_type( GUTENGRID_DIR . 'blocks/grid/block.json' );
}
add_action( 'init', 'gutengrid_init' );

function gutengrid_bootstrap() {
    new GutenGrid_Assets();
    new GutenGrid_Options();
}
add_action( 'plugins_loaded', 'gutengrid_bootstrap' );

register_activation_hook( __FILE__, 'gutengrid_activate' );
function gutengrid_activate() {
    // Generate the CSS file with default breakpoints on activation
    GutenGrid_CSS_Generator::generate();
}

register_deactivation_hook( __FILE__, 'gutengrid_deactivate' );
function gutengrid_deactivate() {
    // Clean up the generated CSS file on deactivation
    $upload_dir = wp_upload_dir();
    $file_path  = $upload_dir['basedir'] . '/' . GutenGrid_CSS_Generator::GENERATED_FILE;

    if ( file_exists( $file_path ) ) {
        wp_delete_file( $file_path );
    }
}