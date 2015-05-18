// Copyright 2002-2015, University of Colorado Boulder
/**
 * Wave WebGl Rendering.
 * @author Chandrashekar Bemagoni  (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var WebGLNode = require( 'SCENERY/nodes/WebGLNode' );
  var ShaderProgram = require( 'SCENERY/util/ShaderProgram' );

  /**
   *
   * @param {ModelViewTransform2} modelViewTransform , Transform between model and view coordinate frames
   * @param {ObservableArray<LightRay>} rays
   * @param {Number} screenWidth - width of the dev area
   * @param {Number} screenHeight -height of the dev area
   * @constructor
   */
  function WaveWebGLNode( modelViewTransform, rays, screenWidth, screenHeight ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.modelViewTransform = modelViewTransform;
    this.rays = rays;
    WebGLNode.call( this );
  }

  return inherit( WebGLNode, WaveWebGLNode, {

    /**
     *
     * @param {Drawable} drawable
     */
    initializeWebGLDrawable: function( drawable ) {
      var gl = drawable.gl;

      // Simple example for custom shader
      var vertexShaderSource = [
        // Position
        'attribute vec3 aPosition;', // vertex attribute
        'attribute float aPowerFraction;', // light ray power fraction
        'attribute vec3 aColor;', // Color of the wave
        'attribute vec2 aTail;', // Tail point
        'attribute float aAngle;', // Angle of the Ray
        'attribute float aWaveLength;', // Wavelength of the Ray
        'attribute float aPhase;', // phase difference of the Ray
        'varying float vPowerFraction;',
        'varying vec3 vColor;',
        'varying vec2 vTail;',
        'varying float vAngle;',
        'varying float vWaveLength;',
        'varying float vPhase;',
        'uniform mat3 uModelViewMatrix;',
        'uniform mat3 uProjectionMatrix;',
        'void main( void ) {',
        '  vPowerFraction = aPowerFraction;',
        '  vColor = aColor;',
        '  vTail = aTail;',
        '  vAngle = aAngle;',
        '  vWaveLength = aWaveLength;',
        '  vPhase = aPhase;',
        // homogeneous model-view transformation
        '  vec3 view = uModelViewMatrix * vec3( aPosition.xy, 1 );',
        // homogeneous map to to normalized device coordinates
        '  vec3 ndc = uProjectionMatrix * vec3( view.xy, 1 );',
        // combine with the z coordinate specified
        '  gl_Position = vec4( ndc.xy, aPosition.z, 1.0 );',
        '}'
      ].join( '\n' );

      //   custom  fragment shader
      var fragmentShaderSource = [
        'precision mediump float;',
        'varying float vPowerFraction;',
        'varying vec3 vColor;',
        'varying vec2 vTail;',
        'varying float vAngle;',
        'varying float vWaveLength;',
        'varying float vPhase;',
        'uniform vec2 uCanvasOffset;', // Canvas Offset
        'uniform float uScale;',
        'void main( void ) {',
        // converting pixel coordinates to view coordinates.
        'float x1 = (gl_FragCoord.x-uCanvasOffset.x)/uScale;',
        'float y1 = (gl_FragCoord.y-uCanvasOffset.y)/uScale;',
        // Perpendicular distance from tail to rendering coordinate. This is obtained by Coordinate Transformation to
        // tail point and applying dot product to the unit vector in the direction of ray and rendering coordinate
        // tail coordinate is mapped from view to canvas (layoutBounds.height - vTail.y)
        'float distance = dot(vec2(cos(vAngle),sin(vAngle)), vec2(x1-vTail.x,y1+vTail.y-524.0));',
        // finding the position of rendering coordinate in each wave particle to determine the color of the pixel
        'float positionDiff = distance>0.0? mod( vWaveLength - vPhase + distance, vWaveLength): vWaveLength - mod( vPhase - distance, vWaveLength);',
        // color is determined by perpendicular distance of coordinate from the start of the particle.
        'if((positionDiff)<vWaveLength/2.0){',
        'gl_FragColor = vec4( ( vColor*((positionDiff)/(vWaveLength/2.0)) + vec3(0,0,0)*(1.0-(positionDiff)/(vWaveLength/2.0)) )*vPowerFraction,vPowerFraction ) ;',
        '}',
        'else{',
        'positionDiff = positionDiff>0.0?positionDiff -vWaveLength/2.0:positionDiff +vWaveLength/2.0;',
        'gl_FragColor = vec4(( vec3(0,0,0)*(1.0-(positionDiff)/(vWaveLength/2.0)) + vColor*(((vWaveLength/2.0)-(positionDiff))/(vWaveLength/2.0)))*vPowerFraction,vPowerFraction ) ;',
        '}',
        '}'
      ].join( '\n' );

      drawable.shaderProgram = new ShaderProgram( gl, vertexShaderSource, fragmentShaderSource, {
        attributes: [ 'aPosition', 'aPowerFraction', 'aColor', 'aTail', 'aAngle', 'aWaveLength', 'aPhase' ],
        uniforms: [ 'uModelViewMatrix', 'uProjectionMatrix', 'uScale', 'uCanvasOffset' ]
      } );
    },

    /**
     *
     * @param{Drawable} drawable
     * @param {Matrix3} matrix
     */
    paintWebGLDrawable: function( drawable, matrix ) {
      var gl = drawable.gl;
      var shaderProgram = drawable.shaderProgram;

      var elements = [];
      var powerFractionArray = [];
      var colorArray = [];
      var tailPointArray = [];
      var anglesArray = [];
      var waveLengthArray = [];
      var phaseArray = [];

      for ( var i = this.rays.length - 1; i >= 0; i-- ) {
        var lightRay = this.rays.get( i );
        var lightRayWaveSubPath = lightRay.getWaveShape().subpaths[ 0 ];
        var point1X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 0 ].x );
        var point1Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 0 ].y );
        var point2X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 1 ].x );
        var point2Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 1 ].y );
        var point3X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 3 ].x );
        var point3Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 3 ].y );
        var point4X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 2 ].x );
        var point4Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 2 ].y );

        // points  to draw  light ray beam
        elements.push( point1X, point1Y, 1 );
        elements.push( point2X, point2Y, 1 );
        elements.push( point3X, point3Y, 1 );
        elements.push( point3X, point3Y, 1 );
        elements.push( point2X, point2Y, 1 );
        elements.push( point4X, point4Y, 1 );
        var numberOfVertexPoints = 6;

        // light ray power fraction
        var lightRayPowerFraction = lightRay.getPowerFraction();

        // light ray color
        var red = lightRay.getColor().r / 255;
        var green = lightRay.getColor().g / 255;
        var blue = lightRay.getColor().b / 255;

        // tail position in view co-ordinates
        var tailViewX = this.modelViewTransform.modelToViewX( lightRay.tail.x );
        var tailViewY = this.modelViewTransform.modelToViewY( lightRay.tail.y );

        // light ray  angle
        var lightRayAngle = lightRay.getAngle();

        //  phase
        var totalPhaseOffsetInNumberOfWavelengths = lightRay.getPhaseOffset() / 2 / Math.PI;
        var phaseDiff = this.modelViewTransform.modelToViewDeltaX( (totalPhaseOffsetInNumberOfWavelengths % 1) * lightRay.wavelength );

        for ( var k = 0; k < numberOfVertexPoints; k++ ) {
          powerFractionArray.push( lightRayPowerFraction );
          colorArray.push( red, green, blue );
          tailPointArray.push( tailViewX, tailViewY );
          anglesArray.push( lightRayAngle );
          waveLengthArray.push( this.modelViewTransform.modelToViewDeltaX( lightRay.wavelength ) );
          phaseArray.push( phaseDiff );
        }
      }

      var scale = Math.min( window.innerWidth / this.screenWidth, window.innerHeight / this.screenHeight );
      var widthOffset = (window.innerWidth - (  this.screenWidth * scale)) / 2;
      var heightOffset = (window.innerHeight - (  this.screenHeight * scale)) / 2;

      drawable.vertexBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.vertexBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( elements ), gl.STATIC_DRAW );

      drawable.powerFractionBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.powerFractionBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( powerFractionArray ), gl.STATIC_DRAW );

      drawable.colorBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.colorBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( colorArray ), gl.STATIC_DRAW );

      drawable.tailBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.tailBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( tailPointArray ), gl.STATIC_DRAW );

      drawable.angleBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.angleBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( anglesArray ), gl.STATIC_DRAW );

      drawable.waveLengthBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.waveLengthBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( waveLengthArray ), gl.STATIC_DRAW );

      drawable.phaseBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.phaseBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( phaseArray ), gl.STATIC_DRAW );

      shaderProgram.use();
      gl.uniformMatrix3fv( shaderProgram.uniformLocations.uModelViewMatrix, false, new Float32Array( matrix.entries ) );
      gl.uniformMatrix3fv( shaderProgram.uniformLocations.uProjectionMatrix, false, new Float32Array( drawable.webGLBlock.projectionMatrixArray ) );
      gl.uniform1f( shaderProgram.uniformLocations.uScale, scale );
      gl.uniform2f( shaderProgram.uniformLocations.uCanvasOffset, widthOffset, heightOffset );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.vertexBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aPosition, 3, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.powerFractionBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aPowerFraction, 1, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.colorBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aColor, 3, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.tailBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aTail, 2, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.angleBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aAngle, 1, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.waveLengthBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aWaveLength, 1, gl.FLOAT, false, 0, 0 );

      gl.bindBuffer( gl.ARRAY_BUFFER, drawable.phaseBuffer );
      gl.vertexAttribPointer( shaderProgram.attributeLocations.aPhase, 1, gl.FLOAT, false, 0, 0 );

      gl.drawArrays( gl.TRIANGLES, 0, this.rays.length * 6 );
      shaderProgram.unuse();
    },

    disposeWebGLDrawable: function( drawable ) {
      drawable.shaderProgram.dispose();
      drawable.gl.deleteBuffer( drawable.vertexBuffer );
      drawable.shaderProgram = null;
    },
    /**
     *
     */
    step: function() {
      this.invalidatePaint();
    }

  } );
} );
