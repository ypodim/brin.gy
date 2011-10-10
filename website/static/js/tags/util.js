
/*
 * JS extensions
 */
Function.prototype.bind = function(thisObj) {
    var fn = this;
    return function() {
	return fn.apply(thisObj, arguments);
    };
};
