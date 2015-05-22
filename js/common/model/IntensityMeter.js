// Copyright 2002-2015, University of Colorado Boulder
/**
 * Model for the intensity meter, including the position of the sensor, body, the reading values, etc.
 * When multiple rays hit the sensor, they are summed up.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var Reading = require( 'BENDING_LIGHT/common/model/Reading' );

  /**
   *
   * @param {number} sensorX -  sensor x position in model  values
   * @param {number} sensorY - sensor  y position in model  values
   * @param {number} bodyX - body x position in model  values
   * @param {number} bodyY -body y position in model  values
   * @constructor
   */
  function IntensityMeter( sensorX, sensorY, bodyX, bodyY ) {

    PropertySet.call( this, {
        reading: Reading.MISS,  // value to show on the body
        sensorPosition: new Vector2( sensorX, sensorY ),
        bodyPosition: new Vector2( bodyX, bodyY )
      }
    );

    // accumulation of readings
    this.rayReadings = [];
  }

  return inherit( PropertySet, IntensityMeter, {

      /**
       *
       * @public
       * @param {Vector2}delta - amount space the sensor translated.
       */
      translateSensor: function( delta ) {
        this.sensorPositionProperty.set( this.sensorPosition.plus( delta ) );
      },

      /**
       *@public
       * @param {Vector2}delta -amount space the body translated.
       */
      translateBody: function( delta ) {
        this.bodyPositionProperty.set( this.bodyPosition.plus( delta ) );
      },

      /**
       *
       * @returns {Shape}
       */
      getSensorShape: function() {
        // fine tuned to match the given image
        var radius = 1.215E-6;
        return new Shape().circle( this.sensorPosition.x, this.sensorPosition.y, radius );
      },

      /**
       *  should be called before a model update so that values from last computation
       * don't leak over into the next summation
       */
      clearRayReadings: function() {
        this.rayReadings = [];
        this.readingProperty.set( Reading.MISS );
      },

      /**
       * Add a new reading to the accumulator and update the readout
       * @param {Reading/ MISS} r
       */
      addRayReading: function( r ) {
        this.rayReadings.push( r );
        this.updateReading();
      },

      /**
       * Update the body text based on the accumulated Reading values
       */
      updateReading: function() {

        // enumerate the hits
        var hits = [];
        this.rayReadings.forEach( function( rayReading ) {
          if ( rayReading.isHit() ) {
            hits.push( rayReading );
          }
        } );

        // if not hits, say "MISS"
        if ( hits.length === 0 ) {
          this.readingProperty.set( Reading.MISS );
        }
        else // otherwise, sum the intensities
        {
          var total = 0.0;
          hits.forEach( function( hit ) {
            total += hit.getValue();
          } );
          this.readingProperty.set( new Reading( total ) );
        }
      },

      /**
       *@public
       * @param {Vector2} delta
       */
      translateAll: function( delta ) {
        this.translateBody( delta );
        this.translateSensor( delta );
      }
    },
    {
      Reading: Reading
    } );
} );

