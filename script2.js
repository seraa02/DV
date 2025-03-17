
d3.csv("temperature_daily.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.year = d.date.getFullYear();
        d.month = d.date.getMonth() + 1;
        d.day = d.date.getDate();
        d.max_temperature = +d.max_temperature;
        d.min_temperature = +d.min_temperature;
    });

    let recent = d3.max(data, d => d.year);
    let filttereddata = data.filter(d => d.year >= recent - 9);
    let nesteddata = d3.group(filttereddata, d => d.year, d => d.month);

    let years = Array.from(new Set(filttereddata.map(d => d.year))).sort();
    let months = Array.from({ length: 12 }, (_, i) => i + 1);

    let cellSize = 60;
    let width = cellSize * years.length;
    let height = cellSize * months.length;

    let svg = d3.select("#heatmap")
        .attr("width", width + 100)
        .attr("height", height + 50)
        .append("g")
        .attr("transform", "translate(50,30)");

    let color_scale = d3.scaleSequential(d3.interpolateOrRd)
        .domain([10, 35]);

    let current_metric = "max";

    function drawHeatmap() {
        svg.selectAll("*").remove();

        // Adding Year Labels (X-axis)
        svg.append("g")
            .selectAll("text")
            .data(years)
            .enter().append("text")
            .attr("x", (d, i) => i * cellSize + 25)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .text(d => d);

        // Adding Month Labels (Y-axis)
        svg.append("g")
            .selectAll("text")
            .data(months)
            .enter().append("text")
            .attr("x", -5)
            .attr("y", d => (d - 1) * cellSize + 30)
            .attr("text-anchor", "end")
            .text(d => d);

        let cells = svg.selectAll(".cell")
            .data(years.flatMap(year => months.map(month => ({ year, month }))))
            .enter().append("g")
            .attr("transform", d => `translate(${years.indexOf(d.year) * cellSize}, ${(d.month - 1) * cellSize})`);

        cells.append("rect")
            .attr("width", cellSize - 5)
            .attr("height", cellSize - 5)
            .attr("fill", d => {
                let tempData = nesteddata.get(d.year)?.get(d.month);
                if (!tempData) return "#ddd";
                let avg_temp = d3.mean(tempData, x => x[current_metric + "_temperature"]);
                return avg_temp ? color_scale(avg_temp) : "#ddd";
            });

        // Drawing Mini Line Charts in Each Cell
        let xScale = d3.scaleLinear().domain([1, 31]).range([5, cellSize - 10]);
        let yScale = d3.scaleLinear().domain([10, 35]).range([cellSize - 10, 5]);

        let lineMax = d3.line()
            .x(d => xScale(d.day))
            .y(d => yScale(d.max_temperature));

        let lineMin = d3.line()
            .x(d => xScale(d.day))
            .y(d => yScale(d.min_temperature));

        cells.each(function(d) {
            let tempData = nesteddata.get(d.year)?.get(d.month);
            if (!tempData) return;

            d3.select(this).append("path")
                .datum(tempData)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("d", lineMax);

            d3.select(this).append("path")
                .datum(tempData)
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("d", lineMin);
        });

        drawLegend();
    }

    function drawLegend() {
        let legendData = d3.range(10, 36, 5);
        let legend = d3.select("#legend").selectAll("div").data(legendData);

        legend.enter().append("div")
            .merge(legend)
            .style("background", d => color_scale(d))
            .style("width", "30px")
            .style("height", "20px")
            .style("font-size", "10px")
            .text(d => d + "°C");
    }

    window.toggleTemperature = function () {
        current_metric = current_metric === "max" ? "min" : "max";
        drawHeatmap();
    };

    drawHeatmap();
});
