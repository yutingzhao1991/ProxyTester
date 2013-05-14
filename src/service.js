var Service = function(data) {
    if(!data) {
        // ready is a flag mark this service is ready when it start
        this._ready = false;
        return;
    }
    if(!data.name || !data.url || !data.verify) {
        // must have a name, url, verify witch unique in a unit
        this._ready = false;
        return;
    }
    this._options = data;
    this._name = this.name = data.name;
    // service response url url, like '/show'
    // must unique in a unit
    this._url = data.url;
    // service http method
    // 'POST' 'GET'
    this._method = data.method;
    // the most important function witch operate request and send response
    this._verify = data.verify;
    this._ready = true;
    // witch unit include this service
    this._unit = null;
    this.data = null;
};

// Test for equality any JavaScript type.
// Author: Philippe Rathé <prathe@gmail.com>
// From Qunit
var equiv = (function() {

    // Call the o related callback with the given arguments.
    function bindCallbacks( o, callbacks, args ) {
        var prop = QUnit.objectType( o );
        if ( prop ) {
            if ( QUnit.objectType( callbacks[ prop ] ) === "function" ) {
                return callbacks[ prop ].apply( callbacks, args );
            } else {
                return callbacks[ prop ]; // or undefined
            }
        }
    }

    // the real equiv function
    var innerEquiv,
        // stack to decide between skip/abort functions
        callers = [],
        // stack to avoiding loops from circular referencing
        parents = [],
        parentsB = [],

        getProto = Object.getPrototypeOf || function ( obj ) {
            /*jshint camelcase:false */
            return obj.__proto__;
        },
        callbacks = (function () {

            // for string, boolean, number and null
            function useStrictEquality( b, a ) {
                /*jshint eqeqeq:false */
                if ( b instanceof a.constructor || a instanceof b.constructor ) {
                    // to catch short annotation VS 'new' annotation of a
                    // declaration
                    // e.g. var i = 1;
                    // var j = new Number(1);
                    return a == b;
                } else {
                    return a === b;
                }
            }

            return {
                "string": useStrictEquality,
                "boolean": useStrictEquality,
                "number": useStrictEquality,
                "null": useStrictEquality,
                "undefined": useStrictEquality,

                "nan": function( b ) {
                    return isNaN( b );
                },

                "date": function( b, a ) {
                    return QUnit.objectType( b ) === "date" && a.valueOf() === b.valueOf();
                },

                "regexp": function( b, a ) {
                    return QUnit.objectType( b ) === "regexp" &&
                        // the regex itself
                        a.source === b.source &&
                        // and its modifiers
                        a.global === b.global &&
                        // (gmi) ...
                        a.ignoreCase === b.ignoreCase &&
                        a.multiline === b.multiline &&
                        a.sticky === b.sticky;
                },

                // - skip when the property is a method of an instance (OOP)
                // - abort otherwise,
                // initial === would have catch identical references anyway
                "function": function() {
                    var caller = callers[callers.length - 1];
                    return caller !== Object && typeof caller !== "undefined";
                },

                "array": function( b, a ) {
                    var i, j, len, loop, aCircular, bCircular;

                    // b could be an object literal here
                    if ( QUnit.objectType( b ) !== "array" ) {
                        return false;
                    }

                    len = a.length;
                    if ( len !== b.length ) {
                        // safe and faster
                        return false;
                    }

                    // track reference to avoid circular references
                    parents.push( a );
                    parentsB.push( b );
                    for ( i = 0; i < len; i++ ) {
                        loop = false;
                        for ( j = 0; j < parents.length; j++ ) {
                            aCircular = parents[j] === a[i];
                            bCircular = parentsB[j] === b[i];
                            if ( aCircular || bCircular ) {
                                if ( a[i] === b[i] || aCircular && bCircular ) {
                                    loop = true;
                                } else {
                                    parents.pop();
                                    parentsB.pop();
                                    return false;
                                }
                            }
                        }
                        if ( !loop && !innerEquiv(a[i], b[i]) ) {
                            parents.pop();
                            parentsB.pop();
                            return false;
                        }
                    }
                    parents.pop();
                    parentsB.pop();
                    return true;
                },

                "object": function( b, a ) {
                    /*jshint forin:false */
                    var i, j, loop, aCircular, bCircular,
                        // Default to true
                        eq = true,
                        aProperties = [],
                        bProperties = [];

                    // comparing constructors is more strict than using
                    // instanceof
                    if ( a.constructor !== b.constructor ) {
                        // Allow objects with no prototype to be equivalent to
                        // objects with Object as their constructor.
                        if ( !(( getProto(a) === null && getProto(b) === Object.prototype ) ||
                            ( getProto(b) === null && getProto(a) === Object.prototype ) ) ) {
                                return false;
                        }
                    }

                    // stack constructor before traversing properties
                    callers.push( a.constructor );

                    // track reference to avoid circular references
                    parents.push( a );
                    parentsB.push( b );

                    // be strict: don't ensure hasOwnProperty and go deep
                    for ( i in a ) {
                        loop = false;
                        for ( j = 0; j < parents.length; j++ ) {
                            aCircular = parents[j] === a[i];
                            bCircular = parentsB[j] === b[i];
                            if ( aCircular || bCircular ) {
                                if ( a[i] === b[i] || aCircular && bCircular ) {
                                    loop = true;
                                } else {
                                    eq = false;
                                    break;
                                }
                            }
                        }
                        aProperties.push(i);
                        if ( !loop && !innerEquiv(a[i], b[i]) ) {
                            eq = false;
                            break;
                        }
                    }

                    parents.pop();
                    parentsB.pop();
                    callers.pop(); // unstack, we are done

                    for ( i in b ) {
                        bProperties.push( i ); // collect b's properties
                    }

                    // Ensures identical properties name
                    return eq && innerEquiv( aProperties.sort(), bProperties.sort() );
                }
            };
        }());

    innerEquiv = function() { // can take multiple arguments
        var args = [].slice.apply( arguments );
        if ( args.length < 2 ) {
            return true; // end transition
        }

        return (function( a, b ) {
            if ( a === b ) {
                return true; // catch the most you can
            } else if ( a === null || b === null || typeof a === "undefined" ||
                    typeof b === "undefined" ||
                    QUnit.objectType(a) !== QUnit.objectType(b) ) {
                return false; // don't lose time with error prone cases
            } else {
                return bindCallbacks(a, callbacks, [ b, a ]);
            }

            // apply transition with (1..n) arguments
        }( args[0], args[1] ) && innerEquiv.apply( this, args.splice(1, args.length - 1 )) );
    };

    return innerEquiv;
}());

