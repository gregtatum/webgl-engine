var _ = require('lodash')

var internals = {
	
	createBuffer : function( gl, values, type = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW ) {
		
		var buffer = gl.createBuffer()
		gl.bindBuffer( type, buffer )
		gl.bufferData( type, values, usage )
		gl.bindBuffer( type, buffer )
		
		return {
			values: values
		  , buffer: buffer
		  , bind: function() {
				gl.bindBuffer( type, buffer )
			}
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

module.exports = {
	create : internals.createBuffer,
	wrapGl : internals.wrapGl
}