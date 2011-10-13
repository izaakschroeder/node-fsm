

var Transition = require('./transition'), Context = require('./context');

/**
 * FiniteStateMachine
 *
 *
 */
function FiniteStateMachine(arg) {
	if (arg instanceof FiniteStateMachine) {
		this.graph = arg.graph.slice();
		this.start = arg.start;
		this.end = arg.end;
	}
	else {
		this.states = [ ];
		this.graph = [ ];
		this.start = null;
		this.end = { };
	}
	
}

/**
 * length
 *
 *
 */
FiniteStateMachine.prototype.length = function() {
	return this.graph.length;
}

/**
 * createState
 *
 *
 */
FiniteStateMachine.prototype.createState = function(children, acceptance) {
	
	if (typeof children === "boolean") {
		acceptance = children;
		children = null;
	}
	
	var state = this.graph.length;
	
	this.graph[state] = [ ];
	this.states[state] = { children: children };
	
	if (acceptance)
		this.end[state] = true;
	else if (this.start === null)
		this.start = state;
	return state;
}

/**
 * getTransitions
 *
 *
 */
FiniteStateMachine.prototype.edges = function(state) {
	return this.graph[state];
}

/**
 * getReachableTransitions
 *
 *
 */
FiniteStateMachine.prototype.reachableEdges = function(state, includeEpsilon) {
	todo = [ state ];
	visited = { };
	results = [ ]
	while (todo.length > 0) {
		var state = todo.pop();
		visited[state] = true;
		this.graph[state].forEach(function(edge) {
			var isEpsilon = edge.transition === FiniteStateMachine.Epsilon;
			if (isEpsilon && !visited[edge.destination])
				todo.push(edge.destination)
			if (!isEpsilon || includeEpsilon)
				results.push(edge);
		});
	}
	return results;
}

FiniteStateMachine.prototype.reachableStates = function(state) {
	todo = [ state ];
	visited = { };
	results = [ ]
	while (todo.length > 0) {
		var state = todo.pop();
		results.push(state);
		visited[state] = true;
		this.graph[state].forEach(function(edge) {
			var isEpsilon = edge.transition === FiniteStateMachine.Epsilon;
			if (isEpsilon && !visited[edge.destination])
				todo.push(edge.destination)
		});
	}
	return results;
}

/**
 * transition
 *
 *
 */
FiniteStateMachine.prototype.transition = function(from, to, transition) {
	var fsm = this;
	if (!transition)
		transition = FiniteStateMachine.Epsilon;
	
	function normalize(t) {
		switch(typeof t) {
		case "object":
			if (Array.isArray(t))
				return t;
			return Object.getOwnPropertyNames(t);
		default:
			return [ t ];
		}
	}
	
	from = normalize(from);
	to = normalize(to);
	
	from.forEach(function(sourceState) {
		to.forEach(function(destinationState){
			if (!fsm.graph[sourceState] || !fsm.graph[destinationState])
				throw "That states "+util.inspect(sourceState)+" -> "+util.inspect(destinationState)+" isn't in the graph!";
			fsm.graph[sourceState].push({transition: transition, destination: destinationState, source: sourceState });
		})
	})
}

/**
 * isDeterministic
 * Determine whether the machine is deterministic or not.
 *
 */
FiniteStateMachine.prototype.isDeterministic = function() {
	var 
		fsm = this,
		visiting = [ this.start ];
		visited = { };

	while (visiting.length > 0) {
		var state = visiting.pop(); //Remove state from the set
		visited[state] = true;
		fsm.getTransitions(state).forEach(function(edge) {
			visiting.push(edge.state);
			if (fsm.getTransitions(state).some(function(otherEdge){ return edge.transition.intersect(otherEdge.transition).length > 0; }));
				return false;
		})
	}
	return true;
}

/**
 * concatenate
 *
 *
 */
FiniteStateMachine.prototype.concatenate = function(other) {
	return FiniteStateMachine.concatenate(this, other);
}

/**
 * disjunct
 *
 *
 */
FiniteStateMachine.prototype.disjunct = function(other) {
	return FiniteStateMachine.disjunct(this, other);
}

/**
 * kleenePlus
 *
 *
 */
FiniteStateMachine.prototype.kleenePlus = function() {
	return FiniteStateMachine.kleenePlus(this);
}

/**
 * kleeneStar
 *
 *
 */
FiniteStateMachine.prototype.kleeneStar = function() {
	return FiniteStateMachine.kleeneStar(this);
}

/**
 * optional
 *
 *
 */
