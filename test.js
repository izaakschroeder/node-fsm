
var 
	FiniteStateMachine = require('./fsm'),
	Transition = require('./transition'),
	factory = require('./types/byte.js'),
	assert = require('assert');


function test1() {
	
	var 
		t1 = new Transition(factory, 23, 53), 
		t2 = t1.invert(),
		t3 = t1.union(t2),
		t4 = new Transition(factory, 25, 64),
		t5 = new Transition(factory, 18, 30),
		t6 = t4.intersect(t1),
		t7 = t5.intersect(t1),
		t8 = t4.union(t5),
		t9 = t5.difference(t1),
		t10 = t1.difference(t5),
		t11 = new Transition(factory, 30, 40),
		t12 = t1.difference(t11),
		t13 = t11.difference(t1);
		
		
		var o = Transition.disjointify([t1, t4, t5]);
	
	var list = [23, 24, 25, 34, 52, 53], ranges = [[23, 53], [25, 43]], anything = factory.anything();
	
	//Basic factory checks
	assert.ok(factory.compare(4, 4) === 0)
	assert.ok(factory.compare(5, 3) > 0)
	assert.ok(factory.compare(2, 3) < 0)
	
	//Make sure it accepts all valid values
	assert.ok(list.every(function(i){ return t1.accepts(i); }));
	assert.ok(ranges.every(function(i){ return t1.accepts(i[0], i[1]); }));
	
	//Make sure the inverse accepts no such values
	assert.ok(list.every(function(i){ return !t2.accepts(i); }));
	assert.ok(ranges.every(function(i){ return !t2.accepts(i[0], i[1]); }));
	
	//The union of a transition and its inverse should be the universe
	assert.ok(t3.start === anything.start);
	assert.ok(t3.end === anything.end);
	
	//[18, 30] - [23, 53] = [18, 22]
	assert.ok(t9.accepts(18, 22));
	
	//[23, 53] - [18, 30] = [31, 53]
	assert.ok(t10.accepts(31, 53));
	
	//[23, 53] - [30, 40] = [23, 29], [41, 53]
	assert.ok([[23, 29], [41, 53]].every(function(i) { return t12.accepts(i[0], i[1]); }))
	
	//[30, 40] - [23, 53] = empty
	assert.ok(t13.length === 0);
	
}

function test2() {
	var machine = new FiniteStateMachine();
	var s1 = machine.createState()
		s2 = machine.createState(),
		s3 = machine.createState(true);
	machine.transition(s1, s2);
	machine.transition(s2, s3, new Transition(factory, 96, 99))
	
	var r = machine.reachableEdges(s1);
	assert.ok(r.length === 1 && r[0].destination === s3);
}

test1();
test2();