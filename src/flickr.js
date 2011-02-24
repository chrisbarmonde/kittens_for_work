
var Flickr = Class.extend({
	init: function()
	{
		this.api_key = "03b50693efedc2180e33f293d8275dbf";
		this.photos = [];
		this.current_photo = 0;

		// Change pictures every 5 minutes
		setInterval(this.getPhotos.bind(this), 1000*60*5);
	},

	nextPhoto: function()
	{
		++this.current_photo;
		if (this.current_photo >= this.photos.length)
		{
			this.current_photo = 0;
		}

		return this.photos[this.current_photo];
	},

	getPhotos: function()
	{
		this.photos = [];
		this.current_photo = 0;

		log('Reloading Flickr photos...');

		// http://www.flickr.com/services/api/flickr.photos.search.html
		$.ajax('http://api.flickr.com/services/rest/', {
			data: {
				method: 'flickr.photos.search',
				api_key: this.api_key,
				tags: 'kitten,kittens',
				safe_search: 1,
				content_type: 1,
				sort: 'relevance',
				per_page: 50
			},
			dataType: 'xml',
			success: function(data) {
				var photos = data.getElementsByTagName("photo");

				for (var i = 0; i < photos.length; i++) {
					this.photos.push(this.getPhotoURL(photos[i]));
				}
			}.bind(this),
			error: function(xhr, text, error) {
				log('FLICKR ERROR: ' + text);
				log(error);
			}
		});
	},
	
	// See: http://www.flickr.com/services/api/misc.urls.html
	getPhotoURL: function(photo)
	{
		return "http://farm" + photo.getAttribute("farm") +
			".static.flickr.com/" + photo.getAttribute("server") +
			"/" + photo.getAttribute("id") +
			"_" + photo.getAttribute("secret") +
			"_z.jpg";
	}
});