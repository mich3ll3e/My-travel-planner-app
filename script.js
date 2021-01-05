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