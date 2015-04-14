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
	
	setup : function( gl, shaderProgram, config ) {
		
		var [ elements,   bindElements ]     = internals.setupElements(   gl, config.elements )
		var [ attributes, bindAttributeFns ] = internals.setupAttributes( gl, shaderProgram, config.attributes )
		var [ uniforms,   bindUniformFns ]   = internals.setupUniforms(   gl, shaderProgram, config.uniforms )
		
		var bind = internals.bindProgramFn( gl, shaderProgram, bindElements, bindAttributeFns, bindUniformFns )
		var unbind = internals.unbindProgramFn( gl )
		
		var draw = config.elements ?
			internals.drawElementsFn( gl, config, elements ) :
			internals.drawArraysFn( gl, config )
		
		return {
			attributes: attributes,
			uniforms: uniforms,
			elements: elements,
			bind: bind,
			unbind: unbind,
			draw: draw
		}
	},
	
	setupElements : function( gl, inputs ) {
		
		if( inputs ) {
			// Accepts a buffer object as generated from the buffer tools (buffers.js)
		
			var properties = _.isArray( inputs ) ? { values: inputs } : inputs
		
			var elsConfigPreliminary = _.extend({
				values          : null
			  , buffer          : null
			  , type            : gl.ELEMENT_ARRAY_BUFFER
			  , arrayBufferType : Uint16Array
			  , bind            : null
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
		
		if( obj.values && !obj.buffer ) {
				
			var values = (obj.values instanceof Array) ?
				new obj.arrayBufferType( obj.values ) :
				obj.values
			
			var bufferObj = BufferTools.create( gl, values, bufferType )
		
			obj.buffer = bufferObj.buffer
			obj.bind = bufferObj.bind
			
			return _.extend( bufferObj, obj )
			
		} else {
			
			return obj
		}
		
	},
	
	drawElementsFn : function( gl, config, elements ) {
		
		var drawConfig = _.extend({
			mode : gl.TRIANGLES
		  , count : elements.values.length
		  , type : gl.UNSIGNED_SHORT
		  , offset : 0
		}, config.draw)
		
		return function() {
			
			gl.drawElements(
				drawConfig.mode,
				drawConfig.count,
				drawConfig.type,
				drawConfig.offset
			)
		}
	},
	
	drawArraysFn : function( gl, config ) {
		
		var drawConfig = _.extend({
			mode : gl.TRIANGLES
		  , count : internals.guessAttributeLength( config.attributes )
		  , first : 0
		}, config.draw)
		
		if( !_.isNumber( drawConfig.count ) ) {
			throw "Count not guess the count of the attributes, and no count was provided on the draw property."
		}
		
		return function() {
			
			gl.drawArrays(
				drawConfig.mode, 
				drawConfig.first,
				drawConfig.count
			)
		}
	},
	
	guessAttributeLength : function( attributes ) {
		
		var attribute = _.find( attributes, function( attribute ) {
			return !!attribute.values && attribute.size > 0
		})
		
		return attribute ? attribute.values.length / attribute.size : null
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
	
	bindProgramFn : function( gl, shaderProgram, bindElements, bindAttributeFns, bindUniformFns ) {
		
		return function() {
			gl.useProgram( shaderProgram )
			bindElements()
			_.each( bindAttributeFns, function(fn) { fn() } )
			_.each( bindUniformFns, function(fn) { fn() } )
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
		
		var uniforms = _.reduce( rawUniforms, function( memo, uniformProperties, uniformName ) {
			
			memo[ uniformName ] = _.extend({
				location   : gl.getUniformLocation( shaderProgram, uniformName ),
				type       : null,
				value      : null,
				transpose  : false
			}, uniformProperties)
			
			return memo

		}, {})
		
		var bindFns = _.map( uniforms, function( uniform ) {
			return internals.bindUniformFn( gl, uniform )
		})
		
		return [ uniforms, bindFns ]
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
}

module.exports = Object.freeze({
	compileShader  : internals.compileShader,
	linkProgram    : internals.linkProgram,
	createProgram  : internals.createProgram,
	setup          : internals.setup,
	wrapGl         : internals.wrapGl
})