var Transition = require('../transition');

function ByteFactory() {
	
}

ByteFactory.prototype.compare = function(a, b) {
	if (a === b)
		return 0;
	else if (a < b)
		return -1;
	else
		return 1;
}

ByteFactory.prototype.increment = function(a) {
	return a + 1;
}

ByteFactory.prototype.decrement = function(a) {
	return a - 1;
}

ByteFactory.prototype.anything = function() {
	return new Transition(this, 0, 255);
}

module.exports = new ByteFactory();