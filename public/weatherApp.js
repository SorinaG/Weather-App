const API_KEY = "f3b0463a2b87c088cda926e0a2d1b71d";
const TEMPERATURE_UNIT = "&units=metric";
const API_URL = "https://api.openweathermap.org/";
const GEO_URL = API_URL + "geo/1.0/direct?q=";
const WEATHER_URL = API_URL + "data/3.0/onecall?";
const LATITUDE = "lat=";
const LONGITUDE = "&lon=";
const APP_ID = "&appid=" + API_KEY;
const LIMIT = "&limit=1";
const CURRENT_LOCATION_URL = API_URL + "geo/1.0/reverse?";
const EXCLUDE_MINUTELY = "&exclude=minutely";
const CELSIUS = "\u00B0 C";
const HOURLY = "hourly";
const DAILY = "daily";
const ICON_URL = "https://openweathermap.org/img/wn/";

let favorites = JSON.parse(localStorage.getItem("favoriteCities")) ?? []
let favDropdown = document.getElementById("favDropdown");
let currentCity = document.getElementById("displayLocation");

const addFavorite = () => {
  favorites.push(currentCity.innerText);
  localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  addItemToDropdown(favDropdown, currentCity.innerText);
  setFavBtn()
};

const removeFavorite = () => {
  favorites = favorites.filter((item) => item !== currentCity.innerText);
  localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  for(let i = 0; i<favDropdown.children.length; i++) {
    if(favDropdown.children[i].innerText == currentCity.innerText) {
      favDropdown.children[i].remove()
    }
  }
  setFavBtn()
};

const addItemToDropdown = (parentElement, element) => {
  let li = document.createElement("li");
  let anchorEl = document.createElement("a");
  anchorEl.classList.add("dropdown-item");
  anchorEl.href = "#";
  anchorEl.innerText = element;
  anchorEl.onclick = () => search(element)
  li.appendChild(anchorEl);
  parentElement.appendChild(li);
};

const setFavBtn = () => {
  if (favorites.indexOf(currentCity.innerText) !== -1) {
    favoriteBtn.onclick = removeFavorite;
    favoriteBtn.innerText = "Remove from Favorites";
    favoriteBtn.classList.add("btn-danger");
  } else {
    favoriteBtn.onclick = addFavorite;
    favoriteBtn.innerText = "Add to Favorites";
    favoriteBtn.classList.remove("btn-danger");
  }
}

let favoriteBtn = document.getElementById("addToFavButton");

const getCurrentLocAndSetCurrentCard = () => {
  navigator.geolocation.getCurrentPosition(async (x) => {
    currentPosition = x;
    let latitude = currentPosition.coords.latitude;
    let longitude = currentPosition.coords.longitude;
    let currentCityUrl =
      CURRENT_LOCATION_URL +
      LATITUDE +
      latitude +
      LONGITUDE +
      longitude +
      LIMIT +
      APP_ID;
    let currentCityResponse = await fetch(currentCityUrl);
    let currentCityData = await currentCityResponse.json();
    let currentCityName = currentCityData[0].name;
    let currentCityWeather = await getWeatherData(latitude, longitude);
    setWeatherCards(currentCityWeather, currentCityName);
  });
}

const search = async (value) => {
  try {
    let inputElement = document.getElementById("searchInput");
    let inputValue = value ?? inputElement.value
    let cityUrl = GEO_URL + inputValue + LIMIT + APP_ID;
    let cityResponse = await fetch(cityUrl);
    let cityData = await cityResponse.json();
    let lat = cityData[0].lat;
    let lon = cityData[0].lon;
    let cityName = cityData[0].name;
    let weatherUrl =
      WEATHER_URL +
      LATITUDE +
      lat +
      LONGITUDE +
      lon +
      APP_ID +
      TEMPERATURE_UNIT;
    let weatherResponse = await fetch(weatherUrl);
    let weatherData = await weatherResponse.json();
    let forecastRows = document.getElementsByClassName("forecast-row");
    while (forecastRows.length) {
      forecastRows[0].remove();
    }
    setWeatherCards(weatherData, cityName);
    inputElement.value = ""
  } catch (error) {
    console.error("Error", error);
  }
};

getCurrentLocAndSetCurrentCard()

for (let i = 0; i < favorites.length; i++) {
  addItemToDropdown(favDropdown, favorites[i]);
}

