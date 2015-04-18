var _ = require('lodash')

var internals = {
	
	createBuffer : function( gl, value, type = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW ) {
		
		var buffer = gl.createBuffer()
		gl.bindBuffer( type, buffer )
		gl.bufferData( type, value, usage )
		gl.bindBuffer( type, buffer )
		
		return {
			value: value
		  , buffer: buffer
		  , bufferData: function() {
				gl.bufferData( type, value, usage )
			}
		  , bind: function() {
				gl.bindBuffer( type, buffer )
			}
		}
	},
	
	createTexture : function( gl, srcOrImage, properties, callback ) {
		
		var config = _.extend({
			parameters : [
				[gl.TEXTURE_MIN_FILTER, gl.LINEAR]
			]
		  , level : 0
		  , internalformat : gl.RGBA
		  , format : gl.RGBA
		  , type : gl.UNSIGNED_BYTE
		  , mipmap : false
		  , state : { loaded: false }
		}, properties)
		
		var texture = gl.createTexture()
		var image
		
		var uploadData = function() {
			
			gl.bindTexture( gl.TEXTURE_2D, texture )
			
			gl.texImage2D(
				gl.TEXTURE_2D          // GLenum target
			  , 0                      // GLint level
			  , gl.RGBA                // GLenum internalformat
			  , gl.RGBA                // GLenum format
			  , gl.UNSIGNED_BYTE       // GLenum type
			  , image                  // TexImageSource? source
			)
			
			_.each( config.parameters,
				([name, value]) => { gl.texParameteri( gl.TEXTURE_2D, name, value) }
			)
			
			if( config.mipmap ) {
				gl.generateMipmap(gl.TEXTURE_2D)
			}
			
			gl.bindTexture(gl.TEXTURE_2D, null)
			if( callback ) callback()
		}
		
		if( _.isString( srcOrImage ) ) {
			image = new Image()
			image.onload = uploadData
			image.src = srcOrImage
		} else {
			image = srcOrImage
			uploadData()
		}
		
		return {
			texture : texture,
			image : image
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
	texture : internals.createTexture,
	create : internals.createBuffer,
	wrapGl : internals.wrapGl
}