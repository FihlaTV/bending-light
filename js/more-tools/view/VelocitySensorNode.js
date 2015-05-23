// Copyright 2002-2015, University of Colorado Boulder

/**
 * View for the Velocity Sensor tool. Measures the velocity at the sensor's tip and shows it in the display box. Also
 * points a blue arrow along the direction of the velocity and the arrow length is proportional to the velocity.
 *
 * @author Siddhartha Chinthapally (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Text = require( 'SCENERY/nodes/Text' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Property = require( 'AXON/Property' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var ArrowShape = require( 'SCENERY_PHET/ArrowShape' );
  var ShadedRectangle = require( 'SCENERY_PHET/ShadedRectangle' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  var MovableDragHandler = require( 'SCENERY_PHET/input/MovableDragHandler' );
  var BendingLightConstants = require( 'BENDING_LIGHT/common/BendingLightConstants' );

  // strings
  var speedString = require( 'string!BENDING_LIGHT/speed' );
  var c_units = require( 'string!BENDING_LIGHT/c_units' );

  // constants
  var VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX = 0.7;
  var VELOCITY_SENSOR_SCALE_OUTSIDE_TOOLBOX = 1;

  /**
   *
   * @param {MoreToolsView} moreToolsView
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {VelocitySensor} velocitySensor - model for the velocity sensor
   * @param {number} arrowScale
   * @param {Rectangle} container
   * @param {Bounds2} dragBounds - bounds that define where the velocity sensor   may be dragged
   * @constructor
   */
  function VelocitySensorNode( moreToolsView, modelViewTransform, velocitySensor, arrowScale, container, dragBounds ) {

    var velocitySensorNode = this;
    Node.call( this, { cursor: 'pointer', pickable: true } );

    // @public read-only
    this.modelViewTransform = modelViewTransform;
    this.velocitySensor = velocitySensor;
    this.moreToolsView = moreToolsView;

    var rectangleWidth = 100;
    var rectangleHeight = 70;

    // Adding outer rectangle
    var outerRectangle = new Rectangle( 0, 0, rectangleWidth, rectangleHeight, 15, 15, {
      stroke: '#844702',
      fill: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#F3D092' )
        .addColorStop( 0.2, '#DE9103' )
        .addColorStop( 0.6, '#CF8702' )
        .addColorStop( 0.8, '#DE9103' )
        .addColorStop( 1, '#B07200' ),
      lineWidth: 1
    } );
    this.addChild( outerRectangle );

    // Second rectangle
    var innerRectangle = new Rectangle( 0, 0, rectangleWidth - 8, rectangleHeight - 10, 10, 10, {
      fill: '#C98303',
      centerX: outerRectangle.centerX,
      centerY: outerRectangle.centerY
    } );
    this.addChild( innerRectangle );

    // Adding velocity meter title text
    var titleText = new Text( speedString,
      {
        fill: 'black',
        font: new PhetFont( 18 ),
        centerX: innerRectangle.centerX,
        top: innerRectangle.top + 2
      } );
    this.addChild( titleText );

    // Adding inner rectangle
    var innerMostRectangle = new ShadedRectangle( new Bounds2( 10, 0, rectangleWidth - 10, rectangleHeight - 38 ),
      {
        baseColor: 'white',
        lightSource: 'rightBottom',
        cornerRadius: 5,
        centerX: innerRectangle.centerX,
        bottom: innerRectangle.bottom - 5
      } );
    this.addChild( innerMostRectangle );

    // Adding velocity measure label
    var labelText = new Text( '',
      { fill: 'black', font: new PhetFont( 12 ), center: innerMostRectangle.center } );
    this.addChild( labelText );

    var triangleWidth = 30;
    var triangleHeight = 16;

    // Adding triangle shape
    var triangleShapeNode = new Path( new Shape()
      .moveTo( innerRectangle.centerX - triangleWidth / 2, innerMostRectangle.y + 1 )
      .lineTo( innerRectangle.centerX, triangleHeight + innerMostRectangle.y + 1 )
      .lineTo( innerRectangle.centerX + triangleWidth / 2, innerMostRectangle.y + 1 ), {
      fill: '#C88203',
      stroke: '#844702',
      top: outerRectangle.bottom - 1
    } );
    this.addChild( triangleShapeNode );

    // Arrow shape
    var arrowWidth = 6;
    this.arrowShape = new Path( new ArrowShape( 0, 0, modelViewTransform.modelToViewDeltaX( velocitySensor.value.x ),
      modelViewTransform.modelToViewDeltaY( velocitySensor.value.y ) ), { fill: 'blue' } );
    this.addChild( this.arrowShape );

    velocitySensor.valueProperty.link( function( velocity ) {

      var positionX = modelViewTransform.modelToViewDeltaX( velocitySensor.value.x ) * arrowScale;
      var positionY = modelViewTransform.modelToViewDeltaY( velocitySensor.value.y ) * arrowScale;

      this.arrowShape.setShape( new ArrowShape( 0, 0, positionX, positionY,
        { tailWidth: arrowWidth, headWidth: 2 * arrowWidth, headHeight: 2 * arrowWidth } ) );

      // Set the arrowShape path position so that the center of the tail coincides with the tip of the sensor
      if ( this.arrowShape.bounds.isFinite() ) {
        // If the velocity y component is positive then the arrow will face up, so set the bottom of the arrow to the
        // tip of the sensor
        if ( velocity.y >= 0 ) {
          this.arrowShape.bottom = triangleShapeNode.bottom +
                                   arrowWidth / 2 * Math.cos( Math.abs( velocity.angle() ) );
        }
        else {
          // if the velocity y component is negative then the arrow will face down, so set the top of the arrow to the
          // tip of the sensor
          this.arrowShape.top = triangleShapeNode.bottom -
                                arrowWidth / 2 * Math.cos( Math.abs( velocity.angle() ) );
        }

        // if the velocity x component is positive then the arrow will direct towards right, so set the left of the
        // arrow to the tip of the sensor
        if ( velocity.x > 0 ) {
          this.arrowShape.left = outerRectangle.centerX - arrowWidth / 2 * Math.sin( Math.abs( velocity.angle() ) );
        }
        else if ( velocity.x === 0 ) {
          this.arrowShape.left = outerRectangle.centerX - arrowWidth;
        }
        else {
          this.arrowShape.right = outerRectangle.centerX + arrowWidth / 2 * Math.sin( Math.abs( velocity.angle() ) );
        }
      }
    }.bind( velocitySensorNode ) );

    velocitySensor.isArrowVisibleProperty.linkAttribute( this.arrowShape, 'visible' );

    // Drag handler
    this.addInputListener( new MovableDragHandler( velocitySensor.positionProperty, {
        dragBounds: modelViewTransform.viewToModelBounds( dragBounds ),
        modelViewTransform: modelViewTransform,
        startDrag: function() {
          if ( container.bounds.containsCoordinates( velocitySensorNode.getCenterX(), velocitySensorNode.getCenterY() ) ) {
            velocitySensorNode.setScaleAnimation( velocitySensor.positionProperty.get(),
              VELOCITY_SENSOR_SCALE_OUTSIDE_TOOLBOX );
            velocitySensorNode.addToMoreToolsView();
          }
        },
        endDrag: function() {
          if ( container.bounds.containsCoordinates( velocitySensorNode.getCenterX(), velocitySensorNode.getCenterY() ) ) {
            velocitySensorNode.setScaleAnimation( velocitySensor.positionProperty.initialValue,
              VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
            velocitySensor.reset();
            velocitySensorNode.addToSensorPanel();
          }
        }
    } ) );

    velocitySensor.positionProperty.link( function( position ) {

      var velocitySensorNodeScaleVector = velocitySensorNode.getScaleVector();
      var velocitySensorXPosition = modelViewTransform.modelToViewX( position.x );
      var velocitySensorYPosition = modelViewTransform.modelToViewY( position.y );

      velocitySensorNode.setTranslation(
        velocitySensorXPosition - rectangleWidth / 2 * velocitySensorNodeScaleVector.x,
        velocitySensorYPosition - ( rectangleHeight + triangleHeight ) * velocitySensorNodeScaleVector.y );
    } );

    // Update the text when the value or units changes.
    Property.multilink( [ velocitySensor.valueProperty, velocitySensor.positionProperty ],
      function( velocity ) {
        if ( velocity.magnitude() === 0 ) {
          labelText.text = '?';
        }
        else {
          labelText.text = (velocity.magnitude() / BendingLightConstants.SPEED_OF_LIGHT).toFixed( 2 ) + " " + c_units;
        }
        labelText.center = innerMostRectangle.center;
      } );
    velocitySensorNode.setScaleMagnitude( VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );

    var velocitySensorNodeScaleVector = velocitySensorNode.getScaleVector();
    var velocitySensorXPosition = modelViewTransform.modelToViewX( velocitySensor.position.x );
    var velocitySensorYPosition = modelViewTransform.modelToViewY( velocitySensor.position.y );
    velocitySensorNode.setTranslation(
      velocitySensorXPosition - rectangleWidth / 2 * velocitySensorNodeScaleVector.x,
      velocitySensorYPosition - ( rectangleHeight + triangleHeight ) * velocitySensorNodeScaleVector.y );

    // For visually inspecting the touch area
    this.touchArea = this.localBounds;
  }

  return inherit( Node, VelocitySensorNode, {

    /**
     * @public
     * @param {Vector2} endPoint
     * @param {number} scale
     */
    setScaleAnimation: function( endPoint, scale ) {
      var startPoint = {
        x: this.velocitySensor.position.x,
        y: this.velocitySensor.position.y,
        scale: this.getScaleVector().x
      };
      var finalPosition = { x: endPoint.x, y: endPoint.y, scale: scale };
      this.init( startPoint, finalPosition );
    },

    /**
     * @private
     * @param {Object} initialPosition
     * @param {Object} finalPosition
     */
    init: function( initialPosition, finalPosition ) {
      var target = this;
      new TWEEN.Tween( initialPosition )
        .to( finalPosition, 100 )
        .easing( TWEEN.Easing.Linear.None )
        .onUpdate( function() {
          target.setScaleMagnitude( initialPosition.scale );
          target.velocitySensor.positionProperty.set( new Vector2( initialPosition.x, initialPosition.y ) );
        } ).start();
    },

    /**
     * @public
     */
    addToMoreToolsView: function() {

      if ( this.moreToolsView.beforeLightLayer2.isChild( this ) ) {
        this.moreToolsView.beforeLightLayer2.removeChild( this );
      }
      if ( !this.moreToolsView.afterLightLayer2.isChild( this ) ) {
        this.moreToolsView.afterLightLayer2.addChild( this );
      }
    },

    /**
     * @public
     */
    addToSensorPanel: function() {

      if ( this.moreToolsView.afterLightLayer2.isChild( this ) ) {
        this.moreToolsView.afterLightLayer2.removeChild( this );
      }
      if ( !this.moreToolsView.beforeLightLayer2.isChild( this ) ) {
        this.moreToolsView.beforeLightLayer2.addChild( this );
      }
    },

    /**
     * @public
     */
    reset: function() {
      this.setScaleMagnitude( VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
      if ( this.moreToolsView.afterLightLayer2.isChild( this ) ) {
        this.addToSensorPanel();
      }
      this.velocitySensor.reset();
    },

    /**
     * @private
     * @param {Vector2} delta
     */
    dragAll: function( delta ) {
      this.velocitySensor.translate( this.modelViewTransform.viewToModelDelta( delta ) );
    }
  } );
} );