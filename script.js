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

    $.get("https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=LCY&checkInDate=2021-05-01&checkOutDate=2021-05-28&adults=1").then((result)=>{
        console.log(result);
    })

    $.get("https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=YOW&destinationLocationCode=GRU&departureDate=2021-05-01&returnDate=2021-05-28&adults=1&travelClass=ECONOMY&nonStop=false&currencyCode=CAD&max=10").then((results) => {
        console.log(results);
    })

    $.get("https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=Toronto&page%5Blimit%5D=10&sort=analytics.travelers.score&view=LIGHT").then((results) => {
        console.log(results);
    })

})

//For historical data
$.get("https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=London&date=2020-01-01&enddate=2020-01-07&tp=24&format=json&key=6dda14a8cc53490d9fd201404210301").then((result)=>{
    console.log(result);
})

//For next 15 days
$.get("http://api.worldweatheronline.com/premium/v1/weather.ashx?q=Ottawa&date=2021-01-07&tp=24&format=json&key=6dda14a8cc53490d9fd201404210301").then((result)=>{
    console.log(result);
})