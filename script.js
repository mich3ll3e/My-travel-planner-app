var trip = { 'start': null, 'end': null, 'flight': null, 'activities': null, 'price': 0 };
var cityID = null;
var destID = null;
var startDate = null;
var endDate = null;
var weather = new Array();
var flights = new Array();
var chosenFlight = null;

//WEATHER

$("#submitBtn").click((e) => {

    e.preventDefault();


    cityID = $("#currentcity").find(":selected").data("index");
    destID = $("#destination").find(":selected").data("index");
    startDate = $("#startdate").val();
    endDate = $("#enddate").val();


    datesCheck("");
});

$("#updateBtn").click((e) => {

    e.preventDefault();
    startDate = $("#startdateUpdate").val();
    endDate = $("#enddateUpdate").val();

    datesCheck("Update");
});

function datesCheck(type) {
    $(".error").remove();  //remove any displayed errors from previous search
    var error = $("<p>");
    error.addClass("error");
    if (type == "") {
        if (!cityID) {
            error.text("Please choose a valid city")
            $("#currentcity").after(error);
        } else if (destID == "") {
            error.text("Please choose a valid city")
            $("#destination").after(error);
        }
    }
    if (moment(startDate).diff(moment(), 'days') < 0 || !startDate) { //if start date is in the past, display error
        error.text("Please choose a valid date")
        $("#startdate" + type).after(error);
    } else if (moment(endDate).diff(moment(startDate)) < 0 || !endDate) { //if end date is before start date, display error
        error.text("End date cannot be before the start date")
        $("#enddate" + type).after(error);
    } else { //else, get the weather
        var stUp = $("#startdateUpdate");
        var enUp = $("#enddateUpdate");
        if (stUp.val() == "" || enUp.val() == "") {
            stUp.val($("#startdate").val());
            enUp.val($("#enddate").val());
        }

        $("#weatherView").empty();
        lookForWeather();
    }
}

function lookForWeather() {
    var start = moment(startDate);
    var end = moment(endDate);
    if (start.diff(moment(), 'days') >= 13) { //if start date is past 14 days (the limit of weather forecast), then use historical date
        var years = start.diff(moment(), 'years') + 1;  //find difference between start date year and current year
        start = start.subtract(years, 'years');         //decrement start date year to become 1 less current year
        years = end.diff(moment(), 'years') + 1;        //find difference between end date year and current year
        end = end.subtract(years, 'years');             //decrement end date year to become 1 less current year
        getHistorical(start, end).then(() => {
            loadWeather();
        });
    } else if (end.diff(moment(), 'days') < 13) { //if end date is within 14 days (the limite of weather forecase), then use forecast date
        getForecast(start, end).then(() => {
            loadWeather();
        });
    } else { //else, use forecast date on days within 14 days, and historical data on days beyond 14 days.
        var forecastEnd = moment().add(13, 'days');
        getForecast(start, forecastEnd).then(() => {
            var histStart = moment().subtract(1, 'years').add(14, 'days');  //decrement end date year by 1, and add 1 day
            var years = end.diff(moment(), 'years') + 1;                    //find difference between end date year and current year
            var newEnd = end.subtract(years, 'years');                             //decrement end date year to become 1 less current year
            getHistorical(histStart, newEnd).then(() => {
                loadWeather();
            });
        });
    }
}

async function getForecast(startDate, endDate) {
    const forecast = new Promise((resolve, reject) => {
        $.get("http://api.worldweatheronline.com/premium/v1/weather.ashx?q=" + toCity[destID].name + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
            result = result.data.weather;
            result.forEach(element => {
                let date = moment(element.date);
                if (date.diff(startDate) >= 0 && date.diff(endDate) <= 0) {
                    var weatherDate = element.hourly[1];
                    weather.push({ 'date': element.date, 'temperature': weatherDate.tempC, 'humidity': weatherDate.humidity });
                }
            });
            resolve(true);
        }).catch(e => {
            handleError(e);
            reject(false);
        });
    });
    return forecast;
}

async function getHistorical(startDate, endDate) {
    const historical = new Promise((resolve, reject) => {
        $.get("https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=" + toCity[destID].name + "&date=" + startDate.format('YYYY-MM-DD') + "&enddate=" + endDate.format('YYYY-MM-DD') + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
            result = result.data.weather;
            result.forEach(element => {
                var weatherDate = element.hourly[1];
                var newDate = (moment(element.date).add(1, 'years')).format("YYYY-MM-DD")
                weather.push({ 'date': newDate, 'temperature': weatherDate.tempC, 'humidity': weatherDate.humidity });
            });
            resolve(true);
        }).catch(e => {
            handleError(e);
            reject(false);
        });
    });
    return historical;
}

function handleError(e) {
    $(".error").remove(); //REMOVE THIS WHEN BREAK LOOP IS FIXED
    var error = $("<p>");
    error.addClass("error");
    if (e instanceof TypeError) {
        error.text("Please check the name of your destination and try again")
        $("#destination").after(error);
    } else {
        error.text("Something went wrong, please try again later!")
        $("#submitBtn").befor(error)
    }
    return;
}