const getWeatherData = async (lat, lon) => {
  let weatherUrl =
    WEATHER_URL +
    LATITUDE +
    lat +
    LONGITUDE +
    lon +
    EXCLUDE_MINUTELY +
    APP_ID +
    TEMPERATURE_UNIT;
  let weatherResponse = await fetch(weatherUrl);
  let weatherData = await weatherResponse.json();
  return weatherData;
};

const setCurrentWeatherCard = (weatherData, cityName) => {
  document.getElementById("displayTemperature").innerText =
    Math.round(weatherData.current.temp) + CELSIUS;
  document.getElementById("locationTemperatureData").innerText =
    toFirstLetterUppercase(weatherData.current.weather[0].description);
  document.getElementById("locationFeelsLike").innerText =
    Math.round(weatherData.current.feels_like) + CELSIUS;
  document.getElementById("currentWeatherIcon").src = composeIconUrl(
    weatherData.current.weather[0].icon
  );
  currentCity.innerText = cityName;
  setFavBtn()
};

const getDayOfTheWeek = (unix) => {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let date = new Date(unix * 1000);
  return weekday[date.getDay()];
};

const setIcon = (parentElement, iconId) => {
  let icon = document.createElement("img");
  icon.src = composeIconUrl(iconId);
  parentElement.appendChild(icon);
};

const composeIconUrl = (iconId) => ICON_URL + iconId + "@2x.png";

const setHourlyCard = (hourlyData, parentElement) => {
  let header = document.createElement("h2");
  header.innerText = Math.round(hourlyData.temp) + CELSIUS;
  parentElement.appendChild(header);
  setIcon(parentElement, hourlyData.weather[0].icon);
  let paragraph = document.createElement("p");
  paragraph.innerText = transformToHours(hourlyData.dt);
  parentElement.appendChild(paragraph);
};

const setDailyCard = (dailyData, parentElement) => {
  let header = document.createElement("h4");
  header.innerText = `Min: ${Math.round(dailyData.temp.min) + CELSIUS} | Max: ${
    Math.round(dailyData.temp.max) + CELSIUS
  }`;
  parentElement.appendChild(header);
  setIcon(parentElement, dailyData.weather[0].icon);
  let dayParagraph = document.createElement("p");
  dayParagraph.innerText = getDayOfTheWeek(dailyData.dt);
  parentElement.appendChild(dayParagraph);
};

const setForecastWeatherCards = (weatherData, forecastType) => {
  let forecastData =
    forecastType == HOURLY ? weatherData.hourly : weatherData.daily;
  let container = document.getElementsByClassName("container")[0];
  let row = document.createElement("div");
  row.classList.add("row", "mt-5", "forecast-row");
  if (forecastType == HOURLY) {
    row.classList.add("overflow-auto", "flex-nowrap");
  } else {
    row.classList.add("justify-content-around");
  }
  container.appendChild(row);
  let cardsNumber = forecastType == HOURLY ? 24 : 7;
  for (let i = 0; i < cardsNumber; i++) {
    let col = document.createElement("div");
    if (forecastType == HOURLY) {
      col.classList.add("col-md-3");
    } else {
      col.classList.add("col-md-4", "mb-2");
    }
    row.appendChild(col);
    let card = document.createElement("div");
    card.classList.add("card", "border-primary");
    col.appendChild(card);
    let cardBody = document.createElement("div");
    cardBody.classList.add("card-body", "text-center");
    card.appendChild(cardBody);
    forecastType == HOURLY
      ? setHourlyCard(forecastData[i], cardBody)
      : setDailyCard(forecastData[i], cardBody);
  }
  document.body.appendChild(container);
};

const setWeatherCards = (weatherData, cityName) => {
  setCurrentWeatherCard(weatherData, cityName);
  setForecastWeatherCards(weatherData, HOURLY);
  setForecastWeatherCards(weatherData, DAILY);
};

let searchBtn = document.getElementById("searchButton");
let inputField = document.getElementById("searchInput");

inputField.onkeyup = (event) => {
  if (event.code === "Enter") {
    search();
    inputField.value = "";
  }
};

searchBtn.onclick = () => {
  search()
  inputField.value = "";
};

const toFirstLetterUppercase = (string) => {
  return string.charAt(0).toUpperCase() + string.substring(1);
};

let currentPosition;
let tempAndHourCardGroup;
let tempAndHourCard;
let tempAndHourBody;
let header;

const transformToHours = (unixTime) => {
  let date = new Date(unixTime * 1000);
  let hour = date.getHours();
  return hour + ":00";
};