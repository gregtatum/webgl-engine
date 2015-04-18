var _ = require('lodash')
var BufferTools = require('./buffers')

var internals = {
	
	compileShader : function( gl, source, type ) {

		var shader = gl.createShader( type )
		gl.shaderSource( shader, source )
		gl.compileShader( shader )
 
		if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			
			var typeName = type === gl.VERTEX_SHADER ? "vertex" : "fragment"
			throw `Could not compile WebGL ${typeName} shader. \n\n ${gl.getShaderInfoLog( shader )}`
		}
 
		return shader
	},
	
	linkProgram : function( gl, vertexShader, fragmentShader ) {
		
		var program = gl.createProgram()
		
		gl.attachShader( program, vertexShader )
		gl.attachShader( program, fragmentShader )
		
		gl.linkProgram( program )
		
		if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
			throw `Could not compile WebGL program. \n\n ${gl.getShaderInfoLog( shader )}`
		}
		return program
	},
	
	createProgram : function( gl, vertexSource, fragmentSource ) {
		
		var vertexShader = internals.compileShader( gl, vertexSource, gl.VERTEX_SHADER )
		var fragmentShader = internals.compileShader( gl, fragmentSource, gl.FRAGMENT_SHADER )
		
		return internals.linkProgram( gl, vertexShader, fragmentShader )
	},
	
	setup : function( gl, config ) {
		
		if( !(config.program instanceof WebGLProgram) ) {
			throw "A WebGLProgram must be supplied to the setup"
		}
		
		var [ elements,   bindElements ]     = internals.setupElements(   gl, config.elements )
		var [ attributes, bindAttributeFns ] = internals.setupAttributes( gl, config.program, config.attributes )
		var [ uniforms,   bindUniformFns ]   = internals.setupUniforms(   gl, config.program, config.uniforms )
		var [ textures,   bindTextureFns ]   = internals.setupTextures(   gl, config.program, config.textures )
		
		var bind = internals.bindProgramFn(
			gl
		  , config.program
		  , bindElements
		  , bindAttributeFns
		  , bindUniformFns
		  , bindTextureFns
		)
		var unbind = internals.unbindProgramFn( gl )
		
		var [ drawing, draw ] = config.elements ?
			internals.drawElementsFn( gl, config, elements ) :
			internals.drawArraysFn( gl, config )
		
		return {
			
			//The config
			program: config.program
		  , attributes: attributes
		  , uniforms: uniforms
		  , elements: elements
		  , textures: textures
		  , drawing: drawing
			
			//The functions
		  , bind: bind
		  , unbind: unbind
		  , draw: draw
		}
	},
	
	setupElements : function( gl, inputs ) {
		
		if( inputs ) {
			// Accepts a buffer object as generated from the buffer tools (buffers.js)
		
			var properties = _.isArray( inputs ) ? { value: inputs } : inputs
		
			var elsConfigPreliminary = _.extend({
				value          : null
			  , buffer          : null
			  , type            : gl.ELEMENT_ARRAY_BUFFER
			  , arrayBufferType : Uint16Array
			  , bind            : null
			  , usage           : gl.STATIC_DRAW
			}, properties)
		
			var elsConfig = internals.ensureHasBuffer(
				gl,
				elsConfigPreliminary,
				gl.ELEMENT_ARRAY_BUFFER
			)
		
			return [ elsConfig, elsConfig.bind ]
		} else {
			return [ null, function() {} ]
		}
	},
	
	ensureHasBuffer : function( gl, obj, bufferType ) {
		
		if( obj.value && !obj.buffer ) {
				
			var value = (obj.value instanceof Array) ?
				new obj.arrayBufferType( obj.value ) :
				obj.value
			
			var bufferObj = BufferTools.create( gl, value, bufferType, obj.usage )
			
			return _.extend( {}, obj, bufferObj )
			
		} else {
			
			return obj
		}
		
	},
	
	drawElementsFn : function( gl, config, elements ) {
		
		var drawConfig = _.extend({
			mode : gl.TRIANGLES
		  , count : elements.value.length
		  , type : gl.UNSIGNED_SHORT
		  , offset : 0
		}, config.drawing)

		
		var draw = function() {
			gl.drawElements(
				drawConfig.mode,
				drawConfig.count,
				drawConfig.type,
				drawConfig.offset
			)
		}
		
		return [ drawConfig, draw ]
	},
	
	drawArraysFn : function( gl, config ) {
		
		var drawConfig = _.extend({
			mode : gl.TRIANGLES
		  , count : internals.guessAttributeLength( config.attributes )
		  , first : 0
		}, config.drawing)
		
		if( !_.isNumber( drawConfig.count ) ) {
			throw "Count not guess the count of the attributes, and no count was provided on the draw property."
		}
		
		var draw = function() {
			
			gl.drawArrays(
				drawConfig.mode, 
				drawConfig.first,
				drawConfig.count
			)
		}
		
		return [ drawConfig, draw ]
	},
	
	guessAttributeLength : function( attributes ) {
		
		var attribute = _.find( attributes, function( attribute ) {
			return !!attribute.value && attribute.size > 0
		})
		
		return attribute ? attribute.value.length / attribute.size : null
	},
	
	bindElementsFn : function( elements ) {
		
		if( elements ) {
			return elements.bind
		} else { 
			return function() {}
		}
	},
	
	unbindProgramFn : function( gl ) {
		
		return function() {
			
		}
	},
	
	bindProgramFn : function( gl, shaderProgram, bindElements, bindAttributeFns, bindUniformFns, bindTextureFns ) {
		
		return function() {
			gl.useProgram( shaderProgram )
			bindElements()
			_.each( bindAttributeFns, function(fn) { fn() } )
			_.each( bindUniformFns, function(fn) { fn() } )
			_.each( bindTextureFns, function(fn) { fn() } )
		}
	},
	
	setupAttributes : function( gl, shaderProgram, rawAttributes ) {
		
		var attributes = _.reduce( rawAttributes, function( memo, attrProperties, attrName ) {
			
			var initalAttr = _.extend({
				buffer          : null
			  , location        : gl.getAttribLocation( shaderProgram, attrName )
			  , type            : gl.FLOAT
			  , size            : 3
			  , normalized      : false
			  , stride          : 0
			  , offset          : 0
			  , arrayBufferType : Float32Array
			}, attrProperties)

			if( initalAttr.location === -1 ) {
				throw `The attribute "${attrName}" does not exist in the shader program`
			}
			
			memo[attrName] = internals.ensureHasBuffer( gl, initalAttr, gl.ARRAY_BUFFER )			
			
			return memo
			
		}, {})
		
		var bindFns = _.map( attributes, function( attribute ) {
			return internals.bindAttributeFn( gl, attribute )
		})
		
		return [ attributes, bindFns ]
	},
	
	bindAttributeFn : function( gl, attribute ) {
		
		return function() {
			
			attribute.bind()
			gl.enableVertexAttribArray( attribute.location )
			gl.vertexAttribPointer(
				attribute.location
			  , attribute.size
			  , attribute.type
			  , attribute.normalized
			  , attribute.stride
			  , attribute.offset
			)
		}
	},

	setupUniforms : function( gl, shaderProgram, rawUniforms ) {
		
		var uniforms = _.mapValues( rawUniforms, function( uniformProperties, uniformName ) {
			
			return _.extend({
				location   : gl.getUniformLocation( shaderProgram, uniformName ),
				type       : null,
				value      : null,
				transpose  : false
			}, uniformProperties)
			
		})
		
		var bindFns = _.map( uniforms, function( uniform ) {
			return internals.bindUniformFn( gl, uniform )
		})
		
		return [ uniforms, bindFns ]
	},

	setupTextures : function( gl, shaderProgram, rawTextures ) {
		
		var i = 0

		var textures = _.mapValues( rawTextures, function( properties, textureName ) {

			var textureBuffer = {}
			
			if( _.isUndefined( properties.texture ) ) {
				
				if( properties.image ) {
					textureBuffer = BufferTools.texture( gl, properties.image, properties, properties.callback )					
				} else if( properties.url ) {
					textureBuffer = BufferTools.texture( gl, properties.url, properties, properties.callback )
				}
			}
			
			var unit = i++
			
			return _.extend({
				location   : gl.getUniformLocation( shaderProgram, textureName ),
				type       : null,
				value      : null,
				transpose  : false,
				unit       : unit,
				unitEnum   : gl["TEXTURE"+unit]
			}, textureBuffer, properties)
		})
		
		
		var bindFns = _.map( textures, function( texture, key ) {
			
			return function() {
				gl.activeTexture( texture.unitEnum )
				gl.bindTexture( gl.TEXTURE_2D, texture.texture )
				gl.uniform1i( texture.location, texture.unit )
			}
		})
		
		return [ textures, bindFns ]
	},
	
	bindUniformFn : function( gl, config ) {
				
		var vectorUniformTypes = [ "1fv", "2fv", "3fv", "4fv", "1iv", "2iv", "3iv", "4iv" ]
		var matrixUniformTypes = [ "Matrix2fv", "Matrix3fv", "Matrix4fv" ]
		var singleUniformTypes = [ "1f",  "2f",  "3f",  "4f",  "1i",  "2i",  "3i",  "4i" ]
		
		var glUniform = gl["uniform" + config.type]
		
		if( _.contains( vectorUniformTypes, config.type )) {
			
			return function() {
				glUniform.call( gl, config.location, config.value )
			}
			
		} else if( _.contains( matrixUniformTypes, config.type )) {
			
			return function() {
				glUniform.call( gl, config.location, Boolean(config.transpose), config.value )
			}
			
		} else if( _.contains( singleUniformTypes, config.type )) {
			
			var dimensions = config.type.substr(0,1)
			
			switch( dimensions ) {
				case "1":
					return function() {
						glUniform.call( gl, config.location, config.value[0] )
					}
					break;
				case "2":
					return function() {
						glUniform.call( gl, config.location, config.value[0], config.value[1] )
					}
					break;
				case "3":
					return function() {
						glUniform.call( gl, config.location, config.value[0], config.value[1], config.value[3] )
					}
					break;
				case "4":
					return function() {
						glUniform.call( gl, config.location, config.value[0], config.value[1], config.value[3], config.value[4] )
					}
					break;
			}
		} else {
			console.warn('Uniform Types should be of the forms:', validUniformTypes.concat( singleUniformTypes) )
			throw "Could not find that uniform function base on the uniform type."
		}
	},
	
	wrapGl : function( gl ) {
		
		var exclude = [ "wrapGl" ]
		
		return Object.freeze( _.reduce( module.exports, function( memo, value, key ) {
			
			if( !_.contains( exclude, key ) ) {
				memo[key] = _.partial( value, gl )
			}
			
			return memo
		}, {}))
	},
	
	modify : function( gl, oldConfig, newConfig ) {
		
		var cleanedConfig = {}
		
		if( !_.isUndefined( newConfig.elements ) ) {
			
			if( _.isArray( newConfig.elements ) || ArrayBuffer.isView( newConfig.elements )) {
				cleanedConfig.elements = newConfig.elements
			} else {
				cleanedConfig.elements = _.extend({},
					oldConfig.elements,
					internals.cleanValuesAndBuffer( newConfig.elements )
				)
			}
		}
		
		if( !_.isUndefined( newConfig.attributes ) ) {
			cleanedConfig.attributes = _.extend({},
				oldConfig.attributes,
				_.mapValues( newConfig.attributes, internals.cleanValuesAndBuffer )
			)
		}
		if( !_.isUndefined( newConfig.uniforms ) ) {
			cleanedConfig.uniforms = _.extend({},
				oldConfig.uniforms,
				_.mapValues( newConfig.uniforms, internals.cleanValuesAndBuffer )
			)
		}
		
		return internals.setup( gl,
			_.extend( {}, oldConfig, newConfig, cleanedConfig )
		)
	},
	
	cleanValuesAndBuffer : function( thing ) {
		
		// If the buffer needs to be rebuilt
		if( thing.value && _.isUndefined(thing.buffer) ) {
			return _.extend({
				buffer : null
			}, thing)
		}
		
		if( thing.buffer && _.isUndefined(thing.value) ) {
			return _.extend({
				value: null
			}, thing)
		}
	}
}

module.exports = Object.freeze({
	compileShader  : internals.compileShader,
	linkProgram    : internals.linkProgram,
	createProgram  : internals.createProgram,
	setup          : internals.setup,
	modify         : internals.modify,
	wrapGl         : internals.wrapGl
})