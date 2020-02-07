MapChart = function(
  _parentElement,
  _districtData,
  _provinceData,
  _MFData,
  _dimensionSVG
) {
  this.parentElement = _parentElement;
  this.pakDistrictData = _districtData;
  this.pakProvinceData = _provinceData;
  this.MFData = _MFData;
  this.dimensions = _dimensionSVG;
  this.borrByDistrict = {};
  this.borrByProvince = {};
  this.initVis();
};

//OUTS - click on province to isolate that data in area charts
//OUTS - allow map to size down with containers.

MapChart.prototype.initVis = function() {
  let vis = this;

  vis.myProjection = d3
    .geoMercator()
    .scale(2500)
    .precision(0.1)
    //outs - need more robust translation setting:
    .translate([vis.dimensions.width / 3, vis.dimensions.height / 2])
    .center([67, 30]);

  vis.myPathGenerator = d3.geoPath().projection(vis.myProjection);

  // Define the div for the tooltip
  vis.div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  vis.svg = d3
    .select(vis.parentElement)
    .append("svg")
    .attr("class", "card")
    .attr("width", vis.dimensions.width)
    .attr("height", vis.dimensions.height);

  if ($("#indicatorType").val() === "MFmapProvince") {
    vis.title = "Microfinance Borrowers Per Province";
  } else {
    vis.title = "Microfinance Borrowers Per District";
  }

  vis.svg
    .append("text")
    .attr("x", vis.dimensions.width / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .style("font-weight", "bold")
    .text(vis.title);

  //Format district data structure into something more palatable to d3:
  vis.MFData.forEach(d => {
    vis.borrByDistrict[d["District"]] = +d["Active Borrowers"];
  });

  vis.MFData.forEach(d => {
    d["District"] === "Total"
      ? (vis.borrByProvince[d["Province"]] = +d["Active Borrowers"])
      : null;
  });

  //outs - Need min and max of ALL the rows of districts; but the domain is
  //SO wide that the resulting diff in colors is barely noticeable, if at all.
  vis.allDistBorr = [];
  vis.MFData.forEach(d => {
    vis.allDistBorr.push(+d["Active Borrowers"]);
  });
  vis.extentBorrowerPermanent = d3.extent(vis.allDistBorr);
  vis.extentBorrower = d3.extent(Object.values(vis.borrByDistrict));

  vis.extentBorrowerProvince = d3.extent(Object.values(vis.borrByProvince));

  console.log(vis.borrByDistrict);
  console.log(vis.extentBorrower);

  //outs - there aren't enough distinctions b/w the provinces
  // vis.color = d3
  //   .scaleLog()
  //   .domain([0, 413389])
  //   // .domain([0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000])
  //   .range(["brown", "steelblue"]);

  //OUTS: Probably shouldn't use the same scale for districts as for province;
  //end up with huge Punjab blob and almost no color in other provinces.
  vis.color = d3
    .scaleSequential(d3.interpolateBlues)
    .domain(vis.extentBorrower);

  console.log(vis.color.domain());

  if ($("#indicatorType").val() === "MFmapProvince") {
    vis.svg
      .append("g")
      .selectAll("path")
      .attr("class", "province")
      .data(vis.pakProvinceData.features)
      .enter()
      .append("path")
      .attr("d", vis.myPathGenerator)
      .style("fill", d =>
        vis.borrByProvince[d.properties.NAME_1]
          ? vis.color(vis.borrByProvince[d.properties.NAME_1])
          : vis.color(0)
      )
      //outs - double check if this is working properly, i.e. triggering
      .on("mouseover", d => {
        console.log(d);
      })
      .on("mouseout", d => console.log("done"));
  } else {
    vis.svg
      .append("g")
      .selectAll("path")
      .attr("class", "district")
      .data(vis.pakDistrictData.features)
      .enter()
      .append("path")
      .attr("d", vis.myPathGenerator)
      .style("fill", d =>
        vis.borrByDistrict[d.properties.NAME_3]
          ? vis.color(vis.borrByDistrict[d.properties.NAME_3])
          : vis.color(0)
      )
      .on("mouseover", d => {
        vis.div
          .html(
            d.properties.NAME_3 + "," + vis.borrByDistrict[d.properties.NAME_3]
          )
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px")
          .style("opacity", 0.9);
      })
      .on("mouseout", d => vis.div.style("opacity", 0));
  }
};

MapChart.prototype.wrangleData = function(begDate, endDate) {
  let vis = this;

  //start here
  //Select year to display:
  vis.filteredData = vis.MFData.filter(d => {
    d["Date"].getTime() <= endDate.getTime();
  });

  // vis.filteredData = vis.pakDistrictData.filter(
  //   each => each.Date >= begDate && each.Date <= endDate
  // );

  // vis.updateVis();
};

MapChart.prototype.updateVis = function() {
  let vis = this;
};

//outs - create dataset of microcredit borrowers, GLP for each district from PMN's MicroWatch reports

//   //HandyTip - refer to these for creating choropleth map:
//   //https://observablehq.com/d/9a13ec59b29db4fa
//   //http://duspviz.mit.edu/d3-workshop/mapping-data-with-d3/
