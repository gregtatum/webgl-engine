var _ = require('lodash')

module.exports = function trianglesToLines( triangles ) {
	
	return _.chain( triangles )
		.chunk( 3 )
		.map( ([a,b,c]) => [ a,b,b,c,c,a ] )
		.flatten()
		.value()
}