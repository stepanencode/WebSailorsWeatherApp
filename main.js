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