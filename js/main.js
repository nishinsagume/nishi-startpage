window.onload = function() {
    this.initBody();
}


debug = true; // Enable while testing on local
searchBarDivId = "search-bar"
searchBarId = "search-bar-input"
messageDivId = "message"
dateDivId = "date"
dateId = "date-text"
weatherId = "weather-text"
lineId = "line"
messageId = "message-text"
timeZ = undefined
otherContentId = "other-content"
userName = ""
disable24Hour = false;
appId = "fd2c04ed7f9802656bd2cc23bddc7ad9"
apiUrl = "http://api.openweathermap.org/data/2.5/weather"
bgClassContainer = [
    "media",
    "work",
    "social",
    "others",
    "funky",
    "purple",
    "upvoty",
    "indigo",
    "foxxy"
]
searchEngines = {
    "Google": "https://www.google.com/search?q=",
    "DuckDuckGo": "https://duckduckgo.com/?q=",
    "Bing": "https://www.bing.com/search?q=",
    "Yahoo": "https://search.yahoo.com/search?p=",
    "Ecosia": "https://www.ecosia.org/search?q="
}
validWeatherUnit = [
    "fah", "cel"
]
validQuickLinks = {}


function initBody() {
    /**
     * Function called when the body is loaded.
     *
     * Do everything like adding an event listener to
     * other things.
     */
    // If running on local, just read the conf
    if (debug) {
        readJSON("config.json");
        return;
    }

    // Read the json file
    BROWSER.storage.sync.get(result => {
        Object.keys(result).length == 0 ? readJSON("config.json") : parseAndCreate(result)
    })
}

function initSearchBar(jsonData) {
    // Clear the search bar on load, just in case
    document.getElementById(searchBarId).value = ""
    document.getElementById(searchBarId).focus()
    searchEngine = jsonData["searchEngine"]
    if(!Object.keys(this.searchEngines).includes(searchEngine)){
        searchEngine = "Google"
    }
    searchUrl = this.searchEngines[searchEngine]
    document.getElementById(searchBarId).placeholder = `Search something on ${searchEngine}`
    document.getElementById(searchBarId).addEventListener("keypress", (event) => {
        if (event.key != 'Enter') return

        // Do whatever the user wants to do
        query = document.getElementById(searchBarId).value

        // Open settings
        if (query == "--setting") {
            showSettings()
            document.getElementById(searchBarId).value = ""
            return
        }

        // If not others, then it's probably a search
        query = query.replace(/\ /g, "+")
        document.location = searchUrl + query
    })
}

function buildMsg() {
    /**
     * Build a nice message for the user.
     *
     * Following is how the message would be decided.
     * 0 - 5:59 : It's too late, take some sleep / もう遅いから寝なさい
     * 6 - 8:59 : You're up early / 早起き
     * 9 - 11:59 : Have a good day ahead / よい一日を
     * 12 - 16:59 : Good Afternoon / ごきげんよ
     * 17 - 19:59 : Good Evening / こんばんは
     * 20 - 23:59 : It's time to wrap up for the day / もう遅いから寝なさい
     */
    date = new Date()
    currentHour = date.getHours()
    currentMinute = date.getMinutes()
    currentTime = currentHour + (0.01 * currentMinute)

    if (inRange(currentTime, 0, 5.59))
        return "もう遅いから寝なさい"
    if (inRange(currentTime, 6, 8.59))
        return "早起き"
    if (inRange(currentTime, 9, 11.59))
        return "よい一日を"
    if (inRange(currentTime, 12, 16.59))
        return "ごきげんよう"
    if (inRange(currentTime, 17, 19.59))
        return "こんばんは"
    if (inRange(currentTime, 20, 24))
        return "そろそろ一日の締めくくりの時間ですね!"
    else
        return ""
}

function updateTime() {
    /**
     * Get the current time and date and return it.
     */
    currentDate = new Date()
    options = {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: 'numeric',
                hour12: disable24Hour,
                timeZone: timeZ
            }
    finalDate = currentDate.toLocaleString(undefined, options)
    document.getElementById(dateId).textContent = finalDate
}

function updateTimeHook() {
    updateTime()
    interval = setInterval(() => {
        updateTime()
    }, 30 * 1000)
}

function updateWeather(weatherConfig) {
    /**
     * Get the weather using the location passed by the user using
     * the config and update it in a formatted way according to
     * the unit.
     */
    userLocation = weatherConfig["location"].replace(/\ /g, ",")
    passedUnit = weatherConfig["unit"]
    unit = validWeatherUnit.includes(passedUnit.substring(0, 3)) ?
            passedUnit : "cel"

    fetchUrl = apiUrl + `?q=${userLocation}&appid=${appId}&units=metric`

    fetch(fetchUrl)
        .then(response => {return response.json()})
        .then(jsonData => {
            temp = Math.floor(jsonData["main"]["temp"])
            weatherType = jsonData["weather"][0]["main"]

            temp = !unit.includes("cel") ?
                        getFahrenheit(temp) + "&deg;F" : temp + "&deg;C"
            weatherText = temp + ", " + indexUppercase(weatherType)
            document.getElementById(weatherId).innerHTML = weatherText
        })
}

