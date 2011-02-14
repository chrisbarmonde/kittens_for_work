
var Options = Class.extend({
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

	save: function(mode)
	{
		localStorage.mode = mode || 'w';
		this.load();
	},

	mode: function(mode)
	{
		this.saveParam('mode', mode);
		return this.getParam('mode', 'w');
	},

	whitelist: function(whitelist)
	{
		this.saveParam('whitelist', whitelist);
		return this.getParam('whitelist', ['formspring']);
	},

	blacklist: function(blacklist)
	{
		this.saveParam('blacklist', blacklist);
		return this.getParam('blacklist', []);
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