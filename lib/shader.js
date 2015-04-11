var _ = require('lodash')

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
	
	setup : function( gl, shaderProgram, values ) {
		
		var [ attributes, bindAttributeFns ] = internals.setupAttributes( gl, shaderProgram, values.attributes )
		var [ uniforms, bindUniformFns ] = internals.setupUniforms( gl, shaderProgram, values.uniforms )
		var bindElements = internals.bindElementsFn( values.elements )
		
		return {
			attributes: attributes,
			uniforms: uniforms,
			elements: values.elements,
			bind: internals.bindProgramFn( gl, shaderProgram, bindElements, bindAttributeFns, bindUniformFns ),
			unbind: internals.unbindProgramFn( gl )
		}
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
			
			memo[attrName] = _.extend({
				buffer     : null,
				location   : gl.getAttribLocation( shaderProgram, attrName ),
				type       : gl.FLOAT,
				size       : 3,
				normalized : false,
				stride     : 0,
				offset     : 0
			}, attrProperties)
			
			return memo
		}, {})
		
		var bindFns = _.map( attributes, function( attribute ) {
			return internals.bindAttributeFn( gl, attribute )
		})
		
		return [ attributes, bindFns ]
	},
	
	bindAttributeFn : function( gl, config ) {
		
		return function() {
			
			config.buffer.bind()
			gl.enableVertexAttribArray( config.location )
			gl.vertexAttribPointer(
				config.location
			  , config.size
			  , config.type
			  , config.normalized
			  , config.stride
			  , config.offset
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