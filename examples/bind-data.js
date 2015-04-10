var CreateCanvas = require('../lib/canvas')
var ShaderTools = require('../lib/shader')
var Fs = require('fs')
require('../lib/triangle')

var canvas = CreateCanvas()
var gl = canvas.gl

var shaders = ShaderTools.bind(gl)

var shader = shaders.createProgram(
	Fs.readFileSync( __dirname + "/../lib/shaders/model.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/../lib/shaders/model.frag", 'utf8')
)



var triangleData = new Float32Array([
	-1,  0, 0,
	 0, -1, 0,
	 1,  1, 0
])