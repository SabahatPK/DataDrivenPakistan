//OUTS: Allow contributors: https://smartbear.com/blog/develop/how-to-turn-your-pile-of-code-into-an-open-source/

let promises = [
  d3.csv("data/AgentAccountData.csv"),
  d3.csv("data/GenderByProvince.csv"),
  d3.json("/data/pakistan/pakistan-districts.json"),
  d3.json("/data/pakistan/pakistan-provinces.json"),
  d3.csv("data/microfinance/pakMFDummyData.csv")
];

let parseTime = d3.timeParse("%Y");
let formatTime = d3.timeFormat("%B %d, %Y");

let sliderBegDate = new Date("1/1/2011");
let sliderEndDate = new Date("12/31/2018");

$("#dateLabel1").text("From " + formatTime(new Date("1/1/2012")));
$("#dateLabel2").text(" to " + formatTime(new Date("12/31/2018")));

// Add jQuery UI slider
$("#slider").slider({
  range: true,
  min: new Date("1/1/2012").getTime(),
  max: new Date("12/31/2018").getTime(),
  step: 345600000,
  values: [new Date("1/1/2012").getTime(), new Date("12/31/2018").getTime()],
  slide: function(event, ui) {
    sliderBegDate = new Date(ui.values[0]);
    sliderEndDate = new Date(ui.values[1]);
    $("#dateLabel1").text("From " + formatTime(new Date(ui.values[0])));
    $("#dateLabel2").text(" to " + formatTime(new Date(ui.values[1])));

    updateCharts();
  }
});

//Button to reset slider back to default dates
$("#reset").click(function() {
  $("#slider").slider("values", [
    new Date("1/1/2012").getTime(),
    new Date("12/31/2018").getTime()
  ]);

  let resetSliderDates = $("#slider").slider("values");

  sliderBegDate = new Date(resetSliderDates[0]);
  sliderEndDate = new Date(resetSliderDates[1]);

  $("#dateLabel1").text("From " + formatTime(new Date(resetSliderDates[0])));
  $("#dateLabel2").text(" to " + formatTime(new Date(resetSliderDates[1])));

  updateCharts();
});

//-----------------BEG OF SLIDER for maps:-------------------------
let sliderBegDateMap = 2011;

$("#sliderMap").slider({
  range: false,
  min: 2011,
  max: 2019,
  step: 1,
  value: 2011,
  slide: function(event, ui) {
    sliderBegDateMap = ui.value;

    $("#dateLabelMap").text(ui.value);
    updateCharts();
  }
});

//Button to reset slider back to default dates
$("#resetMap").click(function() {
  $("#sliderMap").slider("value", 2011);

  sliderBegDateMap = $("#sliderMap").slider("value");

  $("#dateLabelMap").text(sliderBegDateMap);

  updateCharts();
});

//-----------------END OF SLIDER for maps-------------------------

