
/**
 * Transition
 *
 *
 */
function Transition(factory, start, end) {
	this.factory = factory;
	if (typeof start !== "undefined")
		this.push({start: start, end: typeof end !== "undefined" ? end : start});
}

Transition.prototype = [ ];

/**
 * accepts
 *
 *
 */
Transition.prototype.accepts = function(start, end) {
	if (typeof end === "undefined")
		end = start;
	var factory = this.factory;
	return this.some(function(range){ return (factory.compare(start, range.start) >= 0) && (factory.compare(end, range.end) <= 0); });
}

/**
 * acceptsAny
 *
 *
 */
Transition.prototype.acceptsAny = function(start, end) {
	var factory = this.factory;
	return this.some(function(range){ return (factory.compare(start, range.start) >= 0) || (factory.compare(end, range.end) <= 0); });
}

/**
 * intersect
 *
 *
 */
Transition.prototype.intersect = function(other) {
	if (other.length === 0)
		return other;
	
	var 
		factory = this.factory,
		out = new Transition(factory);
	
	this.forEach(function(r1) {
		other.forEach(function(r2) {
			var 
				start = factory.compare(r2.start, r1.start) >= 0 ? r2.start : r1.start,
				end = factory.compare(r2.end, r1.end) <= 0 ? r2.end : r1.end;
			if (factory.compare(start, end) <= 0)
				out.push({start: start, end: end});
		})
	})
	
	
	return out;
}

/**
 * union
 *
 *
 */
Transition.prototype.union = function(other) {
	if (other.length === 0)
			return this;
	if (this.length === 0)
		return other;
		
	var 
		factory = this.factory,
		out = new Transition(factory);
		lastStart = null, 
		lastEnd = null,
		all = [];
	
	function a(x) {
		all = all.concat(x)
	}	
	this.forEach(a);
	other.forEach(a);
	
	all.sort(function(a, b) {
		return factory.compare(a.start, b.start);
	})	
	
	all.forEach(function(range) {
		if (lastStart === null)
			lastStart = range.start;
		if (lastEnd === null)
			lastEnd = range.end;
			
		if (factory.compare(range.start, lastStart) >= 0 && (factory.compare(range.start, lastEnd) <= 0 || factory.compare(factory.decrement(range.start), lastEnd) === 0)) {
			lastEnd = range.end;
		} else {
			
			out.push({start: lastStart, end: lastEnd});
			lastStart = range.start;
			lastEnd = range.end;
		}
	})

	if (lastStart !== null && lastEnd !== null)
		out.push({start: lastStart, end: lastEnd});
	return out;
}
/**
 * difference
 *
 *
 */
Transition.prototype.difference = function(other) {
	if (other.length === 0)
		return this;
		
	var 
		factory = this.factory,
		out = new Transition(factory);
	
	this.forEach(function(r1) {
		var keep = true;
		other.forEach(function(r2) {
			
			var 
				e = factory.compare(r2.end, r1.end),
				s = factory.compare(r2.start, r1.start);
				
			
			//console.log(String.fromCharCode(r2.end) + " vs "+ String.fromCharCode(r1.end) + " = " + e);	
			//console.log(String.fromCharCode(r2.start) + " vs "+ String.fromCharCode(r1.start) + " = " + s);
			
			//r2 covers  r1 completely
			if ( s <= 0 && e >= 0 ) {
				
				//just remove the element
				keep = false;
			}
			//r2 is completely contained inside of r1
			else if ( s >= 0 && e <= 0  ) {
				
				//interval r1.start to r2.start
				if (s != 0)
					out.push({start: r1.start, end: factory.decrement(r2.start)});
				
				//interval r2.end to r1.end
				if (e != 0)
					out.push({start: factory.increment(r2.end), end: r1.end});
				keep = false;
			}
			//r2 extends  over the left side of r1, but is otherwise inside
			else if ( s < 0 && e <= 0 ) {
				if (factory.compare(r2.end, r1.start) >= 0) {
					//interval r2.end to r1.end
					out.push({start: factory.increment(r2.end), end: r1.end});
					keep = false;
				}
			}
			//r2 extends over the right side of r1, but is otherwise inside
			else if ( s >= 0 && e > 0 ) {
				if (factory.compare(r2.start, r1.end) <= 0) {
					//interval r1.start to r2.start
					out.push({start: r1.start, end: factory.decrement(r2.start)});
					keep = false;
				}
			}
			
			
		
		});
		
		if (keep)
			out.push(r1);
		
	});
	
	return out;
}

/**
 * invert
 *
 *
 */
Transition.prototype.invert = function() {
	var anything = this.factory.anything();
	return this.reduce(function(previous, current) { 
		var difference = anything.difference([{start: current.start, end: current.end}]);
		return previous.intersect(difference);
	}, anything);
}

Transition.prototype.isSubsetOf = function(transition) {
	return this.some(function(range) {
		return transition.accepts(range.start, range.end);	
	})
}
/**
 * disjointify
 * Given a set of transitions, create an equivalent set of transitions that are
 * mutually disjoint (that is to say no two transitions in the set accept the
 * same input).
 */
Transition.disjointify = function(transitions) {
	var 
		out = [ ],
		done = true;
		
	function key(t) {
		var o = [ ]
		t.forEach(function(r){
			o.push(r.start+"-"+r.end);
		});
		return o.join("/");
	}
	
	function addResult(t) {
		var k = key(t);
		if (!out[k]) {
			out[k] = true;
			//Add the transition to the result
			out.push(t);
		}
	}
	
	transitions.forEach(function(transition, i) {
		var 
			hasCommon = false,
			newTransitions = [ ];
		
		
		
		transitions.forEach(function(otherTransition, i) {
			
			if (transition === otherTransition)
				return;
			
			//Match the current transition with every other transition
			var otherTransition = transitions[i];
			//Create the intersection of the two transitions
			var intersection = transition.intersect(otherTransition);
				
			//If this intersection contains items, then
			if (intersection.length > 0) {
				// the two transitions have common elements
				hasCommon = true;
				//We have more work to do
				done = false;
				//Add the intersection to the list of new transitions we created
				newTransitions.push(intersection);
				
	
				//Add the transition to the result
				addResult(intersection);
				
			}
		});
		
		
		
		
		//transition has nothing in common with any other transition
		if (!hasCommon) {
			//Therefore we can add it to the set of disjoint transitions
			addResult(transition);
	
		}
		//transition has something in common with the other transitions
		else {
			
			//Reduce the set of new transitions to a single transition containing
			//everything in the initial transition less all of its common elements
			var newTransition = newTransitions.reduce(function(previous, current) {
				var result = previous.difference(current);
				return result;
			}, transition);
									
			//If this transition isn't empty
			if (newTransition.length > 0)
				//Add it to the result
				addResult(newTransition);
		}
	})
	
	//If everything has been verified as mutually disjoint
	if (done) 
		//Then we're done, return the result
		return out;
	
	//Otherwise rerun the disjointing algorithm on the result we attained, because the
	//intersections may have elements in common with each other as well
	return Transition.disjointify(out);
}

Transition.prototype.toString = function() {
	var res = [];
	this.forEach(function(range) {
		//if (range.start === range.end)
		//	res.push(String.fromCharCode(range.start));
		//else
		//	res.push("{"+String.fromCharCode(range.start)+" - "+String.fromCharCode(range.end)+"}")
			
		if (range.start === range.end)
			res.push(range.start);
		else
			res.push("{"+range.start+" - "+range.end+"}")
	})
	return res.join(", ");
}

module.exports = Transition;