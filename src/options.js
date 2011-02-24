
var Options = Class.extend({

	setParam: function(key, value)
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
			this.setParam(name, params[name]);
		}
	},

	strength: function()
	{
		return this.getParam('strength', 3);
	},

	images_blocked: function()
	{
		return this.getParam('images_blocked', 0);
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
