
var Options = Class.extend({

	init: function()
	{
		
	},

	saveParam: function(key, value)
	{
		if (value == undefined) return;
		localStorage[key] = value;
	},

	getParam: function(key, def)
	{
		if (def == undefined) def = null;
		return (key in localStorage) ? localStorage[key] : def;
	},

	save: function(params)
	{
		for (var name in params)
		{
			this.saveParam(name, params[name]);
		}
	},

	strength: function()
	{
		return this.getParam('strength', 3);
	},

	nudeJSStrength: function()
	{
		return this.strengths[this.strength()];
	},

	checkUrl: function(url)
	{
		var list = (this.mode() == "w") ? this.whitelist() : this.blacklist();
		var found = false;
		for (var i = 0; i < list.length; i++)
		{
			if (url.indexOf(list[i]) > -1)
			{
				found = true;
				break;
			}
		}

		return (this.mode() == "w") ? found : !found;
	}
});