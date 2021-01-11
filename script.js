var trip = { 'start': null, 'end': null, 'home': null, 'dest': null, 'flight': null, 'activities': null, 'price': new Number() };
var cityID = null;
var destID = null;
var startDate = null;
var endDate = null;
var weather = new Array();
var flights = new Array();
var activities = new Array();
var chosenFlight = null;
var chosenActivitiesIndex = new Array();
var chosenActivities = new Array();
var savedTrips = new Array();
var currentStage = 'mainSection';

function modal() { 
    $("#modal").toggleClass("flex");
}

//WEATHER

$("#submitBtn").click((e) => { //Assign values to variables from main pane

    e.preventDefault();


    cityID = $("#currentcity").find(":selected").data("index");
    destID = $("#destination").find(":selected").data("index");
    startDate = $("#startdate").val();
    endDate = $("#enddate").val();


    datesCheck("");
});

$("#updateBtn").click((e) => { //Assign date values to variables from weather pane

    e.preventDefault();
    startDate = $("#startdateUpdate").val();
    endDate = $("#enddateUpdate").val();

    datesCheck("Update");  //pass value to indicate that check is on weather pane inputs
});

function datesCheck(type) {

    $(".error").remove();  //remove any displayed errors from previous search
    var error = $("<p>");
    error.addClass("error");
    if (type == "") {       //If check is on main pane values then conduct data validation on cities
        if (!cityID) {          //if from city empty
            error.text("Please choose a valid city")  //display error
            $("#currentcity").after(error);
            return;
        } else if (!destID) { //if to city is empty
            error.text("Please choose a valid city") //display error
            $("#destination").after(error);
            return;
        }
    }
    if (moment(startDate).diff(moment(), 'days') < 0 || !startDate) { //if start date is in the past, display error
        error.text("Please choose a valid date")
        $("#startdate" + type).after(error);
    } else if (moment(endDate).diff(moment(startDate)) < 0 || !endDate) { //if end date is before start date, display error
        error.text("End date cannot be before the start date")
        $("#enddate" + type).after(error);
    } else {                                            //else, assign new values and get weather info
        var stUp = $("#startdateUpdate");
        var enUp = $("#enddateUpdate");
        if (stUp.val() == "" || enUp.val() == "") {
            stUp.val($("#startdate").val());
            enUp.val($("#enddate").val());
        }

        $("#weatherView").empty();
        modal();
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
    const forecast = new Promise((resolve, reject) => { //ajax call for forecast
        $.get("https://api.worldweatheronline.com/premium/v1/weather.ashx?q=" + toCity[destID].name + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
            result = result.data.weather;
            result.forEach(element => {                 //load weather info of required days into weather array
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
    const historical = new Promise((resolve, reject) => {  //ajax call for historical data
        $.get("https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=" + toCity[destID].name + "&date=" + startDate.format('YYYY-MM-DD') + "&enddate=" + endDate.format('YYYY-MM-DD') + "&tp=12&format=json&key=6dda14a8cc53490d9fd201404210301").then(result => {
            result = result.data.weather;
            result.forEach(element => {                     //load weather info into weather array
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

function handleError(e) { //handle errors from get calls to weather api
    $(".error").remove();
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

function loadWeather() { //load weather array into UI elements
    weather.forEach(element => {
        var box = $("<div>").addClass("weatherBox");
        $(box).append("<h3>" + element.date + "</h3>").append("<p>Temperature: " + element.temperature + "°C</p>").append("<p>Humidity: " + element.humidity + "%</p>");
        $("#weatherView").append(box);
    });
    weather = new Array();
    $("#weatherSection h2").text(`Weather in ${toCity[destID].name}`)
    $("form").hide();
    modal();
    currentStage = 'weatherSection';
    $("#weatherSection").show();
}















//FLIGHT 

$("#weatherSection .nextBtn").click((e) => {
    modal();
    getFlight(startDate, endDate).then((result) => {        //get flight info and display results
        if (result == "noItems") {
            $("#flightsList").append("<p>No available flights</p>");
        } else {
            loadFlight();
            $("#flightSection h2").text(`Flights from ${fromCity[cityID].city}, ${fromCity[cityID].country} to ${toCity[destID].name}`)
        }

        currentStage = 'flightSection';
        $("#weatherSection").hide();
        $("#flightSection").show();
        modal();
    });
});

async function getFlight(startDate, endDate) {  //ajax requst of Flights and Activities(same source) and process results
    const flightResults = new Promise((resolve, reject) => {
        $.ajaxSetup({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        //get token
        $.post("https://test.api.amadeus.com/v1/security/oauth2/token", { "grant_type": "client_credentials", "client_id": "FGNpTg4n2DkJofCZY7PIpWNtOR5fy9t1", "client_secret": "4kYmZQhOSQ562MJg" }).then((token) => {
            $.ajaxSetup({
                headers: {
                    'Authorization': "Bearer " + token.access_token
                }
            });
            //get activities, process results and load to array
            $.get("https://test.api.amadeus.com/v1/shopping/activities?latitude=" + toCity[destID].latitude + "&longitude=" + toCity[destID].longitude + "&radius=20").then((response) => {
                if (response.meta.count != 0) {
                    response = response.data;
                    console.log(response)
                    response.forEach(el => {
                        var activity = el.name;
                        var description = el.shortDescription;
                        var imgURL = el.pictures[0];
                        var amount = el.price.amount * 1.55;
                        var activityList = { 'activity': activity, 'description': description, 'picture': imgURL, 'price': amount };
                        activities.push(activityList);
                        console.log(activityList);
                    });
                }
            });
            //get flights, process results and load to array
            $.get("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=" + fromCity[cityID].iata + "&destinationLocationCode=" + toCity[destID].iata + "&departureDate=" + startDate + "&returnDate=" + endDate + "&adults=1&travelClass=ECONOMY&nonStop=false&currencyCode=CAD&max=10").then((results) => {
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


function loadFlight() { //load flight array info to UI
    flights.forEach((el, index) => {
        var flightBox = $("<div>").addClass("flightBox").attr("data-id", index).attr("tabindex", "1");
        $(flightBox).append(`<p><strong>Leave from:</strong> ${el.home} <strong>on:</strong> ${el.departureHomeTime}</p>`).append(`<p><strong>Arrive to:</strong> ${el.dest} <strong>on:</strong> ${el.arrivalDestTime}</p>`).append(`<hr><p><strong>Leave from: </strong>${el.dest} <strong>on: </strong> ${el.departureDestTime}</p>`).append(`<p><strong>Arrive to: </strong>${el.home} <strong>on: </strong>${el.arrivalHomeTime}</p>`).append(`<hr><p><strong>CAD <strong>${el.price}</p>`);
        $("#flightsList").append(flightBox);
    })
}

$(document).on('click', '.flightBox', function (e) { //selecting flight
    e.preventDefault();
    var selection = $(this)
    $(".flightBox").removeClass("chosenFlight")  //remove class from previously selected flight
    selection.addClass("chosenFlight")           //add it to newly selected flight

    var flightID = selection.data("id");        //get index of flight in flights array
    chosenFlight = flights[flightID];           //add object to chosenFlight variable
})

$("#flightSection .nextBtn").click((e) => { //moving forward to activities
    $(".error").remove();  //remove any displayed errors from previous search
    e.preventDefault();
    if (chosenFlight != null) {
        modal();
        loadAct();
        currentStage = 'activitiesSection';
        $("#flightSection").hide();
        $("#activitiesSection").show();
        modal();
    } else {
        var error = $("<p>");
        error.addClass("error");
        error.text("Please choose a flight option.");
        $("#flightsList").after(error);
    }
});













//ACTIVITIES

function loadAct() { //load activities from array (get request done in flight section)
    console.log(activities)
    activities.forEach((el, index) => {
        var actBox = $("<div>").addClass("activityBox").attr("data-id", index).attr("tabindex", "1");
        $(actBox).append(`<h3>${el.activity}</h3>`).append(`<div><p>Description: ${el.description}</p></div>`).append(`<img src=${el.picture}>`).append(`<p><strong>CAD </strong>${el.price}</p>`);
        $("#activitiesList").append(actBox);


    });
};

$(document).on('click', '.activityBox', function (e) { //event listener for actitivies boxes selection
    e.preventDefault();
    var actID = $(this).data("id")
    var box = $(this);
    console.log(chosenActivitiesIndex.includes(actID));
    if (chosenActivitiesIndex.includes(actID)) {  //if activity already selected
        $(this).removeClass("chosenActivityFormat");    //remove selection class
        chosenActivitiesIndex.splice(actID);            // remove activity index from array
    } else {                                    //else
        $(box).addClass("chosenActivityFormat");       //add selection class
        chosenActivitiesIndex.push(actID);              //add index to array
        chosenActivitiesIndex.sort();                   //sort array
    }
});

$("#activitiesSection .nextBtn").click((e) => { //move forward to summary
    modal()
    e.preventDefault();

    chosenActivitiesIndex.forEach(el => {
        chosenActivities.push(activities[el]);
    })

    loadSummary();
    currentStage = 'summarySection';
    $("#activitiesSection").hide();
    $("#summarySection").show();
    modal();

});




//Summary

function loadSummary(viewTrip) { 

    if (viewTrip == null) { //load trip object if no trip passed as argument

        //Load Trip Info
        trip.start = startDate;
        trip.end = endDate;
        trip.home = cityID;
        trip.dest = destID;
        trip.flight = chosenFlight;
        trip.activities = new Array();
        chosenActivities.forEach(el => {
            trip.activities.push(el)
        })
        trip.price = Number(trip.flight.price);
        trip.activities.forEach(el => {
            trip.price += Number(el.price);
        })
        $("#summarySection .returnBtn").hide();

    } else {        //load trip object if trip passed as argument (when loading Saved Trip to summary)

        trip.start = viewTrip.start;
        trip.end = viewTrip.end;
        trip.home = viewTrip.home;
        trip.dest = viewTrip.dest;
        trip.flight = viewTrip.flight;
        trip.activities = new Array();
        viewTrip.activities.forEach(el => {
            trip.activities.push(el)
        })
        trip.price = Number(trip.flight.price);
        trip.activities.forEach(el => {
            trip.price += Number(el.price);
        })
        $("#summarySection .nextBtn").hide()
        $("#summarySection .returnBtn").show();
    }

    //Expenses Chart
    drawChart();


    //Itinerary List
    $("#actList").empty();
    $("#tr1").text(`Leave from ${fromCity[trip.home].city}, ${fromCity[trip.home].country} on ${trip.flight.departureHomeTime}`);
    $("#tr2").text(`Arrive to ${toCity[trip.dest].name} on ${trip.flight.arrivalDestTime}`);
    trip.activities.forEach((el) => {
        $("<li>").text(`Visit ${el.activity}`).appendTo($("#actList"));
    });
    $("#tr3").text(`Leave from ${toCity[trip.dest].name} on ${trip.flight.departureDestTime}`);
    $("#tr4").text(`Arrive to ${fromCity[trip.home].city}, ${fromCity[trip.home].country} on ${trip.flight.arrivalHomeTime}`);
}

$("#summarySection .nextBtn").click(e => {                  //Save Trip event listener
    e.preventDefault;
    if (!savedTrips.includes(trip)) {                       //if trip not already saved (included in array)
        savedTrips.push(trip);                                 //then save
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips)); //and update local storage
        $("#summarySection h2").text("Trip Summary   -   Saved!")
        currentStage="mainSection";
    }
})

function drawChart() {                                                  //Google Chart
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(loadChart);
    function loadChart() {
        var arrOfArrs = [['Expenses', 'CAD']];
        console.log(trip.flight.price);
        arrOfArrs.push(['Flight', Number(trip.flight.price)]);
        trip.activities.forEach((el, index) => {
            arrOfArrs.push([index + 1, el.price]);
        })
        var data = google.visualization.arrayToDataTable(arrOfArrs);
        var chartWidth = document.getElementById('costChart').offsetWidth;
        console.log(chartWidth);
        var options = {
            width: chartWidth, height: (chartWidth - 50), legend: { position: 'bottom', alignment: 'center' }, pieSliceText: 'value', chartArea: { width: "80%" }
        };
        var chart = new google.visualization.PieChart(document.getElementById("costChart"));
        console.log(chart);
        chart.draw(data, options);
        $("#costChart").prepend(`<h3>Expenses Summary - Total $${trip.price.toFixed(2)}</hr>`);
    }
}

$(window).on('resize', function () {        //resize google chart with window
    $("#costChart").empty();
    drawChart();
});









//Load saved trips from local storage
function loadSavedTrips() { 
    var saved = JSON.parse(localStorage.getItem('savedTrips'));
    if (saved != null) {
        savedTrips = saved;
    }
}


//View saved trips
$("header button").click(e => {
    console.log(JSON.stringify(savedTrips));
    $("#modal img").hide()                          //remove loading gif from modal
    var modalContent = $("<div id='savedTrips'>");      
    modalContent.append("<h1>My Saved Trips</h1><br/>");
    if (savedTrips != "") {                         //load saved trips if available
        var modalList = $("<div id='listOfTrips'>").appendTo(modalContent);
        savedTrips.forEach((el, index) => {
            var newTrip = $(`<p class='savedTrip' data-id=${index}>`);
            newTrip.text(`${fromCity[el.home].city}, ${fromCity[el.home].country} - ${toCity[el.dest].name} on ${el.start}`);
            newTrip.appendTo(modalList);
        });
    } else {                                           //if none, display text
        modalContent.append("<p>You have no saved trips.</p>")
    }
    modalContent.append("<button class='button hollow' onclick='closeModal()'>Close</button>"); //add close button
    $("#modal").append(modalContent).addClass("flex"); //show modal
})

function closeModal() {
    $("#modal").removeClass("flex");  //hide modal
    $("#savedTrips").remove();          //remove saved trips div
    $("#modal img").show()              //add loading gif back
}

$(document).on('click', '.savedTrip', function (e) { //event listener for saved trips
    e.preventDefault();
    closeModal();                             
    $("form").hide();                           //hide all sections
    $("#weatherSection").hide();
    $("#flightSection").hide();
    $("#activitiesSection").hide();
    $("#summarySection").show();                    //show summary section
    loadSummary(savedTrips[$(this).data("id")]);       //load summary of selected trip
});

$("#summarySection .returnBtn").click(e => {           //return button for saved trip summary to return to trip currenltly being created
    if (currentStage == 'summarySection') {     //If user saved a trip right before viewing another saved one, and wants to go back
        loadSummary();                          //to the one they just saved, load summary without argument, which loads the properties of the
    }                                           //trip from variables.
    $("#weatherSection").hide();                //hide all sections
    $("#flightSection").hide();
    $("#activitiesSection").hide();
    $("#summarySection").hide();
    $(`#${currentStage}`).show();               //show current section (if current section is summary, the steps above ensure that the
    $("#summarySection .nextBtn").show()        //correct data was loaded).
    $("#summarySection .returnBtn").hide();
})

$("header h1").click(e=>{                       //home button click

    if(currentStage!="mainSection"){            //if unsaved changes, modal with warning, else reload.

        $("#modal img").hide()          
        var modalContent = $("<div id='savedTrips'>");
        modalContent.append("<h1>My Travel Planner</h1><br/>");
        modalContent.append("<h3>If you continue the trip will be discarded</h3><br/>");
        modalContent.append("<button class='modalButton button hollow' onclick='location.reload()'>Continue</button>");
        modalContent.append("<button class='modalButton button hollow' onclick='closeModal()'>Cancel</button>");
        $("#modal").append(modalContent).addClass("flex");
    }else{
        location.reload()
    }
})

loadSavedTrips();