//private

Service.prototype._onRegister = function(unit) {
    this._unit = unit;
};
Service.prototype._onUnregister = function(unit) {
    service._unit._proxy.unregister(this._url, this);
    service._unit = null;
};

Service.prototype._start = function() {
    console.log('start service: ' + this._name);
    var service = null;
    if(!this._ready) {
        this._unit._dispatchEvent('log', {
            message: 'not available service: ' + this._name
        });
        return;
    }
    this._unit._dispatchEvent('log', {
        message: 'start proxy service at: [' + this._method + ']' + this._url
    });
    this._unit._proxy.register(this._url, this);
};
Service.prototype._stop = function() {
    this._unit._proxy.unregister(this._url, this);
};
Service.prototype._proxy = function(req, res, callbacks) {
    // TODO: callback when response end
    this._verify(req, res, this._unit._servicesMap);
};
Service.prototype._judge = function(type, message) {
    console.log('judge type: ' + type + ' [' + message + ']');
    this._unit._onJudge(this, type, message);
};


/********* service public api ************/

//
// helper api for test
// not for judge
//

Service.prototype.log = function(content) {
    this._unit._dispatchEvent('log', {
        message: content
    });
};

Service.prototype.setData = function(data) {
    this.data = data;
};
Service.prototype.getData = function() {
    return this.data;
};


//
// assert judge api
// make a judge with the test unit
//

Service.prototype.deepEqual = function(actual, expected, message) {
    if(equiv(actual, expected)) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.equal = function(actual, expected, message) {
    if(actual == expected) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.notDeepEqual = function(actual, expected, message) {
    if(!equiv(actual, expected)) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.notEqual = function(actual, expected, message) {
    if(actual != expected) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.notStrictEqual = function(actual, expected, message) {
    if(actual !== expected) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.ok = function(state, message) {
    if(state) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.strictEqual = function(actual, expected, message) {
    if(actual === expected) {
        this._judge('ok', message);
    } else {
        this._judge('error', message);
    }
};

Service.prototype.throws = function(message) {
    this._judge('error', message);
};


module.exports = Service;