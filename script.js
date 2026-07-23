let healthData = [];
let currentScene = 0;
const scenes = [
  {
    title: "Physical inactivity and obesity tend to rise together",
    description:
      "Each circle represents one U.S. county. Counties with more physical inactivity often also have higher obesity rates.",
    xVariable: "inactivity",
    yVariable: "obesity",
    xLabel: "Physical inactivity (%)",
    yLabel: "Obesity (%)",
    annotation:
      "Counties with more inactivity often have more obesity."
  },
  {
    title: "Physical inactivity is also related to diabetes",
    description:
      "This scene compares physical inactivity with diabetes prevalence in each county.",
    xVariable: "inactivity",
    yVariable: "diabetes",
    xLabel: "Physical inactivity (%)",
    yLabel: "Diabetes (%)",
    annotation:
        "Higher inactivity usually means higher diabetes."
  },
  {
    title: "Explore obesity and diabetes by county",
    description:
      "Explore individual counties by hovering over the points. Notice how counties with higher obesity generally also report higher diabetes rates.",
    xVariable: "obesity",
    yVariable: "diabetes",
    xLabel: "Obesity (%)",
    yLabel: "Diabetes (%)",
    annotation:
      "Hover over the circles to explore individual counties."
  }
];

const chart = d3.select("#chart");
const tooltip = d3.select("#tooltip");
const statusText = d3.select("#status");

const previousButton = d3.select("#previous");
const nextButton = d3.select("#next");
const sceneNumber = d3.select("#scene-number");

d3.csv("data/healthData.csv")
  .then(function(data) {
    healthData = data.map(function(d) {
      return {
        state: d.state,
        stateAbbr: d.state_abbr,
        county: d.county,
        fips: d.fips,

        population: +d.population.replace(/,/g, ""),

        inactivity: +d.inactivity,
        obesity: +d.obesity,
        diabetes: +d.diabetes
      };
    });

    healthData = healthData.filter(function(d) {
      return (
        Number.isFinite(d.inactivity) &&
        Number.isFinite(d.obesity) &&
        Number.isFinite(d.diabetes)
      );
    });

    console.log("County records loaded:", healthData.length);

    drawScene();
  })
  .catch(function(error) {
    console.error(error);

    statusText.text(
      "The dataset could not be loaded. Check that data/health.csv exists."
    );
  });

previousButton.on("click", function() {
  if (currentScene > 0) {
    currentScene = currentScene - 1;
    drawScene();
  }
});

nextButton.on("click", function() {
  if (currentScene < scenes.length - 1) {
    currentScene = currentScene + 1;
    drawScene();
  }
});

function drawScene() {
  const scene = scenes[currentScene];
  statusText.text(scene.description);
  sceneNumber.text(
    "Scene " + (currentScene + 1) + " of " + scenes.length
  );

  previousButton.property("disabled", currentScene === 0);
  nextButton.property(
    "disabled",
    currentScene === scenes.length - 1
  );

  chart.selectAll("*").remove();
  const width = 1000;
  const height = 600;
  const margin = {
    top: 80,
    right: 50,
    bottom: 75,
    left: 80
  };

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const svg = chart
    .append("svg")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", "100%");

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 42)
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .attr("fill", "#263445")
    .text(scene.title);

  const plot = svg
    .append("g")
    .attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );

  const xScale = d3
    .scaleLinear()
    .domain(
      d3.extent(healthData, function(d) {
        return d[scene.xVariable];
      })
    )
    .nice()
    .range([0, plotWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(
      d3.extent(healthData, function(d) {
        return d[scene.yVariable];
      })
    )
    .nice()
    .range([plotHeight, 0]);

  plot
    .append("g")
    .attr("transform", "translate(0," + plotHeight + ")")
    .call(d3.axisBottom(xScale));

  plot
    .append("g")
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", margin.left + plotWidth / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text(scene.xLabel);

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + plotHeight / 2))
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text(scene.yLabel);

  plot
    .selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return xScale(d[scene.xVariable]);
    })
    .attr("cy", function(d) {
      return yScale(d[scene.yVariable]);
    })
    .attr("r", 4)
    .attr("fill", "#4f7ea8")
    .attr("opacity", 0.45)
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)

    .on("mouseenter", function(event, d) {
        if (currentScene !== 2) {
          return;
        }
      
        d3.select(this)
          .raise()
          .attr("r", 7)
          .attr("opacity", 1)
          .attr("stroke", "#222");
      
        tooltip
          .html(
            "<strong>" +
              d.county +
              " County, " +
              d.stateAbbr +
              "</strong><br>" +
              "Physical inactivity: " +
              d.inactivity.toFixed(1) +
              "%<br>" +
              "Obesity: " +
              d.obesity.toFixed(1) +
              "%<br>" +
              "Diabetes: " +
              d.diabetes.toFixed(1) +
              "%<br>" +
              "Population: " +
              d3.format(",")(d.population)
          )
          .attr("hidden", null);
      
        positionTooltip(event);
      })
      
      .on("mousemove", function(event) {
        if (currentScene !== 2) {
          return;
        }
      
        positionTooltip(event);
      })
      
      .on("mouseleave", function() {
        if (currentScene !== 2) {
          return;
        }
      
        d3.select(this)
          .attr("r", 4)
          .attr("opacity", 0.45)
          .attr("stroke", "white");
      
        tooltip.attr("hidden", true);
      });

  addAnnotation(svg, scene.annotation);
}

function positionTooltip(event) {
    const tooltipNode = tooltip.node();
    if (!tooltipNode) {
      return;
    }
    const gap = 16;
    const edgePadding = 12;
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    let left = event.clientX + gap;
    let top = event.clientY + gap;
    if (left + tooltipWidth > window.innerWidth - edgePadding) {
      left = event.clientX - tooltipWidth - gap;
    }
  
    if (top + tooltipHeight > window.innerHeight - edgePadding) {
      top = event.clientY - tooltipHeight - gap;
    }
  
    left = Math.max(edgePadding, left);
    top = Math.max(edgePadding, top);
  
    tooltip
      .style("left", left + "px")
      .style("top", top + "px");
  }

function addAnnotation(svg, message) {
  const annotation = svg
    .append("g")
    .attr("transform", "translate(610,95)");

  annotation
    .append("rect")
    .attr("width", 330)
    .attr("height", 75)
    .attr("rx", 8)
    .attr("fill", "white")
    .attr("stroke", "#9aa9b8");

  annotation
    .append("text")
    .attr("x", 15)
    .attr("y", 28)
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .attr("fill", "#263445")
    .text("Key point");

  annotation
    .append("text")
    .attr("x", 15)
    .attr("y", 52)
    .attr("font-size", 12)
    .attr("fill", "#526273")
    .text(message);
}
