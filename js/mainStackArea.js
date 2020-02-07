StackedArea = function(_parentElement, _allData, _keys, _dimensionSVG) {
  this.parentElement = _parentElement;
  this.keys = _keys;
  this.allData = _allData;
  this.dimensions = _dimensionSVG;
  this.initVis();
};

//initVis() contains all the static elements of viz
StackedArea.prototype.initVis = function() {
  let vis = this;

  // if (vis.genderTrue === true) {
  //   $("#graphTitle").html("Gender Breakdown By Province");
  // } else {
  //   $("#graphTitle").html("Volume of Accounts and Agents");
  // }

  vis.nestedData = d3
    .nest()
    .key(function(d) {
      return d.Province;
    })
    .entries(vis.allData);

  (vis.width =
    vis.dimensions["width"] -
    vis.dimensions.marginLeft -
    vis.dimensions.marginRight),
    (vis.height =
      vis.dimensions["height"] -
      vis.dimensions.marginTop -
      vis.dimensions.marginBottom);

  vis.svg = d3
    .select(vis.parentElement)
    .append("svg")
    //outs - cards should not ROLL in
    .attr("class", "card")
    .attr(
      "width",
      vis.dimensions.width +
        vis.dimensions.marginLeft +
        vis.dimensions.marginRight
    )
    .attr(
      "height",
      vis.dimensions.height +
        vis.dimensions.marginTop +
        vis.dimensions.marginBottom
    );

  if (vis.keys[0] === "Active Accounts") {
    vis.title = "Active to Inactive Accounts";
  } else if (vis.keys[0] === "Active Agents") {
    vis.title = "Active to Inactive Agents";
  } else {
    vis.title = vis.allData[0]["Province"];
  }

  //outs - graphs need to always show which year they are depicting;
  //When dates are all within 1 year, no way of knowing what that year is just by looking at
  //the x-axis. Need to point out somewhere on x-axis;

  vis.svg
    .append("text")
    .attr("x", vis.dimensions.width - 30)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .style("font-size", "90%")
    .style("font-weight", "bold")
    .attr("class", "graphTitle")
    .text(vis.title);

  vis.g = vis.svg
    .append("g")
    .attr(
      "transform",
      "translate(" +
        vis.dimensions.marginLeft +
        ", " +
        vis.dimensions.marginTop +
        ")"
    );

  //Build scales:
  vis.xScale1 = d3.scaleTime().range([0, vis.dimensions.width]);
  vis.yScale1 = d3.scaleLinear().range([vis.dimensions.height, 0]);
  vis.color1 = d3.scaleOrdinal(d3.schemePaired).domain(vis.keys);

  //Define axes:
  vis.xAxis1 = d3.axisBottom(vis.xScale1).ticks(3);
  vis.yAxis1 = d3.axisLeft(vis.yScale1).ticks(5);

  //Place axes on chart:
  vis.xAxisCall = vis.g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + vis.dimensions.height + ")");
  vis.yAxisCall = vis.g.append("g").attr("class", "y axis");

  //Begin building the graph:
  vis.justDates = vis.allData.map(each => each.Date);
  vis.minAndMaxDates = d3.extent(vis.justDates);

  vis.largestKeysValue = d3.max(
    vis.allData.map(each => each[vis.keys[0]] + each[vis.keys[1]])
  );

  vis.stack = d3.stack().keys(vis.keys);

  vis.area1 = d3
    .area()
    .x(function(d) {
      return vis.xScale1(d.data.Date);
    })
    .y0(function(d) {
      return vis.yScale1(d[0]);
    })
    .y1(function(d) {
      return vis.yScale1(d[1]);
    });

  vis.sliderValues = $("#slider")
    .slider("values")
    .map(each => new Date(each));

  vis.sliderValuesOne = vis.sliderValues[0];
  vis.sliderValuesTwo = vis.sliderValues[1];

  vis.keys[0] === "Female" ? null : vis.addLegend();

  vis.wrangleData(vis.sliderValuesOne, vis.sliderValuesTwo);
};

StackedArea.prototype.wrangleData = function(begDate, endDate) {
  let vis = this;

  vis.filteredData = vis.allData.filter(
    each => each.Date >= begDate && each.Date <= endDate
  );

  vis.updateVis();
};