Promise.all(promises).then(function(allData) {
  let agentData = allData[0];
  let genderData = allData[1];
  let pkDistrict = allData[2];
  let pkProvince = allData[3];
  let pkDistMF = allData[4];

  const districts = topojson.feature(pkDistrict, pkDistrict.objects.PAK_adm3);

  const provinces = topojson.feature(pkProvince, pkProvince.objects.PAK_adm1);

  // Prepare and clean agent, account data
  agentData.forEach(function(d) {
    //Update all values to be numbers/dates instead of string
    for (let property in d) {
      if (d.hasOwnProperty(property) && property !== "Date") {
        d[property] = parseFloat(d[property].replace(/,/g, ""));
      } else if (d.hasOwnProperty(property) && property == "Date") {
        d[property] = new Date(d[property]);
      }
    }
  });

  genderData.forEach(function(d) {
    //Update all values to be numbers/dates instead of string
    for (let property in d) {
      if (
        d.hasOwnProperty(property) &&
        property !== "Date" &&
        property !== "Province"
      ) {
        d[property] = parseFloat(d[property].replace(/,/g, ""));
      } else if (d.hasOwnProperty(property) && property == "Date") {
        d[property] = new Date(d[property]);
      }
    }
  });

  pkDistMF.forEach(function(d) {
    //Update all values to be numbers/dates instead of string
    for (let property in d) {
      if (
        d.hasOwnProperty(property) &&
        property !== "Date" &&
        property !== "Province" &&
        property !== "District"
      ) {
        d[property] = parseFloat(d[property].replace(/,/g, ""));
      } else if (d.hasOwnProperty(property) && property == "Date") {
        d[property] = new Date(d[property]);
        d[property] = d[property].getFullYear();
      }
    }
  });

  let onlyAzadKashmir = genderData.filter(
    each => each.Province === "Azad Kashmir"
  );

  let onlyBalochistan = genderData.filter(
    each => each.Province === "Balochistan"
  );

  let onlyGilgitBaltistan = genderData.filter(
    each => each.Province === "Gilgit Baltistan"
  );

  let onlyPunjabIncludingISB = genderData.filter(
    each => each.Province === "Punjab (Including ISB)"
  );

  let onlyKhyberPakhtunkhwa = genderData.filter(
    each => each.Province === "Khyber Pakhtunkhwa"
  );

  let onlySindh = genderData.filter(each => each.Province === "Sindh");

  let keys = ["Active Accounts", "All Accounts"];
  let keys1 = ["Active Agents", "All Agents"];
  let keys2 = ["Female", "Male"];

  let smallDimensions = {
    height: 250,
    width: 200,
    marginLeft: 60,
    marginRight: 20,
    marginTop: 25,
    marginBottom: 50
  };

  let largeDimensions = {
    height: 800,
    width: 800,
    marginLeft: 60,
    marginRight: 20,
    marginTop: 25,
    marginBottom: 50
  };

  //Set up default visualization - upon 1st page load:
  stackAreaChart1 = new StackedArea(
    "#chart-area1",
    agentData,
    keys,
    smallDimensions
  );

  stackAreaChart2 = new StackedArea(
    "#chart-area2",
    agentData,
    keys1,
    smallDimensions
  );

  //Choose graphs to visualize:
  $("#indicatorType").change(function() {
    //Update the slider:

    if (
      $("#indicatorType").val() === "MFmapProvince" ||
      $("#indicatorType").val() === "MFmapDistrict"
    ) {
      $(".mapSlider")[0].style.visibility = "visible";
      $(".areaSlider")[0].style.visibility = "hidden";
    } else if (
      $("#indicatorType").val() === "AccAndAgent" ||
      $("#indicatorType").val() === "gender"
    ) {
      $(".mapSlider")[0].style.visibility = "hidden";
      $(".areaSlider")[0].style.visibility = "visible";
    }

    //Remove any old graphs
    d3.selectAll("#chart-area1 > *").remove();
    d3.selectAll("#chart-area2 > *").remove();
    d3.selectAll("#chart-area3 > *").remove();
    d3.selectAll("#chart-area4 > *").remove();
    d3.selectAll("#chart-area5 > *").remove();
    d3.selectAll("#chart-area6 > *").remove();
    d3.selectAll("#chart-area7 > *").remove();
    d3.selectAll("#chart-area8 > *").remove();

    let graphType = $(this).val();

    if (graphType === "gender") {
      stackAreaChart3 = new StackedArea(
        "#chart-area3",
        onlyAzadKashmir,
        keys2,
        smallDimensions
      );
      stackAreaChart4 = new StackedArea(
        "#chart-area4",
        onlyBalochistan,
        keys2,
        smallDimensions
      );
      stackAreaChart5 = new StackedArea(
        "#chart-area5",
        onlyGilgitBaltistan,
        keys2,
        smallDimensions
      );
      stackAreaChart6 = new StackedArea(
        "#chart-area6",
        onlyPunjabIncludingISB,
        keys2,
        smallDimensions
      );
      stackAreaChart7 = new StackedArea(
        "#chart-area7",
        onlyKhyberPakhtunkhwa,
        keys2,
        smallDimensions
      );
      stackAreaChart8 = new StackedArea(
        "#chart-area8",
        onlySindh,
        keys2,
        smallDimensions
      );
    } else if (graphType === "AccAndAgent") {
      stackAreaChart1 = new StackedArea(
        "#chart-area1",
        agentData,
        keys,
        smallDimensions
      );

      stackAreaChart2 = new StackedArea(
        "#chart-area2",
        agentData,
        keys1,
        smallDimensions
      );
    } else if (graphType === "MFmapProvince" || "MFmapDistrict") {
      mapOfPak = new MapChart(
        "#chart-area3",
        districts,
        provinces,
        pkDistMF,
        largeDimensions,
        sliderBegDateMap
      );
    }
  });
});

function updateCharts() {
  if ($("#indicatorType").val() === "gender") {
    stackAreaChart3.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart4.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart5.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart6.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart7.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart8.wrangleData(sliderBegDate, sliderEndDate);
  } else if ($("#indicatorType").val() === "AccAndAgent") {
    stackAreaChart1.wrangleData(sliderBegDate, sliderEndDate);
    stackAreaChart2.wrangleData(sliderBegDate, sliderEndDate);
  } else if ($("#indicatorType").val() === "MFmapProvince" || "MFmapDistrict") {
    mapOfPak.wrangleData(sliderBegDateMap);
  }
}

//"Go to top" button:
mybutton = document.getElementById("myBtn");

window.onscroll = function() {
  scrollFunction();
};
function scrollFunction() {
  if (
    document.body.scrollTop > 500 ||
    document.documentElement.scrollTop > 500
  ) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function topFunction() {
  document.documentElement.scrollTop = 0;
}

//Create stand-alone legend for gender graphs
let color1 = d3.scaleOrdinal(d3.schemePaired).domain(["Female", "Male"]);

let standAloneLegend = d3
  .select(".allGenderGraphs")
  .append("svg")
  .attr("width", 100)
  .attr("height", 100)
  .attr("transform", "translate(" + 100 + "," + -900 + ")")
  .append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + 0 + "," + 25 + ")");

["Female", "Male"].forEach(function(eachKey, index) {
  let legendRow = standAloneLegend
    .append("g")
    .attr("transform", "translate(" + 0 + "," + index * 20 + ")");

  legendRow
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", color1(eachKey));

  legendRow
    .append("text")
    .attr("x", 50)
    .attr("y", 10)
    .style("font-size", "10px")
    .attr("text-anchor", "end")
    .style("text-transform", "capitalize")
    .text(eachKey);
});

//Save viz button:
d3.select("#saveButton").on("click", function() {
  stackAreaChart1.saveViz();
});
