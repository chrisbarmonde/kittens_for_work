
var Notifications = Class.extend({
	init: function()
	{
		this.images_blocked = 0;
		this.thresholds = [5, 25, 50, 100, 250, 500, 1000];
		this.step = 1000;
	},

	increment: function()
	{
		++this.images_blocked;
		if (this.images_blocked > 1000)
		{
			if (this.images_blocked % 1000 == 0)
			{
				this.sendNotification();
			}
		}
		else
		{
			for (var i = 0; i < this.thresholds.length; i++)
			{
				if (this.thresholds[i] == this.images_blocked)
				{
					this.sendNotification();
					break;
				}
			}
		}
	},

	sendNotification: function()
	{
		webkitNotifications.createNotification(
			chrome.extension.getURL('images/48x48.png'),
			"Kittens For Work",
			"You've blocked " + this.images_blocked + " potential pairs of boobies. Keep up the good work!"
		).show();
	}
});