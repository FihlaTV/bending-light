// Copyright 2002-2015, University of Colorado Boulder

/**
 * View for intro screen
 *
 * @author Siddhartha Chinthapally (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var BendingLightView = require( 'BENDING_LIGHT/common/view/BendingLightView' );
  var MediumControlPanel = require( 'BENDING_LIGHT/common/view/MediumControlPanel' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var MediumNode = require( 'BENDING_LIGHT/common/view/MediumNode' );
  var LaserControlPanel = require( 'BENDING_LIGHT/common/view/LaserControlPanel' );
  var NormalLine = require( 'BENDING_LIGHT/intro/view/NormalLine' );
  var PlayPauseButton = require( 'SCENERY_PHET/buttons/PlayPauseButton' );
  var StepButton = require( 'SCENERY_PHET/buttons/StepButton' );
  var AquaRadioButton = require( 'SUN/AquaRadioButton' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Util = require( 'DOT/Util' );
  var Property = require( 'AXON/Property' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Text = require( 'SCENERY/nodes/Text' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var IntensityMeterNode = require( 'BENDING_LIGHT/common/view/IntensityMeterNode' );
  var CheckBox = require( 'SUN/CheckBox' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var ProtractorNode = require( 'BENDING_LIGHT/common/view/ProtractorNode' );
  var ProtractorModel = require( 'BENDING_LIGHT/common/model/ProtractorModel' );
  var ExpandableProtractorNode = require( 'BENDING_LIGHT/more-tools/view/ExpandableProtractorNode' );
  var BendingLightConstants = require( 'BENDING_LIGHT/common/BendingLightConstants' );
  var floatRight = require( 'BENDING_LIGHT/common/view/floatRight' );

  // strings
  var materialString = require( 'string!BENDING_LIGHT/material' );
  var normalString = require( 'string!BENDING_LIGHT/normal' );
  var slowMotionString = require( 'string!BENDING_LIGHT/slowMotion' );
  var rayString = require( 'string!BENDING_LIGHT/ray' );
  var waveString = require( 'string!BENDING_LIGHT/wave' );

  // constants
  var INSET = 10;

  /**
   * @param {IntroModel} introModel - model of intro screen
   * @param {number} centerOffsetLeft - amount of space that center to be shifted to left
   * @param {boolean} hasMoreTools - whether contain more tools
   * @param {number} IndexOfRefractionDecimals - decimalPlaces to show for index of refraction
   * @constructor
   */
  function IntroView( introModel, centerOffsetLeft, hasMoreTools, IndexOfRefractionDecimals ) {

    var introView = this;
    this.introModel = introModel; // @public

    // specify how the drag angle should be clamped, in this case the laser must remain in the top left quadrant
    function clampDragAngle( angle ) {
      while ( angle < 0 ) { angle += Math.PI * 2; }
      return Util.clamp( angle, Math.PI / 2, Math.PI );
    }

    // indicate if the laser is not at its max angle, and therefore can be dragged to larger angles
    function clockwiseArrowNotAtMax( laserAngle ) {
      if ( introModel.laserView === 'ray' ) {
        return laserAngle < Math.PI;
      }
      else {
        // TODO: This should be different for wave mode
        return laserAngle < BendingLightConstants.MAX_ANGLE_IN_WAVE_MODE;
      }
    }

    // indicate if the laser is not at its min angle, and can therefore be dragged to smaller angles.
    function ccwArrowNotAtMax( laserAngle ) {
      return laserAngle > Math.PI / 2;
    }

    // rotation if the user clicks anywhere on the object
    function rotationRegionShape( full, back ) {

      // in this screen, clicking anywhere on the laser (i.e. on its 'full' bounds) translates it, so always return the
      // 'full' region
      return full;
    }

    // get the function that chooses which region of the protractor can be used for rotation--none in this tab.
    this.getProtractorRotationRegion = function( fullShape, innerBar, outerCircle ) {

      // empty shape since shouldn't be rotatable in this tab
      return new Shape.rect( 0, 0, 0, 0 );
    };

    // get the function that chooses which region of the protractor can be used for translation--both the inner bar and
    // outer circle in this screen
    this.getProtractorDragRegion = function( fullShape, innerBar, outerCircle ) {
      return fullShape;
    };

    BendingLightView.call( this,
      introModel,
      clampDragAngle,
      clockwiseArrowNotAtMax,
      ccwArrowNotAtMax,
      this.getProtractorRotationRegion,
      rotationRegionShape,
      'laser',
      centerOffsetLeft,
      0,
      // No need to handle occlusions
      function() {}
    );

    var stageWidth = this.layoutBounds.width;
    var stageHeight = this.layoutBounds.height;

    // add MediumNodes for top and bottom
    this.mediumNode.addChild( new MediumNode( this.modelViewTransform, introModel.topMediumProperty ) );
    this.mediumNode.addChild( new MediumNode( this.modelViewTransform, introModel.bottomMediumProperty ) );

    // add control panels for setting the index of refraction for each medium
    var topMediumControlPanel = new MediumControlPanel( this, introModel.topMediumProperty, materialString, true,
      introModel.wavelengthProperty, IndexOfRefractionDecimals, { yMargin: 7 } );
    var topMediumControlPanelXOffset = hasMoreTools ? 4 : 0;
    topMediumControlPanel.setTranslation(
      stageWidth - topMediumControlPanel.getWidth() - 2 * INSET - topMediumControlPanelXOffset,
      this.modelViewTransform.modelToViewY( 0 ) - 2 * INSET - topMediumControlPanel.getHeight() + 4 );
    this.afterLightLayer2.addChild( topMediumControlPanel );

    // add control panels for setting the index of refraction for each medium
    var bottomMediumControlPanelXOffset = hasMoreTools ? 4 : 0;
    var bottomMediumControlPanel = new MediumControlPanel( this, introModel.bottomMediumProperty, materialString, true,
      introModel.wavelengthProperty, IndexOfRefractionDecimals, { yMargin: 7 } );
    bottomMediumControlPanel.setTranslation(
      stageWidth - topMediumControlPanel.getWidth() - 2 * INSET - bottomMediumControlPanelXOffset,
      this.modelViewTransform.modelToViewY( 0 ) + 2 * INSET + 1 );
    this.afterLightLayer2.addChild( bottomMediumControlPanel );

    // add a line that will show the border between the mediums even when both n's are the same... Just a thin line will
    // be fine.
    this.beforeLightLayer.addChild( new Path( this.modelViewTransform.modelToViewShape(
      new Shape()
        .moveTo( -1, 0 )
        .lineTo( 1, 0 ), {
        stroke: 'gray',
        pickable: false
      } ) ) );

    // show the normal line where the laser strikes the interface between mediums
    var normalLineHeight = stageHeight / 2;
    var normalLine = new NormalLine( normalLineHeight, [ 7, 6 ], {
      x: this.modelViewTransform.modelToViewX( 0 ),
      y: this.modelViewTransform.modelToViewY( 0 ) - normalLineHeight / 2
    } );
    this.afterLightLayer2.addChild( normalLine );

    introModel.showNormalProperty.linkAttribute( normalLine, 'visible' );

    Property.multilink( [
      introModel.laserViewProperty,
      introModel.laser.onProperty,
      introModel.intensityMeter.sensorPositionProperty,
      introModel.topMediumProperty,
      introModel.bottomMediumProperty,
      introModel.laser.emissionPointProperty,
      introModel.laser.colorProperty
    ], function() {
      for ( var k = 0; k < introView.incidentWaveCanvasLayer.getChildrenCount(); k++ ) {
        introView.incidentWaveCanvasLayer.children[ k ].step();
      }
      introView.incidentWaveCanvasLayer.setVisible( introModel.laser.on && introModel.laserView === 'wave' );
    } );

    // add laser view panel
    var laserViewXOffset = hasMoreTools ? 13 : 12;
    var laserViewYOffset = hasMoreTools ? 2 * INSET - 4 : 2 * INSET;
    var laserControlPanel = new LaserControlPanel( introModel.laserViewProperty, introModel.wavelengthProperty, 'ray',
      'wave', rayString, waveString, hasMoreTools, {
        xMargin: 9,
        yMargin: 6,
        radioButtonradius: 6,
        spacing: 11,
        disableUnselected: false,
        minWidth: hasMoreTools ? 175 : 67,
        left: this.layoutBounds.minX + laserViewXOffset,
        top: this.layoutBounds.top + laserViewYOffset
      } );

    this.laserViewLayer.addChild( laserControlPanel );

    var sensorPanelHeight = hasMoreTools ? 303 : 203;

    this.sensorPanel = new Rectangle( 0, 0, 100, sensorPanelHeight, 5, 5, {
      stroke: '#696969', lineWidth: 1.5, fill: '#EEEEEE',
      left: this.layoutBounds.minX + 13,
      top: this.layoutBounds.maxY - sensorPanelHeight - 14
    } ); // @public
    this.beforeLightLayer2.addChild( this.sensorPanel );

    var protractorIconWidth = hasMoreTools ? 60 : 75;

    // initial tools
    var protractorNodeX = hasMoreTools ? this.sensorPanel.centerX : this.sensorPanel.centerX;
    var protractorNodeY = hasMoreTools ? this.sensorPanel.y + 40 : this.sensorPanel.y + 48;
    var protractorModelPositionX = this.modelViewTransform.viewToModelX( protractorNodeX );
    var protractorModelPositionY = this.modelViewTransform.viewToModelY( protractorNodeY );
    this.protractorModel = new ProtractorModel( protractorModelPositionX, protractorModelPositionY ); // @public

    // if intro screen regular protractor node else expandable protractor node.
    if ( !hasMoreTools ) {
      this.protractorNode = new ProtractorNode( this.afterLightLayer, this.beforeLightLayer2, this.modelViewTransform, this.showProtractorProperty,
        this.protractorModel, this.getProtractorDragRegion, this.getProtractorRotationRegion, protractorIconWidth,
        this.sensorPanel.bounds, this.layoutBounds );
    }
    else {
      this.protractorNode = new ExpandableProtractorNode( this.afterLightLayer, this.beforeLightLayer2, this.modelViewTransform, this.showProtractorProperty,
        this.protractorModel, this.getProtractorDragRegion, this.getProtractorRotationRegion, protractorIconWidth,
        this.sensorPanel.bounds, this.layoutBounds );
    }
    this.protractorNode.addToSensorPanel();

    this.intensityMeterNode = new IntensityMeterNode( this.beforeLightLayer, this.beforeLightLayer2, this.modelViewTransform, introModel.intensityMeter,
      this.sensorPanel.visibleBounds, this.layoutBounds );
    this.intensityMeterNode.addToSensorPanel();

    var normalText = new Text( normalString );
    var normalText_Max_Width = 50;
    if ( normalText.width > normalText_Max_Width ) {
      normalText.scale( normalText_Max_Width / normalText.width );
    }
    var normalCheckBox = new CheckBox( normalText, introModel.showNormalProperty, {
      boxWidth: 20,
      spacing: 5,
      x: this.sensorPanel.x + 6,
      y: this.sensorPanel.y + sensorPanelHeight - 40
    } );
    this.beforeLightLayer2.addChild( normalCheckBox );

    normalCheckBox.touchArea = new Bounds2(
      normalCheckBox.localBounds.minX, normalCheckBox.localBounds.minY - 3,
      normalCheckBox.localBounds.maxX + 25, normalCheckBox.localBounds.maxY + 3
    );

    // add normal
    var normalIcon = new NormalLine( 34, [ 4, 3 ], {
      x: this.sensorPanel.x + this.sensorPanel.width / 2,
      y: this.sensorPanel.y + sensorPanelHeight - 41
    } );
    this.beforeLightLayer2.addChild( normalIcon );

    // add reset all button
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        introView.intensityMeterNode.reset();
        introModel.reset();
        introView.reset();
        laserControlPanel.reset();
        topMediumControlPanel.reset();
        bottomMediumControlPanel.reset();
      },
      bottom: this.layoutBounds.bottom - 14,
      right: this.layoutBounds.right - 2 * INSET,
      radius: 19
    } );

    this.afterLightLayer2.addChild( resetAllButton );

    introModel.laserViewProperty.link( function() {
      introModel.laser.wave = introModel.laserView === 'wave';
    } );

    // add sim speed controls
    var slowMotionRadioBox = new AquaRadioButton( introModel.speedProperty, 'slow',
      new Text( slowMotionString, { font: new PhetFont( 12 ) } ), { radius: 8 } );
    var normalMotionRadioBox = new AquaRadioButton( introModel.speedProperty, 'normal',
      new Text( normalString, { font: new PhetFont( 12 ) } ), { radius: 8 } );

    var speedControlMaxWidth = ( slowMotionRadioBox.width > normalMotionRadioBox.width ) ?
                               slowMotionRadioBox.width : normalMotionRadioBox.width;

    var radioButtonSpacing = 5;
    var touchAreaHeightExpansion = radioButtonSpacing / 2;
    slowMotionRadioBox.touchArea = new Bounds2(
      slowMotionRadioBox.localBounds.minX,
      slowMotionRadioBox.localBounds.minY - touchAreaHeightExpansion,
      slowMotionRadioBox.localBounds.minX + speedControlMaxWidth,
      slowMotionRadioBox.localBounds.maxY + touchAreaHeightExpansion
    );

    normalMotionRadioBox.touchArea = new Bounds2(
      normalMotionRadioBox.localBounds.minX,
      normalMotionRadioBox.localBounds.minY - touchAreaHeightExpansion,
      normalMotionRadioBox.localBounds.minX + speedControlMaxWidth,
      normalMotionRadioBox.localBounds.maxY + touchAreaHeightExpansion
    );

    this.speedControl = new VBox( {
      align: 'left',
      spacing: radioButtonSpacing,
      children: [ normalMotionRadioBox, slowMotionRadioBox ]
    } );
    this.afterLightLayer2.addChild( this.speedControl.mutate( {
      left: this.sensorPanel.right + 25,
      bottom: this.layoutBounds.bottom - 15
    } ) );

    // add play pause button and step button
    this.playPauseButton = new PlayPauseButton( introModel.isPlayingProperty,
      {
        radius: 18, stroke: 'black', fill: '#005566',
        bottom: this.layoutBounds.bottom - 15,
        left: this.speedControl.right + INSET
      } );
    this.afterLightLayer2.addChild( this.playPauseButton );

    this.stepButton = new StepButton(
      function() {
        introModel.updateSimulationTimeAndWaveShape();
        introView.updateWaveShape();
      },
      introModel.isPlayingProperty, {
        radius: 12,
        stroke: 'black',
        fill: '#005566',
        left: this.playPauseButton.right + 15,
        y: this.playPauseButton.centerY
      } );
    this.afterLightLayer2.addChild( this.stepButton );
    introModel.laserViewProperty.link( function( laserType ) {

      introView.playPauseButton.visible = (laserType === 'wave');
      introView.stepButton.visible = (laserType === 'wave');
      introView.speedControl.visible = (laserType === 'wave');
    } );

    floatRight( this, [ topMediumControlPanel, bottomMediumControlPanel, resetAllButton ] );
  }

  return inherit( BendingLightView, IntroView, {

    /**
     * Called by the animation loop.
     * @protected
     */
    step: function() {
      BendingLightView.prototype.step.call( this );
      if ( this.introModel.isPlaying ) {
        this.updateWaveShape();
      }
    },

    /**
     * Update wave shape.
     * @public
     */
    updateWaveShape: function() {

      for ( var k = 0; k < this.waveCanvasLayer.getChildrenCount(); k++ ) {
        this.waveCanvasLayer.children[ k ].step();
      }
      if ( this.introModel.laserView === 'wave' ) {
        for ( k = 0; k < this.incidentWaveCanvasLayer.getChildrenCount(); k++ ) {
          this.incidentWaveCanvasLayer.children[ k ].step();
        }
      }
    },

    /**
     * @public
     */
    reset: function() {
      this.protractorModel.reset();
      this.protractorNode.reset();
    }
  } );
} );