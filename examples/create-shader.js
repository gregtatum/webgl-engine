var CanvasManager = require('../lib/canvas')
var ShaderTools = require('../lib/shader')
var BufferTools = require('../lib/buffers')
var Fs = require('fs')
var Camera = require('../lib/camera')
var Model = require('../lib/model')
require('../lib/utils/console-tools')
var CreateLoop = require('poem-loop')


var canvasManager = CanvasManager()
var gl = canvasManager.gl
var shaderTools = ShaderTools.bind(gl)
var bufferTools = BufferTools.bind(gl)
var model = Model()
var camera = Camera( gl )
var loop = CreateLoop()

// Build shader
var shaderProgram = shaderTools.createProgram(
	Fs.readFileSync( __dirname + "/../lib/shaders/model.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/../lib/shaders/model.frag", 'utf8')
)

var shader = shaderTools.setup( shaderProgram, {
	attributes: {
		position: {
			buffer: bufferTools.create( new Float32Array([
				-1,  0, 0,
				 0, -1, 0,
				 1,  1, 0,
				-1,  0, -1,
				 0, -1, -1,
				 1,  1, -1,
				-1,  0, -2,
				 0, -1, -2,
				 1,  1, -2
			])),
			bufferType: gl.ARRAY_BUFFER,
			dataType: gl.FLOAT,
			size: 3
		},
		color: {
			buffer: bufferTools.create( new Float32Array([
				 1.0,  0.0, 0.0,
				 1.0,  1.0, 0.0,
				 1.0,  0.0, 1.0,
				 0.0,  1.0, 0.0,
				 1.0,  1.0, 0.0,
				 0.0,  1.0, 1.0,
				 0.0,  0.0, 1.0,
				 1.0,  0.0, 1.0,
				 0.0,  1.0, 1.0
			])),
			bufferType: gl.ARRAY_BUFFER,
			dataType: gl.FLOAT,
			size: 3
		}
	},
	uniforms: {
		projection : {
			value: camera.projection,
			type: "Matrix4fv"
		},
		modelView : {
			value: model.modelView,
			type: "Matrix4fv"
		}
	}
})

loop.emitter.on('update', function() {
	
	model.updateModelView( camera.view )
	shader.bind()
	gl.drawArrays( gl.TRIANGLES, 0, 9 )
})
loop.start()

// debugger
