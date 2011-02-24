Function.prototype.bind = function (a)
{
	if (arguments.length < 2 && typeof arguments[0] === 'undefined') return this;
	var b = this,
		c = Array.prototype.slice.call(arguments).slice(1);
	return function ()
	{
		var d = c.concat(Array.prototype.slice.call(arguments));
		return b.apply(a, d)
	}
};

function log(msg)
{
	console.log(msg);
}