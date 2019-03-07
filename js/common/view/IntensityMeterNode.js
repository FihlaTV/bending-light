// Copyright 2015-2018, University of Colorado Boulder

/**
 * View for the intensity meter, including its movable sensor and readout region (called the body).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var bendingLight = require( 'BENDING_LIGHT/bendingLight' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var inherit = require( 'PHET_CORE/inherit' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var Node = require( 'SCENERY/nodes/Node' );
  var NodeProperty = require( 'SCENERY/util/NodeProperty' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var ProbeNode = require( 'SCENERY_PHET/ProbeNode' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var ShadedRectangle = require( 'SCENERY_PHET/ShadedRectangle' );
  var Text = require( 'SCENERY/nodes/Text' );
  var Vector2 = require( 'DOT/Vector2' );
  var Vector2Property = require( 'DOT/Vector2Property' );
  var WireNode = require( 'SCENERY_PHET/WireNode' );

  // strings
  var intensityString = require( 'string!BENDING_LIGHT/intensity' );

  // constants
  var NORMAL_DISTANCE = 25;
  var bodyNormalProperty = new Vector2Property( new Vector2( NORMAL_DISTANCE, 0 ) );
  var sensorNormalProperty = new Vector2Property( new Vector2( 0, NORMAL_DISTANCE ) );

  /**
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {IntensityMeter} intensityMeter - model for the intensity meter
   * @param {Object} [options]
   * @constructor
   */
  function IntensityMeterNode( modelViewTransform, intensityMeter, options ) {

    var self = this;
    Node.call( self );
    this.modelViewTransform = modelViewTransform; // @public (read-only)
    this.intensityMeter = intensityMeter;

    this.probeNode = new ProbeNode( { cursor: 'pointer', scale: 0.6 } );

    // add body node
    var rectangleWidth = 150;
    var rectangleHeight = 95;

    // adding outer rectangle
    var outerRectangle = new Rectangle( 0, 0, rectangleWidth, rectangleHeight, 5, 5, {
      stroke: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#408260' )
        .addColorStop( 1, '#005127' ),
      fill: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#06974C' )
        .addColorStop( 0.6, '#00773A' ),
      lineWidth: 2
    } );

    // second rectangle
    var innerRectangle = new Rectangle( 2, 2, rectangleWidth - 10, rectangleHeight - 10, 5, 5, {
      fill: '#008541',
      centerX: outerRectangle.centerX,
      centerY: outerRectangle.centerY
    } );

    // adding inner rectangle
    var valueBackground = new ShadedRectangle( new Bounds2( 0, 0, rectangleWidth * 0.8, rectangleHeight * 0.4 ), {
      baseColor: 'white',
      lightSource: 'rightBottom',
      centerX: innerRectangle.centerX,
      top: 10
    } );

    // Add a "Intensity" title to the body node
    var titleNode = new Text( intensityString, {
      font: new PhetFont( 24 ),
      fill: 'white'
    } );
    if ( titleNode.width > rectangleWidth - 15 ) {
      titleNode.scale( ( rectangleWidth - 15 ) / titleNode.width );
    }

    // Add the reading to the body node
    var valueNode = new Text( intensityMeter.readingProperty.get().getString(), {
      font: new PhetFont( 25 ),
      fill: 'black',
      maxWidth: valueBackground.width * 0.85
    } );

    // add up all the shapes to form a body node
    this.bodyNode = new Node( {
      children: [ outerRectangle, innerRectangle, valueBackground, titleNode, valueNode ],
      cursor: 'pointer',
      scale: 0.6
    } );
    titleNode.bottom = innerRectangle.bottom - 3;
    titleNode.centerX = outerRectangle.centerX;

    // displayed value
    intensityMeter.readingProperty.link( function( reading ) {
      valueNode.setText( reading.getString() );
      valueNode.center = valueBackground.center;
    } );

    // Connect the sensor to the body with a gray wire
    var above = function( amount ) {
      return function( position ) {return position.plusXY( 0, -amount );};
    };

    var rightBottomProperty = new NodeProperty( this.bodyNode, 'bounds', 'rightBottom' );

    // @private
    this.wireNode = new WireNode(
      new DerivedProperty( [ rightBottomProperty ], above( 12 ) ), bodyNormalProperty,
      new NodeProperty( this.probeNode, 'bounds', 'centerBottom' ), sensorNormalProperty, {
        lineWidth: 3,
        stroke: 'gray'
      }
    );

    intensityMeter.sensorPositionProperty.link( function( sensorPosition ) {
      self.probeNode.translation = modelViewTransform.modelToViewPosition( sensorPosition );
    } );

    intensityMeter.bodyPositionProperty.link( function( bodyPosition ) {
      self.bodyNode.translation = modelViewTransform.modelToViewPosition( bodyPosition );
    } );

    // add the components
    this.addChild( this.wireNode );
    this.addChild( this.probeNode );
    this.addChild( this.bodyNode );

    /**
     * @public - when the nodes are positioned by moving the node itself (for view layout), synchonize the model
     * Without this, when the body node is bumped out of the medium panels, it would have the wrong model location and
     * hence
     */
    this.syncModelFromView = function() {
      var sensorPosition = modelViewTransform.viewToModelPosition( self.probeNode.translation );
      var bodyPosition = modelViewTransform.viewToModelPosition( self.bodyNode.translation );

      intensityMeter.sensorPositionProperty.value = sensorPosition;
      intensityMeter.bodyPositionProperty.value = bodyPosition;
    };

    this.mutate( options );

    this.resetRelativeLocations();
    this.syncModelFromView();
  }

  bendingLight.register( 'IntensityMeterNode', IntensityMeterNode );

  return inherit( Node, IntensityMeterNode, {
    resetRelativeLocations: function() {
      this.probeNode.center = this.bodyNode.center.plusXY( 90, -10 );
    }
  } );
} );