FiniteStateMachine.prototype.optional = function() {
	return FiniteStateMachine.optional(this);
}

FiniteStateMachine.prototype.multiplicity = function(min, max) {
	return FiniteStateMachine.multiplicity(this, min, max);
}

/**
 * determinize
 *
 *
 */
FiniteStateMachine.prototype.determinize = function() {
	return FiniteStateMachine.determinize(this);
}

FiniteStateMachine.prototype.context = function() {
	return new Context(this);
}

/**
 *
 *
 *
 */
FiniteStateMachine.prototype.toDot = function() {
	var output = "";
	
	output += "\tgraph [truecolor=\"true\",bgcolor=\"transparent\", rankdir=\"LR\"];\n"
	
	output += "\tnode [shape=box];\n";
	output += "\t\tS"+this.start+"; \n";
	
	output += "\tnode [shape=doublecircle];\n";
	for (var state in this.end)
		output += "\t\tS"+state+"; \n";
	
	
	output += "\tnode [shape=circle];\n";
	this.graph.forEach(function(edges, state) {
		edges.forEach(function(edge) {
			output += "\t\tS"+state+" -> S"+edge.destination;
			if (edge.transition.length > 0)
				output +=  "[ label = \" "+edge.transition.toString()+" \" ]"
			output +=  ";\n";
		})
	})
	return "digraph G {\n "+output+" }";
}

function unify(fsms, mode) {
	var output = new FiniteStateMachine(), start = undefined, previous = undefined;
	
	if (mode === "disjunction" && (fsms.length > 1)) 
		start = output.createState();
	
	
	
	for(var i = 0; i < fsms.length; ++i) {
		var fsm = fsms[i], stateMap = [ ];
		if (fsm instanceof FiniteStateMachine === false)
			throw "WTF?"
		fsm.graph.forEach(function(edges, state) {
			var newState = output.createState();
			stateMap[state] = newState;
			output.states[newState] = fsm.states[state];
			if (mode !== "concatenation")
				if (state in fsm.end)
					output.end[newState] = true;
		});
		
		if (start == undefined && i === 0)
			output.start = stateMap[fsm.start];
		else if (start !== undefined)
			output.transition(start, stateMap[fsm.start]);
		
		if (mode === "concatenation") {
			if (i > 0)
				output.transition(previous, stateMap[fsm.start]);
			previous = { };
			for (var state in fsm.end)
				previous[stateMap[state]] = true;
		}
			
		
		fsm.graph.forEach(function(edges, state) {
			edges.forEach(function(edge) {
				output.transition(stateMap[state], stateMap[edge.destination], edge.transition);
			});
		})
		
		if (mode === "concatenation") {
			output.end = previous;
		}
	}
	return output;
}

/**
 * concatenate
 *
 *
 */
FiniteStateMachine.concatenate = function(fsms) {
	return unify(arguments, "concatenation");
}

/**
 * disjunct
 *
 *
 */
FiniteStateMachine.disjunct = function(fsms) {
	return unify(arguments, "disjunction");
}

/**
 * kleenePlus
 *
 *
 */
FiniteStateMachine.kleenePlus = function(fsm) {
	var output = unify(arguments);
	output.transition(output.end, output.start);
	return output;
}

/**
 * kleeneStar
 *
 *
 */
FiniteStateMachine.kleeneStar = function(fsm) {
	var output = unify(arguments);
	output.transition(output.end, output.start);
	output.transition(output.start, output.end);
	return output;
}

/**
 * optional
 *
 *
 */
FiniteStateMachine.optional = function(fsm) {
	var output = unify(arguments);
	output.transition(output.start, output.end);
	return output;
}

FiniteStateMachine.multiplicity = function(fsm, min, max) {
	var out = fsm, opt = FiniteStateMachine.optional(fsm);
	for(var i = 0; i < min; ++i)
		out = FiniteStateMachine.concatenate(out, fsm);
	for (; i < max; ++i)
		out = FiniteStateMachine.concatenate(out, opt);
	return out;
}

FiniteStateMachine.prototype.removeEpsilons = function() {
	return FiniteStateMachine.removeEpsilons(this);
}

/**
 * removeEpsilons
 * Create an equivalent finite state machine with no epsilon
 * transitions.
 */
