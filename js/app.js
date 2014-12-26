function getCookie(cname){
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}


var statusFeed = function(){
    
    return {
        messages: [],
        postMessage: function(messageStr, callback){
            var messageLink = document.createElement("a");
            var messageBox = document.createElement("div");
            
            messageLink.href = "";
            messageLink.appendChild(messageBox);
            
            messageBox.className = "feed-message";
            messageBox.innerHTML = messageStr;
            messageBox.style.display = "none";
            document.getElementById("status-feed").appendChild(messageLink);
            this.messages.push(messageLink);
            $(messageBox).animate({height: 'show', paddingTop: 'show', paddingBottom: 'show', margin: 'show', opacity: 'show'}, 500);
            $(messageLink).click(function(event){
                $(this.childNodes[0]).animate({opacity: 'hide'}, 250, function(){
                    $(this).remove();
                });
                statusFeed.removeMessage(this);
                event.preventDefault();
                return false;
            });
            
            if (typeof callback === "function"){
                return callback();
            }
        },
        removeMessage: function(msg){
            var msgIndex = this.messages.indexOf(msg);
            this.messages.splice(msgIndex,1);
        }
    };
}();

var app = function(){
    
    var map;
    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay;
    var userPos;
    var userMarker;
    var userWindSpeed;
    var userWindDir;
    var poiPos;
    var poiMarker;
    var poiWindSpeed;
    var poiWindDir;
    var poiWeight = 1;
    
    function initialize() {
        
        statusFeed.postMessage("Helloooo (Tap messages to dismiss)");
                
        var styles = [
            {
                "featureType": "landscape",
                "stylers": [
                  { "color": "#fff" },
                  { "visibility": "simplified" }
                ]
            },{
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                  { "color": "#c88080" }
                ]
            },{
                "elementType": "labels",
                "stylers": [
                  { "visibility": "simplified" }
                ]
            },{
                "featureType": "poi",
                "stylers": [
                  { "color": "#7caa80" }
                ]
            }
        ]
        
        var mapOptions = {
            center: new google.maps.LatLng(0, 0),
            zoom: 15,
            disableDefaultUI: true,
            styles: styles
        };
        
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);
        
        if (navigator.geolocation) {
            statusFeed.postMessage("Getting your location...")
            navigator.geolocation.getCurrentPosition(function(position){
                userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(userPos);
                userMarker = new google.maps.Marker({
                    position: userPos,
                    animation: google.maps.Animation.DROP,
                    map: map
                });
                statusFeed.postMessage("Determining point of interest...");
                setPOI();
            });
        }
        
    }
    
    function calcRoute(){
        var request = {
            origin: userPos,
            destination: poiPos,
            travelMode: google.maps.TravelMode.DRIVING
        }
        directionsService.route(request, function(response, status){
            poiMarker.setMap(null);
            userMarker.setMap(null);
            if (status == google.maps.DirectionsStatus.OK){
                directionsDisplay.setDirections(response);
            }
        });
    }
    
    function updatePOIWithWind(){
        var windSpeed;
        var windDir;
        $.get(
            "http://api.openweathermap.org/data/2.5/weather?" +
            "lat=" + poiPos.lat() +
            "&lon=" + poiPos.lng() +
            "&APPID=13e6f951dcbb8a8ef64347fdb294f7a5", 
            function(data){
                var lat = (data.wind.speed / (poiWeight * 10000)) * Math.sin(data.wind.deg * (Math.PI / 180));
                var lng = (data.wind.speed / (poiWeight * 10000)) * Math.cos(data.wind.deg * (Math.PI / 180));
                updatePOI(poiPos.lat() + lat, poiPos.lng() + lng);
            }
        );
    }
    
    function setPOI(){
        if (getCookie("poilat") != "" && getCookie("poilng") != "" && getCookie("poilat") != "NaN" && getCookie("poilng") != "NaN"){
            poiPos = new google.maps.LatLng(getCookie("poilat"), getCookie("poilng"));
        } else {
            var latRan = (Math.random() * 2 - 1) / 100;
            var lngRan = (Math.random() * 2 - 1) / 100;
            poiPos = new google.maps.LatLng(userPos.lat() + latRan, userPos.lng() + lngRan);
        }
        poiMarker = new google.maps.Marker({
            position: poiPos,
            animation: google.maps.Animation.DROP,
            map: map
        });
        calcRoute();
        setPOICookie();
    }
    
    function updatePOI(newLat, newLng){
        poiPos = new google.maps.LatLng(newLat, newLng);
        calcRoute();
        setPOICookie();
    }
    
    function setPOICookie(){
        var d = new Date();
        d.setTime(d.getTime() + (7*24*60*60*1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = "poilat=" + poiPos.lat() + "; " + expires;
        document.cookie = "poilng=" + poiPos.lng() + ";" + expires;
    }
    
    google.maps.event.addDomListener(window, 'load', initialize);
    
    return {
        resetPOI: function(){
            var latRan = (Math.random() * 2 - 1) / 100;
            var lngRan = (Math.random() * 2 - 1) / 100;
            poiPos = new google.maps.LatLng(userPos.lat() + latRan, userPos.lng() + lngRan);
            calcRoute();
            setPOICookie();
        },
        windUpdate: function(){
            updatePOIWithWind();
        },
        setPOIWeight: function(weight){
            poiWeight = weight;
        }


    };
    
}();