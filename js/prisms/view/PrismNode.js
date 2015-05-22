// Copyright 2002-2015, University of Colorado Boulder

/**
 * Graphically depicts a draggable prism.
 *
 * @author Sam Reid
 * @author Chandrashekar Bemagoni {Actual Concepts}
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Vector2 = require( 'DOT/Vector2' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Image = require( 'SCENERY/nodes/Image' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var ConstraintBounds = require( 'BENDING_LIGHT/common/ConstraintBounds' );

  // images
  var KnobImage = require( 'image!BENDING_LIGHT/knob.png' );

  /**
   *
   * @param {PrismBreakModel} prismsBreakModel - main model
   * @param {ModelViewTransform2} modelViewTransform - converts between model and view co-ordinates
   * @param {Prism } prism
   * @param {Node} prismToolboxNode
   * @param {Node} prismLayer
   * @param {Bounds2} prismDragBounds - bounds that define where the prism may be dragged
   * @constructor
   */
  function PrismNode( prismsBreakModel, modelViewTransform, prism, prismToolboxNode, prismLayer, prismDragBounds ) {

    Node.call( this, { cursor: 'pointer' } );
    var prismsNode = this;
    var knobHeight = 15;

    // It looks like a box on the side of the prism
    var knobNode = new Image( KnobImage );
    if ( prism.shapeProperty.get().getReferencePoint() ) {
      prismsNode.addChild( knobNode );
    }

    // prism rotation with knob
    var previousAngle;
    knobNode.addInputListener( new SimpleDragHandler( {
      start: function( event ) {
        previousAngle = prism.shapeProperty.get().getRotationCenter().subtract(
          modelViewTransform.viewToModelPosition( knobNode.globalToParentPoint( event.pointer.point ) ) )
          .angle();
      },
      drag: function( event ) {
        var end = knobNode.globalToParentPoint( event.pointer.point );
        var angle = prism.shapeProperty.get().getRotationCenter().subtract(
          modelViewTransform.viewToModelPosition( end ) ).angle();
        prism.rotate( angle - previousAngle );
        previousAngle = angle;
      },
      end: function() {
        if ( prismToolboxNode.visibleBounds.containsCoordinates( prismsNode.getCenterX(), prismsNode.getCenterY() ) ) {
          prismsBreakModel.removePrism( prism );
          prismLayer.removeChild( prismsNode );
        }
      }
    } ) );

    var prismTranslationNode = new Path( modelViewTransform.modelToViewShape( prism.shapeProperty.get().toShape() ), {
      fill: prismsBreakModel.prismMediumProperty.get().color,
      stroke: prismsBreakModel.prismMediumProperty.get().color.darkerColor( 0.9 )
    } );
    this.addChild( prismTranslationNode );

    var start;
    prismTranslationNode.addInputListener( new SimpleDragHandler( {
      start: function( event ) {
        start = prismsNode.globalToParentPoint( event.pointer.point );
      },
      drag: function( event ) {
        var end = prismsNode.globalToParentPoint( event.pointer.point );
        prism.translate( modelViewTransform.viewToModelDelta( end.minus( start ) ) );
        var position = ConstraintBounds.constrainLocation( prism.shapeProperty.get().getRotationCenter(),
          modelViewTransform.viewToModelBounds( prismDragBounds ) );
        prism.translate( position.minus( prism.shapeProperty.get().getRotationCenter() ) );
        start = end;
      },
      end: function() {
        if ( prismToolboxNode.visibleBounds.containsCoordinates( prismsNode.getCenterX(), prismsNode.getCenterY() ) ) {
          prismsBreakModel.removePrism( prism );
          prismLayer.removeChild( prismsNode );
          prismsBreakModel.dirty = true;
        }
      }
    } ) );

    var knobCenterPoint = new Vector2( -knobNode.getWidth() - 7, -knobNode.getHeight() / 2 - 8 );
    prism.shapeProperty.link( function() {
      prismsBreakModel.clear();
      prismsBreakModel.updateModel();
      prismsBreakModel.dirty = true;
      prismTranslationNode.setShape( modelViewTransform.modelToViewShape( prism.shapeProperty.value.toShape() ) );

      if ( prism.shapeProperty.get().getReferencePoint() ) {
        knobNode.resetTransform();
        knobNode.setScaleMagnitude( knobHeight / knobNode.height );
        var angle = modelViewTransform.modelToViewPosition( prism.shapeProperty.get().getRotationCenter() ).subtract(
          modelViewTransform.modelToViewPosition( prism.shapeProperty.get().getReferencePoint() ) ).angle();
        knobCenterPoint.x = -knobNode.getWidth() - 7;
        knobCenterPoint.y = -knobNode.getHeight() / 2 - 8;
        knobNode.rotateAround( knobCenterPoint, angle );
        var knobPosition = modelViewTransform.modelToViewPosition( prism.shapeProperty.get().getReferencePoint() );
        knobNode.setTranslation( knobPosition.x, knobPosition.y );
        knobNode.translate( knobCenterPoint );
      }
    } );

    prismsBreakModel.prismMediumProperty.link( function( prismMedium ) {
      var color = prismMedium.color;
      prismTranslationNode.fill = color;
      prismTranslationNode.stroke = color.darkerColor( 0.9 );
    } );
    this.touchArea = this.localBounds;
  }

  return inherit( Node, PrismNode );
} );