function readJSON(fileName) {
    // Load the data of the passed file.
    fetch(fileName)
        .then(response => {return response.json()})
        .then(jsonData => {
            parseAndCreate(jsonData)
            saveSettings(jsonData)
        })
}

function saveSettings(settings) {
    if (debug) return;

    BROWSER.storage.sync.set(settings)
}

function parseAndCreate(jsonData) {
    /**
     * Parse the passed jsonData and create div's accordingly.
     */
    this.userName = jsonData["user"]

    // Build a message for the user
    builtMsg = buildMsg()
    builtMsg == "" ?
        builtMsg = `こんにちは${this.userName}` : builtMsg = `ハロー${this.userName}, ${builtMsg}!`
    document.getElementById(messageId).textContent = builtMsg
    // Check if 24 hour is disabled
    disable24Hour = jsonData["disable24Hour"]
    timeZ = jsonData["timeZone"]
    timeZ = isValidTimeZone(timeZ) ? timeZ : undefined
    // Check if welcome message is supposed to be disabled
    if (jsonData["disableMessage"])
        document.getElementById(messageDivId).style.display = "none"
    if (jsonData["disableDate"]) {
        // Hide the date and the line
        document.getElementById(dateId).style.display = "none"
        document.getElementById(lineId).style.display = "none"
    }
    else
        updateTimeHook()
    if (jsonData["disableWeather"]){
        // Hide the date and the line
        document.getElementById(weatherId).style.display = "none"
        document.getElementById(lineId).style.display = "none"
    }
    else
        updateWeather(jsonData["weatherConf"])
    if (jsonData["disableSearchBar"])
        document.getElementById(searchBarDivId).style.display = "none"
    else
        initSearchBar(jsonData)

    sqrs = jsonData["squares"]

    // Extract the quicklinks from the sqrs
    extractQuickLinks(sqrs);

    sqrs.forEach((element, index) => {
        sqr = createSqr(element, index)
        document.getElementById(otherContentId).appendChild(sqr)
    })

}

function createSqr(sqrData, index) {
    // Create a new square division with the passed element
    name = sqrData["name"];
    links = sqrData["links"];
    color = sqrData["color"];

    // Sometimes, the user might not have set a value for the color,
    // in which case it will be undefined.
    colorValid = (color == undefined) ? false : isColorValid(color);

    div = document.createElement("div")
    cls = document.createAttribute("class")
    div.setAttributeNode(cls)
    div.classList.add("sqr")

    if (colorValid)
        customClass = createClass(color);
    else if (index > bgClassContainer.length - 1)
        customClass = 'media';
    else
        customClass = bgClassContainer[index];

    div.classList.add(customClass);

    h4 = document.createElement("h4")
    h4.textContent = name


    div.appendChild(h4)

    links.forEach(element => {
        aName = element["name"]
        aHref = element["url"]

        a = document.createElement("a")
        attrHref = document.createAttribute("href")
        attrHref.value = aHref
        a.setAttributeNode(attrHref)

        a.textContent = aName

        div.appendChild(a)
    })

    return div
}

// Utility functions

function isValidTimeZone(tz) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw 'Time zones are not available in this environment';
    }

    try {
        Intl.DateTimeFormat(undefined, {timeZone: tz});
        return true;
    }
    catch (ex) {
        return false;
    }
}

function getFahrenheit(inCelcius) {
    return Math.floor((inCelcius * 9 / 5) + 32)
}

function indexUppercase(unformatted) {
    return unformatted.split(" ").map(w => {
        return w[0].toUpperCase() + w.substring(1)
    }).join(" ")
}

function inRange(number, min, max) {
    return (number >= min && number <= max)
}

function isColorValid(color) {
    /**
     * Check if the passed color is valid.
     *
     * Currently supports only css color names
     * or hex colors having 3 or 6 characters.
     */
    // Check CSS match
    let defaultStyles = new Option().style;
    defaultStyles.color = color
    if (defaultStyles.color == color) return true;

    // In case the above failed, check if it's a hex
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

function createClass(color) {
    /**
     * Create a new class in a style and add it to
     * the head.
     *
     * I did check other alternatives since adding something like
     * this in the innerHTML is not a preferred way to go,
     * especially since I'm building this as an extension,
     * however, there's no other way.
     *
     * Since I also want to add hover effects, there seriously
     * is no other way to do that without adding a style or using
     * a library (cannot/don't want to do that because this is an extension).
     */
    var style = document.createElement('style');
    const newClassName = `bg-${Math.random().toString(36).substring(7)}`;
    style.type = 'text/css';
    style.innerHTML = `.${newClassName} h4 {color: ${color} !important;} .${newClassName} a:hover {color: ${color} !important;}`;
    document.getElementsByTagName('head')[0].appendChild(style);

    return newClassName;
}


function extractQuickLinks(passedSqrs) {
    /**
     * Extract the quicklinks passed in the config
     *
     * Cache the quicklinks passed by the user in the config JSON
     * so that they can be used as a shortcut called from the
     * search bar.
     */
    passedSqrs.forEach(linksContainer => {
        linksContainer.links.forEach(linkObject => this.validQuickLinks[linkObject.name] = linkObject.url);
    });

    // Start the autocomplete
    autocomplete(document.getElementById("search-bar-input"), this.validQuickLinks);
}
