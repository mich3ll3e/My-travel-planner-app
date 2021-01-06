var city = null;
var dest = null;
var start = null;
var end = null;
var weather = null;


//WEATHER

$("#submitBtn").click((e) => {

    e.preventDefault();


    city = $("#currentcity").val();
    dest = $("#destination").val();
    start = moment($("#startdate").val());
    end = moment($("#enddate").val());

    dateCheck("");
});

$("#updateBtn").click((e) => {

    e.preventDefault();
    start = moment($("#startdateUpdate").val());
    end = moment($("#enddateUpdate").val());

    dateCheck("Update");
});

function dateCheck(type) {
    $(".error").remove();  //remove any displayed errors from previous search
    $("#weatherView").empty();
    var error = $("<p>");
    error.addClass("error");
    if (start.diff(moment(), 'days') < 0) { //if start date is in the past, display error
        error.text("Start date cannot be in the past")
        $("#startdate" + type).after(error);
    } else if (end.diff(start) < 0) { //if end date is before start date, display error
        error.text("End date cannot be before the start date")
        $("#enddate" + type).after(error);
    } else { //else, get the weather
        lookForWeather();
    }
}

function lookForWeather() {
    if (start.diff(moment(), 'days') >= 14) { //if start date is past 14 days (the limit of weather forecast), then use historical date
        var years = start.diff(moment(), 'years') + 1;  //find difference between start date year and current year
        start = start.subtract(years, 'years');         //decrement start date year to become 1 less current year
        years = end.diff(moment(), 'years') + 1;        //find difference between end date year and current year
        end = end.subtract(years, 'years');             //decrement end date year to become 1 less current year
        getHistorical(start, end);
    } else if (end.diff(moment(), 'days') < 14) { //if end date is within 14 days (the limite of weather forecase), then use forecast date
        for (let date = start; date.diff(end, 'days') <= 0; date.add(1, 'days')) { //loop through dates and get weather forecast
            getForecast(date);
        }
    } else { //else, use forecast date on days within 14 days, and historical data on days beyond 14 days.
        let date = start
        for (date; date.diff(moment(), 'days') < 14; date.add(1, 'days')) { //loop through days within the 14 day limit and get forecast
            getForecast(date);
        }
        date = date.subtract(1, 'years');               //decrement date year by 1
        var years = end.diff(moment(), 'years') + 1;    //find difference between end date year and current year
        end = end.subtract(years, 'years');             //decrement end date year to become 1 less current year
        getHistorical(date, end);
    }
}

function getForecast(date) {
    $.get("http://api.worldweatheronline.com/premium/v1/weather.ashx?q=" + dest + "&date=" + date.format('YYYY-MM-DD') + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
        var weather = result.data.weather[0].hourly[1];
        loadWeather(result.data.weather[0].date, weather.tempC, weather.humidity);
    }).catch(e => {
        handleError(e);
    });
}

function getHistorical(startDate, endDate) {
    $.get("https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=" + dest + "&date=" + startDate.format('YYYY-MM-DD') + "&enddate=" + endDate.format('YYYY-MM-DD') + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
        var result = result.data.weather;
        result.forEach(element => {
            var weather = element.hourly[1];
            loadWeather(element.date, weather.tempC, weather.humidity);
        });
    }).catch(e => {
        handleError(e);
    });
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

function loadWeather(date, temp, hum) {
    var box = $("<div>").addClass("weatherBox");
    $(box).append("<h3>" + date + "</h3>").append("<p>Temperature: " + temp + "°C</p>").append("<p>Humidity: " + hum + "%</p>");
    $("#weatherView").append(box);
}















//FLIGHT/ACTIVITIES


function amadeusAPI() {
    $.ajaxSetup({
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    $.post("https://test.api.amadeus.com/v1/security/oauth2/token", { "grant_type": "client_credentials", "client_id": "FGNpTg4n2DkJofCZY7PIpWNtOR5fy9t1", "client_secret": "4kYmZQhOSQ562MJg" }).then((token) => {
        console.log(token)
        $.ajaxSetup({
            headers: {
                'Authorization': "Bearer " + token.access_token
            }
        });

        $.get("https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=PAR&latitude=48.8566&longitude=2.3522&checkInDate=2021-05-01&checkOutDate=2021-05-28&adults=1").then((result) => {
            console.log(result);
        })

        $.get("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=YOW&destinationLocationCode=GRU&departureDate=2021-05-01&returnDate=2021-05-28&adults=1&travelClass=ECONOMY&nonStop=false&currencyCode=CAD&max=10").then((results) => {
            console.log(results);
        })

        $.get("https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=Toronto&page%5Blimit%5D=10&sort=analytics.travelers.score&view=LIGHT").then((results) => {
            console.log(results);
        })

    })
}
