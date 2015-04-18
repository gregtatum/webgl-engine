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
	size: [2,1.8,2],
	segments: [100,100,100]
})

var box = shaderTools.setup({
	
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
			value: [0,0.3,0.8,1],
			type: "4fv"
		},
		modelView : {
			value: model.modelView,
			type: "Matrix4fv"
		}
	},
	drawing: {
		mode: gl.LINES,
		usage: gl.DYNAMIC_DRAW
	}
})

console.clear()
var i = 0

console.log(box.elements.value.length / 3)
var position = box.attributes.position.value

loop.emitter.on('update', function() {

	model.updateModelView( camera.view )

	// gl.enable( gl.CULL_FACE )
	gl.enable( gl.DEPTH_TEST )
	// gl.clear( gl.COLOR_BUFFER_BIT );
	for( var i=0; i < position.length; i+=1 ) {
		position[i] += 0.001 * (Math.random() * 2 - 1)
	}
	box.bind()
	box.attributes.position.bufferData()
	box.draw()
	box.unbind()

})
loop.start()

// debugger
