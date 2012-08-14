var Application = require('application');

module.exports = Graph = function Graph() {
    this.remove = false;
    this.append = false;
    return this;
};

Graph.prototype.init = function() {
    var w = 900;
    var h = 500;
    var c = d3.scale.category20();
    var e = Array.prototype.slice.call(arguments)[0];

    this.vis = d3.select("#graph")
        .append("svg:svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("pointer-events", "all")
        .append('svg:g')
        .call(d3.behavior.zoom().on("zoom", this.update))

    //~ Arrow Marker
    this.vis.append("svg:defs")
        .selectAll("marker")
        .data(["center"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", -1)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    this.force = d3.layout.force()
        .gravity(.05)
        .charge(-200)
        .linkDistance( 120 )
        .size([w, h]);

    this.colorize = c;
    this.nodes = this.force.nodes();
    this.links = this.force.links();
    
}

Graph.prototype.request = function(url, type) {
    var self = this;
    var target = Array.prototype.slice.call(arguments)[1] || '#graph';
    $.getJSON(url, function(data) {
        if (!type) {
            $.when(self.init(target)).done(function() {
                self.nodeCreate(data.nodes);
                self.linkCreate(data.links);
            })
        } else {
            self.nodeCreate(data.nodes);
            self.linkCreate(data.links);
        }
    });
}

Graph.prototype.nodeCreate = function(data) {
    var self = this;
    data.forEach(function(item, index) {
        var node = self.nodeFindIndex(self, item.group);
        if (node === undefined) {
            self.nodes.push({
                "id": item.group,
                "name": item.name
            })
        }
    })

    return this.update();
};

Graph.prototype.nodeFind = function(context, idx) {
    for (var i in this.nodes) {
        if (context.nodes[i]["id"] === idx )
            return this.nodes[i];
    }
}

Graph.prototype.nodeFindIndex = function(context, idx) {
    for (var i in context.nodes) {
        if (context.nodes[i]["id"] === idx)
            return i;
    }
}

Graph.prototype.nodeRemove = function(id) {
    var self = this;
    var index = 0;
    var node = self.nodeFind(self, id);
    this.links.forEach(function(link, idx) {
        if (link === node) {
            var uid = link['target']['id'];
            if (uid !== undefined) 
                self.nodes.splice(self.nodeFindIndex(self, uid), 1);
        }
    });
    /*
    while(index < this.links.length) {
        if (
            this.links[index]['source'] === node ||
            this.links[index]['target'] === node
        ) this.links.splice(index, 1);
    }
    */
    this.nodes.splice(self.nodeFindIndex(self, id), 1);
    this.remove = true;
    return this.update();
}

Graph.prototype.linkCreate = function(data) {
    var self = this;
    data.forEach(function(item, index) {
        var add = true;
        if (self.links.length) {
            self.links.forEach(function(link, idx) {
                if (
                    link.source.id === item.source &&
                    link.target.id === item.target
                ) { add = false; }
            })
        }

        if (add) self.links.push(item)
        else add = true;
    })
    return this.update();
}

Graph.prototype.update = function() {
    var self = this;

    if (this.remove) {
        this.vis.selectAll("path.link").remove()
        this.remove = false;
    }

    var path = this.vis.selectAll("path.link")
        .data(this.links);

    var node = this.vis.selectAll("circle.node")
        .data(this.nodes, function(d) {
            return d.id;
        });

    var circle = node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 15)
        .style("fill", function(d) {
            return self.colorize(d.id);
        })
        .call(self.force.drag);

    path.enter().append("path")
        .attr("class", "links")
        .attr("marker-end", "url(#center)")

    path.append("title")
        .text(function(d) {
            return d.name;
        });

    circle.append("svg:text")
        .attr("text-anchor", "middle")
        .attr("fill","black")
        .style("pointer-events", "none")
        .attr("font-size", function(d) { if (d.color == '#b94431') { return 10+(d.size*2) + 'px'; } else { return "9px"; } } )
        .attr("font-weight", function(d) { if (d.color == '#b94431') { return "bold"; } else { return "100"; } } )
        .text( function(d) { if (d.color == '#b94431') { return d.id + ' (' + d.size + ')';} else { return d.id;} } ) ;

    circle.append("title")
        .text(function(d) {
            return d.name;
        });

    node.exit().remove();

    this.force.on("tick", function(d) {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });

        node.attr(
            "transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            }
        )
    });
    
    this.force.start();

    return this.eventsCreate(circle);
}

Graph.prototype.tips = function() {
    var tooltip = d3.select('#graph').append("div")
        .attr("class", "tooltip")
        .style("opacity", -1);

    this.el = tooltip;

    this.showTooltip = function(text) {
        tooltip.text(text)
            .transition()
            .duration(500)
            .style("opacity", 1)
    }

    this.moveTooltip = function() {
        var pos = $(d3.event.currentTarget).position();
        tooltip.style("left", pos.left + 5 +  "px")
            .style("top", pos.top + 5 + "px")

    }

    this.hideTooltip = function() {
        tooltip.transition()
            .duration(500)
            .style("opacity", -1)
    }
}

Graph.prototype.eventsCreate = function(circle) {
    var self = this;
    return circle
        .on('mouseover', self.focusHandler)
        .on('click', self.clickHandler);
};


Graph.prototype.clickHandler = function(d) {
    var self = d;
    $.extend(true, $.fn.popover.defaults, {
        placement: function() {
            return { "top": d.y, "left": d.x }
        }
    });
}

Graph.prototype.focusHandler = function(d) {
    var view = Application.View.Dashboard;
    return $(this).contextMenu({ menu: 'menu' },
        function(action, el, pos) {
            if (action !== "") {
                switch (action) {
                case 'create':
                    view.append = true;
                    return view.renderGraph(d.id);
                break;
                case 'remove':
                    return view.removeGraphNode(d.id);
                break;
                }
            }
        }
    );
}