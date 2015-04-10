var _ = require('lodash')

var internals = {
	
	createBuffer : function( gl, data, type = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW ) {
		
		var buffer = gl.createBuffer()
		gl.bindBuffer( type, buffer )
		gl.bufferData( type, data, usage )
	
		return {
			buffer: buffer,
			bind: function() {
				gl.bindBuffer( type, buffer )
			}
		}
	},
		
	bind : function( gl ) {
		
		var exclude = [ "bind" ]
		
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
	bind : internals.bind
}