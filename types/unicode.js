var Transition = require('../transition');

function UnicodeFactory() {
	
}

UnicodeFactory.prototype.compare = function(a, b) {
	if (a === b)
		return 0;
	else if (a < b)
		return -1;
	else
		return 1;
}

UnicodeFactory.prototype.increment = function(a) {
	return a + 1;
}

UnicodeFactory.prototype.decrement = function(a) {
	return a - 1;
}

UnicodeFactory.prototype.anything = function() {
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/charCodeAt
	return new Transition(this, 0, 1114111);
}

UnicodeFactory.prototype.transition = function(start, end) {
	start = start.charCodeAt(0);
	if (end)
		end = end.charCodeAt(0);
	
	return new Transition(this, start, end);
}

module.exports = new UnicodeFactory();