function loadWeather() {
    weather.forEach(element => {
        var box = $("<div>").addClass("weatherBox");
        $(box).append("<h3>" + element.date + "</h3>").append("<p>Temperature: " + element.temperature + "°C</p>").append("<p>Humidity: " + element.humidity + "%</p>");
        $("#weatherView").append(box);
    });
    weather = new Array();
    $("form").hide();
    $("#weatherSection").show();
}















//FLIGHT 

$("#weatherSection .nextBtn").click((e) => {
    trip.start = startDate;
    trip.end = endDate;
    getFlight(startDate, endDate).then((result) => {
        if (result == "noItems") {
            $("#flightsList").append("<p>No available flights</p>");
        } else {
            loadFlight();
        }

        $("#weatherSection").hide();
        $("#flightSection").show();
    });
});

async function getFlight(startDate, endDate) {
    const flightResults = new Promise((resolve, reject) => {
        $.ajaxSetup({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        $.post("https://test.api.amadeus.com/v1/security/oauth2/token", { "grant_type": "client_credentials", "client_id": "FGNpTg4n2DkJofCZY7PIpWNtOR5fy9t1", "client_secret": "4kYmZQhOSQ562MJg" }).then((token) => {
            $.ajaxSetup({
                headers: {
                    'Authorization': "Bearer " + token.access_token
                }
            });
            $.get("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=" + fromCity[cityID].iata + "&destinationLocationCode=" + toCity[destID].iata + "&departureDate=" + startDate + "&returnDate=" + endDate + "&adults=1&travelClass=ECONOMY&nonStop=false&currencyCode=CAD&max=10").then((results) => {
                console.log(results);
                if (results.meta.count != 0) {
                    results = results.data;
                    results.forEach(el => {
                        var itinerary = el.itineraries;
                        var leaveHome = itinerary[0].segments[0]
                        var arriveDest = itinerary[0].segments[itinerary[0].segments.length - 1]

                        var leaveHomeTime = moment(leaveHome.departure.at, 'YYYY-MM-DDThh:mm:ss').format("YYYY-MM-DD, hh:mm A");
                        var homeLocation = leaveHome.departure.iataCode;

                        var arriveDestTime = moment(arriveDest.arrival.at, 'YYYY-MM-DDThh:mm:ss').format("YYYY-MM-DD, hh:mm A");
                        var destLocation = arriveDest.arrival.iataCode;

                        var leaveDest = itinerary[1].segments[0];
                        var arriveHome = itinerary[1].segments[itinerary[1].segments.length - 1];

                        var leaveDestTime = moment(leaveDest.departure.at, 'YYYY-MM-DDThh:mm:ss').format("YYYY-MM-DD, hh:mm A");
                        var arriveHomeTime = moment(arriveHome.arrival.at, 'YYYY-MM-DDThh:mm:ss').format("YYYY-MM-DD, hh:mm A");

                        var price = el.price.total;

                        var flightOption = { 'home': homeLocation, 'dest': destLocation, 'departureHomeTime': leaveHomeTime, 'arrivalDestTime': arriveDestTime, 'departureDestTime': leaveDestTime, 'arrivalHomeTime': arriveHomeTime, 'price': price };
                        flights.push(flightOption);

                    });
                    resolve(true);
                } else {
                    resolve("noItems");
                }

            }).catch(e => {
                reject(false);
            });
        });
    });
    return flightResults;
}


function loadFlight() {
    flights.forEach((el, index) => {
        var flightBox = $("<div>").addClass("flightBox").attr("data-id", index).attr("tabindex", "1");
        $(flightBox).append(`<p>Leave from: ${el.home} on: ${el.departureHomeTime}</p>`).append(`<p>To: ${el.dest} on: ${el.arrivalDestTime}</p>`).append(`<hr><p>Leave from: ${el.dest} on: ${el.departureDestTime}</p>`).append(`<p>Arrive to: ${el.home} on: ${el.arrivalHomeTime}</p>`).append(`<hr><p>Price: CAD ${el.price}</p>`);
        $("#flightsList").append(flightBox);
    })
}

$(document).on('click', '.flightBox', function (e) {
    e.preventDefault();
    var selection = $(this)
    $(".flightBox").removeClass("chosenFlight")  //remove class from previously selected flight
    selection.addClass("chosenFlight")           //add it to newly selected flight

    var flightID = selection.data("id");        //get index of flight in flights array
    chosenFlight = flights[flightID];           //add object to chosenFlight variable
})

$("#flightSection .nextBtn").click((e) => {
    $(".error").remove();  //remove any displayed errors from previous search
    if (chosenFlight != null) {
        trip.flight = chosenFlight;
        $("#flightSection").hide();
        $("#activitiesSection").show();
    } else {
        var error = $("<p>");
        error.addClass("error");
        error.text("Please choose a flight option.");
        $("#flightsList").after(error);
    }
});













//ACTIVITIES


$("#actBtn").click((e) => {

    e.preventDefault();

    cityLat = toCity[destID].latitude;
    cityLong = toCity[destID].longitude;

    getActivity();

});