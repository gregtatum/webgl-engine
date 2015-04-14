require('../lib/utils/console-tools')

var CanvasManager = require('../lib/canvas')
var ShaderTools = require('../lib/shader')
var Fs = require('fs')
var Camera = require('../lib/camera')
var Model = require('../lib/model')
var CreateLoop = require('poem-loop')

// The basic init
var canvasManager = CanvasManager()
var gl = canvasManager.gl
var shaderTools = ShaderTools.wrapGl(gl)
var model = Model()
var camera = Camera( gl )
var loop = CreateLoop()

// GL settings
gl.enable( gl.CULL_FACE )
gl.enable( gl.DEPTH_TEST )
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Build shader
var shaderProgram = shaderTools.createProgram(
	Fs.readFileSync( __dirname + "/../lib/shaders/model.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/../lib/shaders/model.frag", 'utf8')
)

var box = require('./models/box.json')

var shader = shaderTools.setup( shaderProgram, {
	
	elements: box.cells,
	
	attributes: {
		position: {
			values: box.positions,
			size: 3
		},
		color: {
			values: box.colors,
			size: 4
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
		
	shader.draw() // gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0 )
	
	shader.unbind()
	
})

loop.start()