FiniteStateMachine.removeEpsilons = function(fsm) {
	var output = new FiniteStateMachine();
	
	//Loop through all the states
	fsm.states.forEach(function(state) {
		
		//Get the places we can reach from the current state
		//and loop through each one
		fsm.reachableStates(state).forEach(function(state) {
			//If we can reach the end state from the current state
			if (state in fsm.end)
				//The current state becomes an end state
				output.end[state] = true;
		})
		
		//Loop through all transitions of the current state
		fsm.transitions(state).forEach(function(edge){
			//If the current transition is an epsilon transition
			if (edge.transition === FiniteStateMachine.Epsilon) {
				//Remove that e transition
				output.untransition(s, e.state, e.transition);
				
				//Get all reachable states from the destination of now removed
				//epsilon transition
				fsm.reachableStates(edge.destination).forEach(function(destination) {
					//Loop through all the transitions of those states
					fsm.transitions(destination).forEach(function(edge) {
						//If the transition isn't an epsilon one
						if (edge.transition !== FiniteStateMachine.Epsilon)
							//We can connect the original state with the far state by its old
							//transition from the epsilon state
							output.transition(state, edge.destination, edge.transition);
					})
				})
			}
		})
	})
	
	return output;
}


/**
 * determinize
 * Create an equivalent finite state machine which, for any given input, only contains
 * at most one valid transition to a new state.
 */
FiniteStateMachine.determinize = function(fsm) {
	
	var 
		//Create a machine to store our output
		output = new FiniteStateMachine(),
		stateSets = { }, //Map from state -> children
		newStates = { }; //Map from key -> state
	
	function requireStateSet(states) {
		//We assume states is already a set (no duplicates)
		var key = states.sort().join("|");
		if (newStates[key])
			return newStates[key];
		var stateSet = output.createState(states.map(function(id){ return {id: id, state: fsm.states[id] }; }));
		stateSets[stateSet] = states;
		newStates[key] = stateSet;
		return stateSet;
	}
	
	var
		//The new start state is made of all the states reachable from the original start
		newStart = requireStateSet(fsm.reachableStates(fsm.start)),
		//Start of by processing the new start start
		todo = [ newStart ],
		//List of states that have been visited
		visited = { };
	
	//Set the output of the new machine to the new start state
	output.start = newStart;

	//While there is work to do
	while (todo.length > 0) {
		
		//Get the state we're working on
		var source = todo.pop();
		
		//If we've visited it before
		if (visited[source])
			//Don't worry about it!
			continue;
		//Mark it as visited
		visited[source] = true;
		
		var reachableEdges = [ ];		
		//For all the child states in the current state set
		stateSets[source].forEach(function(state) {
			//If a child state is an end state
			if (state in fsm.end) {
				//Then the new state will also be an end state
				output.end[source] = true;
			}
			//Collect all the edges reachable in the original machine from this state
			fsm.reachableEdges(state).forEach(function(edge) {
				//Add each edge to the list of reachable edges
				reachableEdges.push(edge);
			})
						
		})
		
		
		
		//Make a disjoint set of new transitions comprised of using all the reachable old transitions	
		var 
			oldTransitions = reachableEdges.map(function(edge) { return edge.transition; }),
			newTransitions = Transition.disjointify(oldTransitions);
		
		//Loop through all the new transitions
		newTransitions.forEach(function(transition) {
			var destinationStates = { };
			
			//Loop through all the old edges
			reachableEdges.forEach(function(edge) {
				//If the new transition matches something in the old transition
				if (transition.isSubsetOf(edge.transition)) 
					//Add the reaching states to the new transitions destination
					fsm.reachableStates(edge.destination).forEach(function(state) {
						//Mark the state as being in the set
						destinationStates[state] = true;
					})
			})
			
			//Remap the set into an array
			destinationStates = Object.getOwnPropertyNames(destinationStates);
			
			//If this transition actually goes somewhere
			if (destinationStates.length > 0) {
				//Create a potentially new state comprised of all the destination elements
				var destination = requireStateSet(destinationStates);
				//Add that state to the todo list
				todo.push(destination);
				//Transition from source to destination via the new transition
				output.transition(source, destination, transition);
			}
		});
		
	}
	//We're done!
	return output;
}

/**
 * reverse
 *
 *
 */
FiniteStateMachine.reverse = function(fsm) {
	var output = new FiniteStateMachine();
	
	
	return output;
}

/**
 * minimize
 *
 *
 */
FiniteStateMachine.minimize = function(fsm) {
	return 
		FiniteStateMachine.determinize(
		FiniteStateMachine.reverse(
		FiniteStateMachine.determinize(
		FiniteStateMachine.reverse(fsm))));
	
}


FiniteStateMachine.Epsilon = new Transition();

FiniteStateMachine.Epsilon.toString = function() {
	return "ε";
}

module.exports = FiniteStateMachine;
