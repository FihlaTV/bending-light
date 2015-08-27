// Copyright 2002-2015, University of Colorado Boulder

/**
 * In order to support white light, we need to perform additive color mixing (not subtractive,
 * as is the default when drawing transparent colors on top of each other in Java).
 * <p/>
 * This class uses the Bresenham line drawing algorithm (with a stroke thickness of 2) to determine which pixels each
 * ray inhabits. When multiple rays hit the same pixel, their RGB values are added. If any of the RG or B values is
 * greater than the maximum of 255, then RGB values are scaled down and the leftover part is put into the "intensity"
 * value (which is the sum of the ray intensities). The intensity is converted to a transparency value according to
 * alpha = sqrt(intensity/3), which is also clamped to be between 0 and 255.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var CanvasNode = require( 'SCENERY/nodes/CanvasNode' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Util = require( 'DOT/Util' );

  /**
   * @param {ModelViewTransform2} modelViewTransform - converts between model and view co-ordinates
   * @param {number} stageWidth - width of the dev area
   * @param {number} stageHeight - height of the dev area
   * @param {ObservableArray} whiteLightRays - array of white light rays
   * @constructor
   */
  function WhiteLightCanvasNode( modelViewTransform, stageWidth, stageHeight, whiteLightRays ) {

    CanvasNode.call( this, {
      canvasBounds: new Bounds2( 0, 0, stageWidth, stageHeight )
    } );
    this.invalidatePaint();
    this.modelViewTransform = modelViewTransform; // @private
    this.whiteLightRays = whiteLightRays; // @private
    this.stageHeight = stageHeight; // @private
    this.stageWidth = stageWidth; // @private
    this.hashMapPointArray = []; // @private
  }

  return inherit( CanvasNode, WhiteLightCanvasNode, {

    /**
     * Paints the particles on the canvas node.
     * @protected
     * @param {CanvasContextWrapper} wrapper
     */
    paintCanvas: function( wrapper ) {
      var context = wrapper.context;
      var map = {};
      for ( var i = 0; i < this.whiteLightRays.length; i++ ) {
        var child = this.whiteLightRays.get( i );

        // Get the line values to make the next part more readable
        var x1 = Math.round( this.modelViewTransform.modelToViewX( child.tip.x ) );
        var y1 = Math.round( this.modelViewTransform.modelToViewY( child.tip.y ) );
        var x2 = Math.round( this.modelViewTransform.modelToViewX( child.tail.x ) );
        var y2 = Math.round( this.modelViewTransform.modelToViewY( child.tail.y ) );

        // Some lines don't start in the play area, have to check and swap to make sure the line isn't pruned
        if ( this.isOutOfBounds( x1, y1 ) ) {
          this.draw( x2, y2, x1, y1, child, map );
        }
        else {
          this.draw( x1, y1, x2, y2, child, map );
        }
      }

      // Don't let things become completely white, since the background is white
      var whiteLimit = 0.2;
      var maxChannel = 1 - whiteLimit;

      // Extra factor to make it white instead of cream/orange
      var scale = 2;

      for ( i = 0; i < this.hashMapPointArray.length; i++ ) {
        var samples = map[ this.hashMapPointArray[ i ] ];
        var pointX = samples[ 4 ];
        var pointY = samples[ 5 ];
        var intensity = samples[ 3 ];

        // Move excess samples value into the intensity column
        var max = samples[ 0 ];
        if ( samples[ 1 ] > max ) {
          max = samples[ 1 ];
        }
        if ( samples[ 2 ] > max ) {
          max = samples[ 2 ];
        }

        // Scale and clamp the samples
        samples[ 0 ] = Util.clamp( samples[ 0 ] / max * scale - whiteLimit, 0, maxChannel );
        samples[ 1 ] = Util.clamp( samples[ 1 ] / max * scale - whiteLimit, 0, maxChannel );
        samples[ 2 ] = Util.clamp( samples[ 2 ] / max * scale - whiteLimit, 0, maxChannel );
        intensity = intensity * max;

        // Don't let it become fully opaque or it looks too dark against white background
        var alpha = Util.clamp( Math.sqrt( intensity ), 0, 1 );
        var pixelColor = samples[ 6 ];
        pixelColor.set( samples[ 0 ] * 255, samples[ 1 ] * 255, samples[ 2 ] * 255, alpha );

        // Set the color and fill in the pixel
        context.fillStyle = pixelColor.toCSS();
        context.fillRect( pointX, pointY, 0.7, 0.7 );
      }
      this.hashMapPointArray.length = 0;
    },

    /**
     * Computing points outside of the bounds
     * @private
     * @param {number} x0 - x position in view co-ordinates
     * @param {number} y0 - y position in view co-ordinates
     * @returns {boolean}
     */
    isOutOfBounds: function( x0, y0 ) {
      return x0 < 0 || y0 < 0 || x0 > this.stageWidth || y0 > this.stageHeight;
    },

    /**
     * Add the specified point to the HashMap, creating a new entry if necessary, otherwise adding it to existing
     * values. Take the intensity as the last component of the array
     * @private
     * @param {number} x0 - x position in view co-ordinates
     * @param {number} y0 - y position in view co-ordinates
     * @param {Color} color - color of the ray
     * @param {number} intensity - intensity of the ray
     * @param {Object} map - object containing array of color components, intensities of a point
     */
    addToMap: function( x0, y0, color, intensity, map ) {

      // So that rays don't start fully saturated: this makes it so that it is possible to see the decrease in intensity
      // after a (nontotal) reflection
      var keyPoint = (17647448 * x0 + 13333 * y0 + 33);
      if ( !map[ keyPoint ] ) {
        this.hashMapPointArray.push( keyPoint );

        // Seed with zeros so it can be summed
        map[ keyPoint ] = [ 0, 0, 0, 0, x0, y0, color ];
      }
      var brightnessFactor = 0.017;
      var current = map[ keyPoint ];
      var term = [ color.getRed() / 255, color.getGreen() / 255, color.getBlue() / 255 ];

      // Don't apply brightness factor to intensities
      for ( var a = 0; a < 3; a++ ) {
        current[ a ] = current[ a ] + term[ a ] * brightnessFactor;
      }

      // Add intensities, then convert to alpha later;
      current[ 3 ] = current[ 3 ] + intensity;
    },

    /**
     * @public
     */
    step: function() {
      this.invalidatePaint();
    },

    /**
     * The specified pixel got hit by white light, so update the map
     * @private
     * @param {number} x0 - x position in view co-ordinates
     * @param {number} y0 - y position in view co-ordinates
     * @param {Node} child - lightRay
     * @param {Object} map - object containing array of color components, intensities of a point
     */
    setPixel: function( x0, y0, child, map ) {
      var color = child.color;
      var intensity = child.powerFraction;
      this.addToMap( x0, y0, color, intensity, map );

      // Some additional points makes it look a lot better (less sparse) without slowing it down too much
      this.addToMap( x0 + 0.5, y0, color, intensity, map );
      this.addToMap( x0, y0 + 0.5, color, intensity, map );
    },

    /**
     * See http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
     * @private
     * @param {number} x0 - x position in view co-ordinates
     * @param {number} y0 - y position in view co-ordinates
     * @param {number} x1 - x position in view co-ordinates
     * @param {number} y1 - y position in view co-ordinates
     * @param {Node} child - lightRay
     * @param {Object} map - object containing array of color components, intensities of a point
     */
    draw: function( x0, y0, x1, y1, child, map ) {
      var dx = Math.abs( x1 - x0 );
      var dy = Math.abs( y1 - y0 );
      var sx = x0 < x1 ? 1 : -1;
      var sy = y0 < y1 ? 1 : -1;
      var err = dx - dy;
      while ( true ) {
        this.setPixel( x0, y0, child, map );
        if ( x0 === x1 && y0 === y1 ) {
          break;
        }
        if ( this.isOutOfBounds( x0, y0 ) ) {
          break;
        }
        var e2 = 2 * err;
        if ( e2 > -dy ) {
          err = err - dy;
          x0 = x0 + sx;
        }
        if ( e2 < dx ) {
          err = err + dx;
          y0 = y0 + sy;
        }
      }
    }
  } );
} );