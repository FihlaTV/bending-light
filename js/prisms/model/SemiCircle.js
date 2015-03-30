// Copyright 2002-2015, University of Colorado
/**
 * Shape that comprises a prism.
 *
 * @author Sam Reid
 * @author Chandrashekar Bemagoni  {Actual Concepts}
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var Line = require( 'KITE/segments/Line' );
  var Ray2 = require( 'DOT/Ray2' );
  var Intersection = require( 'BENDING_LIGHT/prisms/model/Intersection' );

  /**
   *
   * @param referencePointIndex
   * @param points
   * @param radius
   * @constructor
   */
  function SemiCircle( referencePointIndex, points, radius ) {

    this.points = points;
    //Index for the point used as the "reference" point,
    // which is used as the drag handle corner for rotation
    this.referencePointIndex = referencePointIndex;
    this.radius = radius;

  }

  return inherit( Object, SemiCircle, {
    toShape: function() {
      var center = this.points[ 0 ].plus( this.points[ 1 ] ).times( 0.5 );
      var startAngle = center.minus( this.points[ 1 ] ).angle();
      return new Shape()
        .ellipticalArc( center.x, center.y, this.radius, this.radius, 0, startAngle, startAngle + Math.PI, false )
        .close();
    },

    /**
     * Get the specified corner point
     * @param i
     * @returns {*}
     */
    getPoint: function( i ) {
      return this.points[ i ];
    },
    /**
     *
     * @param {Vector2} delta
     * @returns {SemiCircle}
     */
    getTranslatedInstance: function( delta ) {

      var newPoints = [];
      for ( var j = 0; j < this.points.length; j++ ) {
        newPoints.push( this.points[ j ].plus( delta ) );
      }
      return new SemiCircle( this.referencePointIndex, newPoints, this.radius );
    },
    /**
     * Gets a rotated copy of this SemiCircle
     * @param angle
     * @param rotationPoint
     * @returns {SemiCircle}
     */
    getRotatedInstance: function( angle, rotationPoint ) {
      var newPoints = [];
      for ( var k = 0; k < this.points.length; k++ ) {
        var vectorAboutCentroid = this.points[ k ].minus( rotationPoint );
        var rotated = vectorAboutCentroid.rotate( angle );
        newPoints.push( rotated.plus( rotationPoint ) );
      }
      return new SemiCircle( this.referencePointIndex, newPoints, this.radius );
    },

    /**
     * Lists the corner points
     * @returns {Array}
     */
    toPointArray: function() {
      var array = [];
      for ( var i = 0; i < this.points.length; i++ ) {
        array[ i ] = this.points[ i ];
      }
      return array;
    },
    /**
     *
     * @param point
     * @returns {*}
     */
    containsPoint: function( point ) {
      return this.toShape().containsPoint( point );
    },
    /**
     * Just use the 0th point for the reference point for rotation drag handles
     * @returns {*}
     */
    getReferencePoint: function() {
      return this.getPoint( this.referencePointIndex );
    },
    /**
     * Computes the centroid of the corner points (e.g. the center of "mass" assuming the corner points have equal "mass")
     * @returns {Vector2}
     */
    getRotationCenter: function() {
      return this.points[ 0 ].plus( this.points[ 1 ] ).times( 0.5 );
    },
    /**
     * Compute the intersections of the specified ray with this polygon's edges
     * @param ray
     * @returns {Array}
     */
    getIntersections: function( ray ) {
      var intersections = [];
      var segment = new Line( this.points[ 0 ], this.points[ 1 ] );
      //Get the intersection if there is one
      var intersection = segment.intersection( new Ray2( ray.tail, ray.tail.plus( ray.directionUnitVector ) ) );
      if ( intersection.length !== 0 ) {
        //Choose the normal vector that points the opposite direction of the incoming ray
        var normal1 = segment.getEnd().minus( segment.getStart() ).rotated( +Math.PI / 2 ).normalized();
        var normal2 = segment.getEnd().minus( segment.getStart() ).rotated( -Math.PI / 2 ).normalized();
        var unitNormal = ray.directionUnitVector.dot( normal1 ) < 0 ? normal1 : normal2;
        //Add to the list of intersections
        intersections.push( new Intersection( unitNormal, intersection[ 0 ].point ) );
      }
      var center = this.points[ 0 ].plus( this.points[ 1 ] ).times( 0.5 );
      var startAngle = center.minus( this.points[ 1 ] ).angle();
      var arc = new Shape().ellipticalArc( center.x, center.y, this.radius, this.radius, 0, startAngle, startAngle + Math.PI, false );
      intersection = arc.intersection( new Ray2( ray.tail, ray.tail.plus( ray.directionUnitVector ) ) );
      if ( intersection.length !== 0 ) {
        var vector = intersection[ 0 ].point.minus( ray.tail );
        //Only consider intersections that are in front of the ray
        if ( vector.dot( ray.directionUnitVector ) > 0 ) {
          var normalVector = intersection[ 0 ].point.minus( center ).normalized();
          if ( normalVector.dot( ray.directionUnitVector ) > 0 ) {
            normalVector = normalVector.negated();
          }
          intersections.push( new Intersection( normalVector, intersection[ 0 ].point ) );
        }
      }
      return intersections;
    },
    getBounds: function() {
      return this.toShape().bounds;
    }
  } );
} );