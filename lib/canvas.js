var Dom = require('dom-tree')
var On = require('dom-event')
var Off = On.off
var Css = require('dom-css')
var _ = require('lodash')

var internals = {
	
	getContext : function( canvas ) {
		
		var gl, error
		
	    try { gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") }
	    catch(e) { error = e }
		
		if( !gl ) {
			throw new Error({
				message: "Could not create a WebGL context",
				data: {
					canvas: canvas,
					context: gl,
					error: e
				}
			})
		}
		
		return gl
	},
	
	processCanvas : function( config, state ) {
		
		var resizeHandler
		
		if( _.isElement( config.container ) ) {
			config.container.appendChild( config.canvas )
		}
		
		if( config.container === document.body && config.bootstrapWhenContainerIsBody ) {
			
			Css( document.body, {
				height: "100%",
				width: "100%",
				margin: 0
			})
			
			Css( document.body.parentElement, {
				height: "100%"
			})
		}
		
		if( config.resize ) {
			
			resizeHandler = () => internals.resizeCanvas( config.canvas, config.container )
			On( window, 'resize', resizeHandler )
			resizeHandler()
			
		}
		
		return resizeHandler
	},
	
	resizeCanvas : function( canvas, container ) {
			
		Css( canvas, {
			width : container.offsetWidth + "px",
			height : container.offsetHeight + "px"
		})
		
	},
	
	setConfig : function( properties ) {
		
		var config = _.extend({
			canvas: null,
			container: document.body,
			resize: true,
			canvasProvided: true,
			bootstrapWhenContainerIsBody: true
		}, properties)

		if( !config.canvas ) {
			config.canvas = document.createElement( "canvas" )
			config.canvasProvided = false
		}
		
		return config
	},
	
	destroy : function( resizeHandler ) {
		Off( window, resizeHandler )
	}
}

module.exports = function( properties ) {
	
	var config = internals.setConfig( properties )
	
	var state = {
		gl            : internals.getContext( config.canvas ),
		resizeHandler : internals.processCanvas( config, state )
	}
	
	return {
		canvas: config.canvas,
		gl: state.gl,
		destroy: () => internals.destroy( state.resizeHandler )
	}
}
 