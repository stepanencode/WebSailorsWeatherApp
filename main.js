const OPENWEATHER_API_KEY = '21cd7ffaf13d91a005d5854834f990b0';
const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const WEATHER_TABLE_CLASS = 'table';
const WEATHER_TABLE_ROWS = ['Date', 'Temperature ℃', 'Weather condition', ' '];

function httpGet(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
            if (this.status == 200) {
                resolve(this.response);
            } else {
                var error = new Error(this.statusText);
                error.code = this.status;
                reject(error);
            }
        };
        xhr.onerror = function() {
            reject(new Error("Network Error"));
        };
        xhr.send();
    });
}

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -33.8688, lng: 151.2195},
        zoom: 13
    });
    var card = document.getElementById('pac-card');
    var input = document.getElementById('pac-input');
    // console.log(input.value);
    var types = document.getElementById('type-selector');
    var strictBounds = document.getElementById('strict-bounds-selector');

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    // Set the data fields to return when the user selects a place.
    autocomplete.setFields(
        ['address_components', 'geometry', 'icon', 'name']);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function() {
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        renderWeatherTable(place.geometry.location.lat(), place.geometry.location.lng());

        infowindowContent.children['place-icon'].src = place.icon;
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = address;
        infowindow.open(map, marker);
    });

    // Sets a listener on a radio button to change the filter type on Places
    // Autocomplete.
    function setupClickListener(id, types) {
        var radioButton = document.getElementById(id);
        radioButton.addEventListener('click', function() {
            autocomplete.setTypes(types);
        });
    }

    setupClickListener('changetype-all', []);
    setupClickListener('changetype-address', ['address']);
    setupClickListener('changetype-establishment', ['establishment']);
    setupClickListener('changetype-geocode', ['geocode']);

    document.getElementById('use-strict-bounds')
        .addEventListener('click', function() {
            console.log('Checkbox clicked! New state=' + this.checked);
            autocomplete.setOptions({strictBounds: this.checked});
        });
}

function parseWeatherData (data) {
    let options = { day: 'numeric', month: 'numeric', year: '2-digit', hour: 'numeric',  minute: 'numeric' };
    return data.map(item => ({
        dateString: new Date(item.dt * 1000).toLocaleString("ru-RU", options),
        temperature: ((Math.floor(item.main.temp) > 0) ? ("+" + (Math.floor(item.main.temp))) : (Math.floor(item.main.temp))),
        weatherText: item.weather[0].main,
        weatherIcon: item.weather[0].icon
    }));
}

function generateTable(data) {
    let table = document.createElement("table");
    table.classList.add(WEATHER_TABLE_CLASS);

    let previousTable = document.querySelector(WEATHER_TABLE_CLASS);
    previousTable.parentNode.replaceChild(table, previousTable);

    let tableHead = table.createTHead();
    let row = tableHead.insertRow();
    for (let key of WEATHER_TABLE_ROWS) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }

    let tableBody = table.createTBody();
    for (let item of data) {
        let row = tableBody.insertRow();
        for (let key in item) {
            let cell = row.insertCell();
            let element;
            if (key === 'weatherIcon') {
                element = document.createElement('img');
                element.classList.add('weather-icon');
                element.setAttribute("src", `http://openweathermap.org/img/wn/${item[key]}@2x.png`);
            } else {
                element = document.createTextNode(item[key]);
            }
            cell.appendChild(element);
        }
    }
}

function renderWeatherTable(latitude, longitude) {
    let url = `${OPENWEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    httpGet(url)
        .then(function(resp) { return JSON.parse(resp) })
        .then(function(data) {
            let weatherData = parseWeatherData(data.list);
            generateTable(weatherData);
        })
}