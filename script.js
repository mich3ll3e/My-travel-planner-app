var city = null;
var start = null;
var end = null;
var weather = null;


$("#submitBtn").click((e) => {
    e.preventDefault();
    city = $("#destination").val();
    console.log(city);
    start = $("#startdate").val();
    console.log(start);
    end = $("#enddate").val();
    console.log(end);

});

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

    $.get("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=YOW&destinationLocationCode=GRU&departureDate=2021-05-01&returnDate=2021-05-28&adults=1&travelClass=ECONOMY&nonStop=false&currencyCode=CAD&max=10").then((results) => {
        console.log(results);
    })

    $.get("https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=Toronto&page%5Blimit%5D=10&sort=analytics.travelers.score&view=LIGHT").then((results) => {
        console.log(results);
    })
})