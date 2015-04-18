var _ = require('lodash')

require('../lib/utils/console-tools')

var GenerateBox = require('geo-3d-box')
var CanvasManager = require('../lib/canvas')
var ShaderTools = require('../lib/shader')
var BufferTools = require('../lib/buffers')
var Fs = require('fs')
var Camera = require('../lib/camera')
var Model = require('../lib/model')
var CreateLoop = require('poem-loop')
var TrianglesToLines = require('../lib/utils/triangles-to-lines')

var canvasManager = CanvasManager()
var gl = canvasManager.gl
var shaderTools = ShaderTools.wrapGl(gl)
var bufferTools = BufferTools.wrapGl(gl)
var model = Model()
var camera = Camera( gl )
var loop = CreateLoop()

// Build shader
var shaderProgram = shaderTools.createProgram(
	Fs.readFileSync( __dirname + "/shaders/box.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/shaders/box.frag", 'utf8')
)

var box = GenerateBox({
	size: [1,2,1],
	segments: [10,10,10]
})

var magenta = shaderTools.setup({
	
	program: shaderProgram,
	
	elements: TrianglesToLines( box.cells ),
	
	attributes: {
		position: {
			value: box.positions,
			size: 3
		}
	},
	uniforms: {
		projection : {
			value: camera.projection,
			type: "Matrix4fv"
		},
		color : {
			value: [1,0,1,1],
			type: "4fv"
		},
		modelView : {
			value: model.modelView,
			type: "Matrix4fv"
		}
	},
	drawing: {
		mode: gl.LINES
	}
})

var black = shaderTools.modify( magenta, {
	
	elements: box.cells,
	
	attributes: {
		position: {
			value: box.positions,
			size: 3
		}
	},
	uniforms: {
		color: {
			value: [0,0,0,0.5],
			type: "4fv"
		}
	},
	drawing: {
		mode: gl.TRIANGLES
	}
})

console.clear()
var i = 0


loop.emitter.on('update', function() {

	model.updateModelView( camera.view )

	// gl.enable( gl.CULL_FACE )
	gl.enable( gl.DEPTH_TEST )
	// gl.clear( gl.COLOR_BUFFER_BIT );

	magenta.bind()
	magenta.draw()
	magenta.unbind()
	
	black.bind()
	// black.draw()
	
		// console.clear()
		var opt = black.drawing
		var bytesInAShort = 2
		var pointsInTriangle = 3
		var offset = Math.floor(i) * bytesInAShort * pointsInTriangle
		var offset = Math.floor(i) * bytesInAShort * pointsInTriangle
		
		gl.drawElements( opt.mode, 3, opt.type, offset )
		
		// console.log("gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, "+ offset +" )")
		// i = (i + 6) % (box.cells.length)
		i = (i+0.2) % (box.cells.length / 3)
	
	black.unbind()
})
loop.start()

// debugger
