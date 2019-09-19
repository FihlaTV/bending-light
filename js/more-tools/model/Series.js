// Copyright 2015-2017, University of Colorado Boulder

/**
 * Series of data points to be shown in the wave sensor chart.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( require => {
  'use strict';

  // modules
  const bendingLight = require( 'BENDING_LIGHT/bendingLight' );
  const inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {Property.<[]>} seriesProperty - contains data points of series
   * @param {Color} color - color of series
   * @constructor
   */
  function Series( seriesProperty, color ) {

    // @public (read-only)
    this.seriesProperty = seriesProperty;

    // @public (read-only)
    this.color = color;
  }

  bendingLight.register( 'Series', Series );
  
  return inherit( Object, Series, {

    /**
     * Discard early samples that have gone out of range
     * @public
     * @param {number} minTime - minimum time to be displayed on chart node
     */
    keepLastSamples: function( minTime ) {
      let startIndex = 0;
      if ( this.seriesProperty.get().length ) {

        // update the start time
        while ( this.seriesProperty.get()[ startIndex ] && this.seriesProperty.get()[ startIndex ].time < minTime ) {
          startIndex = startIndex + 1;
        }
        this.seriesProperty.set( this.seriesProperty.get().slice( startIndex, this.seriesProperty.get().length ) );
      }
    }
  } );
} );