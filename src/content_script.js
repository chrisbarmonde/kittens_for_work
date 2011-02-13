chrome.extension.onConnect.addListener(function(port) {
	//console.assert(port.name == "kfw");
	console.log("Connecting!");

	port.onMessage.addListener(function(msg) {
		if ('images' in msg) {
			for (var i = 0; i < document.images.length; i++) {
				document.images[i].src = (typeof msg.images[i] == "string")
					? msg.images[i]
					: msg.images[i].src;
			}
		}
	});

	var images = [];
	for (var i = 0; i < document.images.length; i++)
	{
		images.push(document.images[i].src);
	}
	port.postMessage({original_images: images});
	delete images;
});

console.log("Created");