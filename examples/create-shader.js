var CreateCanvas = require('../lib/canvas')
var ShaderTools = require('../lib/shader')
var Fs = require('fs')

var canvas = CreateCanvas()
var gl = canvas.gl

var shaders = ShaderTools.bind(gl)

var shader = shaders.createProgram(
	Fs.readFileSync( __dirname + "/../lib/shaders/model.vert", 'utf8'),
	Fs.readFileSync( __dirname + "/../lib/shaders/model.frag", 'utf8')
)