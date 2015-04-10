var _ = require('lodash')

window.consoleGlEnum = (function() {

	var keys = []

	return function( value ) { //( value ) or ( gl, value )
		
		var gl
		
		if(arguments.length === 2) {
			gl = arguments[0]
			value = arguments[1]
		} else {
			var gl = document.createElement('canvas').getContext('webgl')
		}
		
		if( keys.length === 0 ) {
			
			for( var key in gl ) {
				keys.push(key)
			}
		}
		
		var matches = _.filter( keys, function( key ) {
			return gl[key] === value
		})
		
		return _.map(matches, function( key ) {
			return "gl." + key
		})
	}
})()

window.consoleMat = function( els, decimalPlaces ) {
 
	var i, j, el, results;
 
	results = [];
	j = 0;
 
	for( i=0; i < els.length; i++ ) {
		
		if( j === 0 ) {
			results.push([]);
		}
 
		el = els[i];
 
		if( typeof decimalPlaces === "number" ) {
 
			el = Math.round( Math.pow(10, decimalPlaces) * el ) / Math.pow(10, decimalPlaces);
 
		}
 
		results[Math.floor(i / 4) % 4].push( el );
 
		j++;
		j %= 4;
		
		if( i % 16 === 15 ) {
			console.table( results );
			results = [];
		}
 
	}
 
}