StackedArea.prototype.updateVis = function() {
  let vis = this;

  //outs - how to make graphs dissapear and place this text in it's place?
  // if (vis.filteredData.length === 0) {
  //   console.log("There is no data available for this time period.");
  // }

  //Update graph based on new data:
  vis.justDates = vis.filteredData.map(each => each.Date);
  vis.minAndMaxDates = d3.extent(vis.justDates);

  vis.largestKeysValue = d3.max(
    vis.filteredData.map(each => each[vis.keys[0]] + each[vis.keys[1]])
  );

  vis.xScale1.domain(vis.minAndMaxDates);
  vis.yScale1.domain([0, vis.largestKeysValue]);

  vis.xAxisCall.call(vis.xAxis1);
  vis.yAxisCall.call(vis.yAxis1);

  vis.blob = vis.g.selectAll(".blob").data(vis.stack(vis.filteredData));

  vis.blob.select(".area").attr("d", vis.area1);

  vis.blob
    .enter()
    .append("g")
    .attr("class", function(d) {
      return "blob " + d.key;
    })
    .append("path")
    .attr("class", "area")
    .attr("d", vis.area1)
    .style("fill", function(d) {
      return vis.color1(d.key);
    });

  //Handle pretty transitions:
  vis.svg
    .style("width", "0%")
    .transition()
    .ease(d3.easeLinear)
    .duration(500)
    .style("width", "100%");

  vis.blob
    .style("fill-opacity", 0)
    .transition(d3.transition().duration(500))
    .style("fill-opacity", 1);
};

StackedArea.prototype.addLegend = function() {
  let vis = this;

  vis.legend = vis.svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      "translate(" +
        (vis.dimensions.width - 10) +
        "," +
        (vis.dimensions.height - 125) +
        ")"
    );

  vis.keys.forEach(function(eachKey, index) {
    vis.legendRow = vis.legend
      .append("g")
      .attr("transform", "translate(" + 0 + "," + index * 20 + ")");

    vis.legendRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", vis.color1(eachKey));

    vis.legendRow
      .append("text")
      .attr("x", -10)
      .attr("y", 10)
      .style("font-size", "10px")
      .attr("text-anchor", "end")
      .style("text-transform", "capitalize")
      .text(eachKey);
  });
};

StackedArea.prototype.saveViz = function() {
  let vis = this;
  // Set-up the export button

  var svgString = getSVGString(vis.svg.node());
  svgString2Image(svgString, 400, 400, "png", save); // passes Blob and filesize String to the callback

  function save(dataBlob, filesize) {
    saveAs(dataBlob, "D3 vis exported to PNG.png"); // FileSaver.js function
  }

  // // Below are the functions that handle actual exporting:
  // getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
  function getSVGString(svgNode) {
    svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
    var cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix

    return svgString;

    function getCSSStyles(parentElement) {
      var selectorTextArr = [];

      //     // Add Parent element Id and Classes to the list
      selectorTextArr.push("#" + parentElement.id);
      for (var c = 0; c < parentElement.classList.length; c++)
        if (!contains("." + parentElement.classList[c], selectorTextArr))
          selectorTextArr.push("." + parentElement.classList[c]);

      //     // Add Children element Ids and Classes to the list
      var nodes = parentElement.getElementsByTagName("*");
      for (var i = 0; i < nodes.length; i++) {
        var id = nodes[i].id;
        if (!contains("#" + id, selectorTextArr))
          selectorTextArr.push("#" + id);

        var classes = nodes[i].classList;
        for (var c = 0; c < classes.length; c++)
          if (!contains("." + classes[c], selectorTextArr))
            selectorTextArr.push("." + classes[c]);
      }

      //     // Extract CSS Rules
      var extractedCSSText = "";
      for (var i = 0; i < document.styleSheets.length; i++) {
        var s = document.styleSheets[i];

        try {
          if (!s.cssRules) continue;
        } catch (e) {
          if (e.name !== "SecurityError") throw e; // for Firefox
          continue;
        }

        var cssRules = s.cssRules;
        for (var r = 0; r < cssRules.length; r++) {
          if (contains(cssRules[r].selectorText, selectorTextArr))
            extractedCSSText += cssRules[r].cssText;
        }
      }

      return extractedCSSText;

      function contains(str, arr) {
        return arr.indexOf(str) === -1 ? false : true;
      }
    }

    function appendCSS(cssText, element) {
      var styleElement = document.createElement("style");
      styleElement.setAttribute("type", "text/css");
      styleElement.innerHTML = cssText;
      var refNode = element.hasChildNodes() ? element.children[0] : null;
      element.insertBefore(styleElement, refNode);
    }
  }

  function svgString2Image(svgString, width, height, format, callback) {
    var format = format ? format : "png";

    var imgsrc =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = function() {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(function(blob) {
        var filesize = Math.round(blob.length / 1024) + " KB";
        if (callback) callback(blob, filesize);
      });
    };

    image.src = imgsrc;
  }
};
