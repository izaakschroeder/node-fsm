
var EventEmitter = require('events').EventEmitter;

/**
 *
 *
 *
 */
function Context(machine) {
	EventEmitter.call(this);
	this.machine = machine;
	this.reset();
}
util.inherits(Context, EventEmitter);

/**
 *
 *
 *
 */
Context.prototype.reset = function() {
	this.state = this.machine.start;
}

/**
 *
 *
 *
 */
Context.prototype.write = function(data) {
	data = data.charCodeAt(0);
	var possible = this.machine.edges(this.state).filter(function(edge) { return edge.transition.accepts(data); });
	if (possible.length === 0) {
		throw "Unexpected input: "+data+" lol!";
	}
	else if (possible.length === 1) {
		this.state = possible[0].destination;
		this.emit("state", this.state);
	}
	else {
		throw "Ambiguous lol!";
	}
}

/**
 *
 *
 *
 */
Context.prototype.end = function() {
	this.accept();
	this.emit("end");
}

/**
 *
 *
 *
 */
Context.prototype.accept = function() {
	if (!this.accepts())
		throw "Unexpected end LOL!";
	this.emit("accept", this.state);
	this.reset();
}

/**
 *
 *
 *
 */
Context.prototype.accepts = function(data) {
	if (data) {
		data = data.charCodeAt(0);
		return this.machine.edges(this.state).some(function(edge) { return edge.transition.accepts(data); });
	}
	else
		return this.state in this.machine.end;
}

module.exports = Context;
