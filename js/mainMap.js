MapChart = function(
  _parentElement,
  _districtData,
  _provinceData,
  _MFData,
  _dimensionSVG,
  _sliderBegDateMap
) {
  this.parentElement = _parentElement;
  this.pakDistrictData = _districtData;
  this.pakProvinceData = _provinceData;
  this.MFData = _MFData;
  this.dimensions = _dimensionSVG;
  this.sliderBegDateMap = _sliderBegDateMap;
  this.borrByDistrict = {};
  this.borrByProvince = {};
  this.initVis();
};

MapChart.prototype.initVis = function() {
  let vis = this;

  vis.myProjection = d3
    .geoMercator()
    .scale(2500)
    .precision(0.1)
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

  //Define the pattern for null areas of map:
  vis.svg
    .append("defs")
    .append("pattern")
    .attr("id", "texture0")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6)
    .attr("height", 6)
    .append("path")
    .attr("d", "M 0 0 L 0 10")
    .attr("stroke", "#3071B9")
    .attr("stroke-width", 1);

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
  //--------------DELETE THIS BY MARCH 30 2020----------
  // vis.MFData.filter(
  //   each => each["Date"] === vis.sliderBegDate.getFullYear()
  // ).forEach(d => {
  //   vis.borrByDistrict[d["District"]] = +d["Active Borrowers"];
  // });
  //--------------DELETE THIS BY MARCH 30 2020----------

  vis.MFData.filter(each => each["Date"] === vis.sliderBegDateMap).forEach(
    d => {
      vis.borrByDistrict[d["District"]] = +d["Active Borrowers"];
    }
  );

  vis.MFData.forEach(d => {
    d["District"] === "Total"
      ? (vis.borrByProvince[d["Province"]] = +d["Active Borrowers"])
      : null;
  });

  vis.allDistBorr = [];
  vis.MFData.forEach(d => {
    vis.allDistBorr.push(+d["Active Borrowers"]);
  });

  vis.extentBorrowerPermanent = d3.extent(vis.allDistBorr);
  vis.extentBorrower = d3.extent(Object.values(vis.borrByDistrict));
  vis.extentBorrowerProvince = d3.extent(Object.values(vis.borrByProvince));

  vis.color = d3
    .scaleSequential(d3.interpolateBlues)
    .domain(vis.extentBorrower);

  // console.log(vis.pakDistrictData.features.map(each => each.properties.NAME_3));
  // console.log(vis.borrByDistrict);

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
      );
    // .on("mouseover", d => {
    //   console.log(d);
    // })
    // .on("mouseout", d => console.log("done"));
  } else {
    vis.svg
      .append("g")
      .selectAll("path")
      .attr("class", "district")
      .data(vis.pakDistrictData.features)
      .enter()
      .append("path")
      .attr("d", vis.myPathGenerator)
      // .style("fill", d =>
      //   vis.borrByDistrict[d.properties.NAME_3]
      //     ? vis.color(vis.borrByDistrict[d.properties.NAME_3])
      //     : "url(#texture0)"
      // )
      .style("fill", function(d) {
        if (vis.borrByDistrict[d.properties.NAME_3]) {
          return vis.color(vis.borrByDistrict[d.properties.NAME_3]);
        } else {
          return "url(#texture0)";
        }
      })
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
  vis.addLegend();
};

MapChart.prototype.wrangleData = function(begDate) {
  let vis = this;

  vis.MFData.filter(each => each["Date"] === begDate).forEach(d => {
    vis.borrByDistrict[d["District"]] = +d["Active Borrowers"];
  });

  vis.updateVis();
};

MapChart.prototype.updateVis = function() {
  let vis = this;

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
          : "url(#texture0)"
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

    // .attr("fill", function(d) {
    //   if (vis.borrByDistrict[d.properties.NAME_3]) {
    //     return vis.color(vis.borrByDistrict[d.properties.NAME_3]);
    //   } else {
    //     return "url(#texture0)";
    //   }
    // });
  }
};

MapChart.prototype.addLegend = function() {
  let vis = this;

  let formatComma = d3.format(",");

  let legendData = vis.color.ticks(6).slice(0);
  let legendDataWithUndef = ["Data Missing or No Borrowers"];

  vis.legendWithUndef = vis.svg
    .selectAll(".legendWithUndef")
    .data(legendDataWithUndef)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      return "translate(" + 20 + "," + (20 + i * 20) + ")";
    });

  vis.legendWithUndef
    .append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", "url(#texture0)");

  vis.legendWithUndef
    .append("text")
    .attr("x", 26)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text(legendDataWithUndef[0]);

  vis.legend = vis.svg
    .selectAll(".legend")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      return "translate(" + 20 + "," + (20 + i * 20) + ")";
    });

  vis.legend
    .append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", vis.color);

  vis.legend
    .append("text")
    .attr("x", 26)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text(formatComma);

  vis.svg
    .append("text")
    .attr("class", "label")
    .attr("x", vis.dimensions.width + 20)
    .attr("y", 10)
    .attr("dy", ".35em");
};

//   //HandyTip - refer to these for creating choropleth map:
//   //https://observablehq.com/d/9a13ec59b29db4fa
//   //http://duspviz.mit.edu/d3-workshop/mapping-data-with-d3/
