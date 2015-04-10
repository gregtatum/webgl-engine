var GlMatrix = require('gl-matrix')
var Mat4 = GlMatrix.mat4
var Quat = GlMatrix.quat

module.exports = function( gl, shader, geometry, camera, state ) {
	
	var scalarRotation = 0
	var position = [0,0,0]
	
	var identity = Mat4.create()
	var modelView = Mat4.create()
	var model = Mat4.create()
	var rotation = Quat.create()
	
	return {
	
		modelView: modelView,
	
		updateModelView: function( view ) {
			
			scalarRotation += 0.05

			Quat.rotateY( rotation, identity, scalarRotation )
			Quat.rotateX( rotation, rotation, scalarRotation * 0.3 )
			Mat4.fromRotationTranslation( model, rotation, position )
			Mat4.multiply( modelView, view, model )
		}
	}
}