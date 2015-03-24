// Copyright 2002-2015, University of Colorado
/**
 * View for the "prism break" tab.
 *
 * @author Sam Reid
 * @author Chandrashekar  Bemagoni(Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var BendingLightView = require( 'BENDING_LIGHT/common/view/BendingLightView' );
  var MediumControlPanel = require( 'BENDING_LIGHT/common/view/MediumControlPanel' );
  var ProtractorNode = require( 'BENDING_LIGHT/common/view/ProtractorNode' );
  var Bounds2 = require( 'DOT/Bounds2' );
  // var Shape = require( 'KITE/Shape' );
  // var Path = require( 'SCENERY/nodes/Path' );
  //var MediumNode = require( 'BENDING_LIGHT/common/view/MediumNode' );
  var PrismNode = require( 'BENDING_LIGHT/prisms/view/PrismNode' );
  var IntersectionNode = require( 'BENDING_LIGHT/prisms/view/IntersectionNode' );
  //var LaserView = require( 'BENDING_LIGHT/common/view/LaserView' );
  // var NormalLine = require( 'BENDING_LIGHT/intro/view/NormalLine' );
  var Node = require( 'SCENERY/nodes/Node' );
  var PrismToolboxNode = require( 'BENDING_LIGHT/prisms/view/PrismToolboxNode' );
  var LaserControlPanelNode = require( 'BENDING_LIGHT/prisms/view/LaserControlPanelNode' );
  var LaserTypeControlPanel = require( 'BENDING_LIGHT/prisms/view/LaserTypeControlPanel' );
  //var Property = require( 'AXON/Property' );
  //var WAVELENGTH_RED = BendingLightModel.WAVELENGTH_RED;//static
  var inset = 10;

// string
  var environmentString = require( 'string!BENDING_LIGHT/environment' );

  /**
   *
   * @param {PrismBreakModel} prismBreakModel -model of  prisms screen
   * @constructor
   */
  function PrismBreakView( prismBreakModel ) {

    this.prismLayer = new Node();
    var prismBreakView = this;
    //Specify how the drag angle should be clamped
    function clampDragAngle( angle ) {
      return angle;
    }

// in prisms tab  laser node can rotate 360 degrees  .so  arrows showing  all the times when laser node rotate
    function clockwiseArrowNotAtMax() {
      return true;
    }

    function ccwArrowNotAtMax() {
      return true;
    }

    //rotation if the user clicks top on the object
    function rotationRegionShape( full, back ) {
      return back;
    }


    function translationRegion( fullShape, backShape ) {
      //empty shape since shouldn't be rotatable in this tab
      return fullShape;
    }

    BendingLightView.call( this, prismBreakModel,
      clampDragAngle,
      clockwiseArrowNotAtMax,
      ccwArrowNotAtMax,
      true,
      translationRegion,
      rotationRegionShape, 'laserKnob',
      10 );


    var IndexOfRefractionDecimals = 2;
    //Add control panels for setting the index of refraction for each medium
    var environmentMediumControlPanel = new MediumControlPanel( this, prismBreakModel.environmentMediumProperty,
      environmentString, true, prismBreakModel.wavelengthProperty, IndexOfRefractionDecimals );
    environmentMediumControlPanel.setTranslation( this.layoutBounds.right - inset - environmentMediumControlPanel.width, this.layoutBounds.top + inset );
    this.afterLightLayer2.addChild( environmentMediumControlPanel );
    var laserControlPanelNode = new LaserControlPanelNode( prismBreakModel.laser.colorModeProperty,
      prismBreakModel.wavelengthProperty, {
        bottom: this.layoutBounds.bottom - 200,
        right:  this.layoutBounds.right - inset
      } );
    this.addChild( laserControlPanelNode );
    prismBreakModel.prisms.addItemAddedListener( function( item ) {
      prismBreakView.prismLayer.addChild( new PrismNode( prismBreakModel, prismBreakView.modelViewTransform, item ) );
    } );
    prismBreakModel.prisms.addItemRemovedListener( function() {
      for ( var i = 0; i < prismBreakView.prismLayer.getChildrenCount(); i++ ) {
        prismBreakView.prismLayer.removeChild( prismBreakView.prismLayer.children[ i ] );
      }
    } );

    //Optionally show the normal lines at each intersection
    prismBreakModel.intersections.addItemAddedListener( function( addedIntersection ) {
      if ( prismBreakModel.showNormalsProperty.get() ) {
        var node = new IntersectionNode( prismBreakView.modelViewTransform, addedIntersection );
        prismBreakView.addChild( node );

        prismBreakModel.intersections.addItemRemovedListener( function( removedIntersection ) {
          if ( removedIntersection === addedIntersection ) {
            prismBreakView.removeChild( node );
          }
        } );
      }
    } );

    var laserTypeControlPanel = new LaserTypeControlPanel( prismBreakModel.manyRaysProperty, {
      top:  this.layoutBounds.top - inset,
      left: this.layoutBounds.left + inset
    } );
    this.addChild( laserTypeControlPanel );

    //Add the reset all button
    var resetAllButton = new ResetAllButton(
      {
        listener: function() {
          prismBreakModel.resetAll();
        },
        bottom: this.layoutBounds.bottom - inset,
        right:  this.layoutBounds.right - inset
      } );

    this.afterLightLayer2.addChild( resetAllButton );

    //Put the laser control panel node where it leaves enough vertical space for reset button between it and prism control panel


    //Get the function that chooses which region of the protractor can be used for
    // rotation--none in this tab.
    this.getProtractorRotationRegion = function( fullShape, innerBar, outerCircle ) {
      //empty shape since shouldn't be rotatable in this tab
      return outerCircle;
    };

    //Get the function that chooses which region of the protractor can be used for translation--both
    // the inner bar and outer circle in this tab
    this.getProtractorDragRegion = function( fullShape, innerBar, outerCircle ) {
      return innerBar;
    };
    //Add the protractor node
    var protractorNode = new ProtractorNode( this.modelViewTransform, prismBreakModel.showProtractorProperty, prismBreakModel.protractorModel,
      this.getProtractorDragRegion, this.getProtractorRotationRegion, 200, new Bounds2( 0, 0, 0, 0 ) );
    this.addChild( protractorNode );
    protractorNode.scale( 90 / protractorNode.width );

    // add prisms tool box Node
    var prismToolboxNode = new PrismToolboxNode( this, this.modelViewTransform, prismBreakModel,
      { left: this.layoutBounds.minX, bottom: this.layoutBounds.bottom - inset } );
    this.beforeLightLayer.addChild( prismToolboxNode );
    this.beforeLightLayer.addChild( this.prismLayer );

  }

  return inherit( BendingLightView, PrismBreakView, {
    resetAll: function() {
      this.prismLayer.removeAllChildren();
    }
  } );
} );

