var flickr_api_key = "03b50693efedc2180e33f293d8275dbf";

var req = new XMLHttpRequest();
req.open(
    "GET",
    "http://api.flickr.com/services/rest/?" +
        "method=flickr.photos.search" +
        "&api_key=" + flickr_api_key +
        "&text=kitten" +
        "&safe_search=1" +  // 1 is "safe"
        "&content_type=1" +  // 1 is "photos only"
        "&sort=relevance" +  // another good one is "interestingness-desc"
        "&per_page=20",
    true);
req.onload = showPhotos;
req.send(null);

function showPhotos() {
  var photos = req.responseXML.getElementsByTagName("photo");

  for (var i = 0, photo; photo = photos[i]; i++) {
    var img = document.createElement("image");
    img.src = constructImageURL(photo);
    document.body.appendChild(img);
  }
}

// See: http://www.flickr.com/services/api/misc.urls.html
function constructImageURL(photo) {
  return "http://farm" + photo.getAttribute("farm") +
      ".static.flickr.com/" + photo.getAttribute("server") +
      "/" + photo.getAttribute("id") +
      "_" + photo.getAttribute("secret") +
      "_s.jpg";
}