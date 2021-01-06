var city = null;
var dest = null;
var start = null;
var end = null;
var weather = new Array();

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
        var stUp = $("#startdateUpdate");
        var enUp = $("#enddateUpdate");
        if(stUp.val()=="" || enUp.val()==""){
            stUp.val($("#startdate").val());
            enUp.val($("#enddate").val());
        }
        $("#startdate").val("");
        $("#enddate").val("");
        lookForWeather();
    }
}

function lookForWeather() {
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
        getForecast(start, forecastEnd.format("YYYY-MM-DD")).then(() => {
            var histStart = moment().subtract(1, 'years').add(14, 'days');  //decrement end date year by 1, and add 1 day
            var years = end.diff(moment(), 'years') + 1;                    //find difference between end date year and current year
            end = end.subtract(years, 'years');                             //decrement end date year to become 1 less current year
            getHistorical(histStart, end).then(() => {
                loadWeather();
            });
        });
    }
}

async function getForecast(startDate, endDate) {
    const forecast = new Promise((resolve, reject) => {
        endDate = moment(endDate);
        $.get("http://api.worldweatheronline.com/premium/v1/weather.ashx?q=" + dest + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
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
        $.get("https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=" + dest + "&date=" + startDate.format('YYYY-MM-DD') + "&enddate=" + endDate.format('YYYY-MM-DD') + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
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
