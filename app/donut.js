var Application = require('application');
var View = require('views/view');
var template = require('views/templates/donut');

module.exports = Donut = function Donut() {
    this.remove = false;
    this.append = false;
    return this;
};

Donut.prototype.init = function(dataAdj){
    this.width = 150,
	this.height = 150,
    this.arc = d3.svg.arc();        
    this.outerRadius = Math.min(this.width, this.height) / 2,
    this.innerRadius = this.outerRadius * .8,
    this.dataAdj = dataAdj;
    this.totalOctets = 0;
}

Donut.prototype.updatePie = function(){
	var self = this, pieData, filterData;
	this.vis = d3.select("#donut")
        .append("svg:svg")
        .attr("width", self.width)
        .attr("height", self.height);

    this.arc_group = this.vis.append("svg:g")
        .attr("class", "arc")
        .attr("transform", "translate(" + this.outerRadius + "," + this.outerRadius + ")");

    this.center_group = this.vis.append("svg:g")
        .attr("class", "center_group")
        .attr("transform", "translate(" + this.outerRadius + "," + this.outerRadius + ")");

    this.paths = this.arc_group.append("circle")
        .attr("fill", "#EFEFEF")
        .attr("r", this.outerRadius);

    this.whiteCircle = this.center_group.append("svg:circle")
        .attr("fill", "white")
        .attr("r", this.innerRadius);

    this.totalLabel = this.center_group.append("svg:text")
        .attr("class", "label")
        .attr("dy", -15)
        .attr("text-anchor", "middle")
        .text("TOTAL");

    this.totalValue = this.center_group.append("svg:text")
        .attr("class", "total")
        .attr("dy", 7)
        .attr("text-anchor", "middle")
        .text("Waiting...");

    this.totalUnits = this.center_group.append("svg:text")
        .attr("class", "units")
        .attr("dy", 21)
        .attr("text-anchor", "middle")
        .text("path views");

    this.donut = d3.layout.pie().value(function(d){
        return d.octetTotalCount;
    });
   
	pieData = this.donut(this.dataAdj),
    filteredPieData = pieData.filter(this.filterData);

    this.totalValue.text(function(){
        var kb = self.totalOctets;
        return kb;
    });

    this.arc_group.selectAll("circle").remove();
    this.arc_group.selectAll("g.arc")
        .data(filteredPieData)
        .enter().append("g")
        .attr("class", "arc")
        .append("path")
        .attr("fill", function(d, i) { 
        	return self.dataAdj[i].color; })
        .attr("d", self.arc);
};

Donut.prototype.filterData = function(el, index, array){
	var self = Application.Donut;
    el.name = self.dataAdj[index].port;
    el.value = self.dataAdj[index].octetTotalCount;
    el.innerRadius = self.innerRadius;
    el.outerRadius = self.outerRadius;
    self.totalOctets += el.value;
    return (el.value > 0);
};