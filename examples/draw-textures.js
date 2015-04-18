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
	Fs.readFileSync( __dirname + "/shaders/textured-box.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/shaders/textured-box.frag", 'utf8')
)

var box = GenerateBox({
	size: [2,2,2],
	segments: [1,1,1]
})

var magenta = shaderTools.setup({
	
	program: shaderProgram,
	
	elements: box.cells,
	
	attributes: {
		position: {
			value: box.positions,
			size: 3
		},
		uv: {
			value: box.uvs,
			size: 2
		}
	},
	textures: {
		texture: {
			url: "examples/assets/crate-www.dougturner.net.jpg"
		}
	},
	uniforms: {
		projection : {
			value: camera.projection,
			type: "Matrix4fv"
		},
		color : {
			value: [0.8,0.5,0,1],
			type: "4fv"
		},
		modelView : {
			value: model.modelView,
			type: "Matrix4fv"
		}
	},
	drawing: {
		mode: gl.TRIANGLES
	}
})

console.clear()

loop.emitter.on('update', function() {

	model.updateModelView( camera.view )

	// gl.enable( gl.CULL_FACE )
	gl.enable( gl.DEPTH_TEST )
	// gl.clear( gl.COLOR_BUFFER_BIT );
	
	magenta.bind()
	magenta.draw()
	magenta.unbind()
	
})
loop.start()

// debugger
