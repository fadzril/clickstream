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
        .attr("height", '100%');

    this.force = d3.layout.force()
        .gravity(.05)
        .charge(-200)
        .linkDistance( 120 )
        .size([w, h]);

    this.colorize = c;
    this.nodes = this.force.nodes();
    this.links = this.force.links();
    
}

Graph.prototype.request = function(url, uid, type) {
    var self = this;
    $.getJSON(url, function(data) {
        if (!type) {
            $.getJSON(url, function(data){
                $.when(self.init(uid)).done(function(){
                    self.nodeCreate(data.initalNodes,uid);
                });
            });
        } else {
            $.getJSON(url, {"nodeID":uid},function(data){
                self.nodeCreate(data.node);
                self.linkCreate(data.links);
            })
        }
    });
}

Graph.prototype.nodeCreate = function(data, target) {
    var self = this,
        nodePushed = function(item){
            var node = self.nodeFindIndex(self, item.id);
            if (node === undefined) {
                self.nodes.push({
                "id": item.id,
                "name": item.name
                });
            }
        };

        if (target !== undefined){
            nodePushed(data[target]);
            }
        else{
            data.forEach(function(item, index) {
                nodePushed(item);
            });
        }

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
    var self = this,
        index = 0,
        temp = [],
        node = self.nodeFind(self, id),
        ids, i, k, nodeLink, nodeToRemove;

    while(index < this.links.length) {
        if (this.links[index]['source'] === node ||this.links[index]['target'] === node){
            this.links.splice(index, 1);
        }
        else{
            index++;
        }
    }
    
    this.nodes.splice(self.nodeFindIndex(self, id), 1);

    ids = _.pluck(this.nodes,'id');

    for (i = 0; i < ids.length;i++){
        node = self.nodeFind(self,ids[i]);
        for (k = 0; k < this.links.length; k++)  {
            if ((this.links[k]['source'] == node)||(this.links[k]['target'] == node)){
                temp.push(ids[i]);
            }
        }
    }

    nodeLink = _.unique(temp);
    nodeToRemove = _.difference(ids,nodeLink);
    nodeToRemove.forEach(function(item, idx) {
        self.nodes.splice(self.nodeFindIndex(self, item), 1);   
    });

    this.remove = true;
    return this.update();
}

Graph.prototype.linkCreate = function(data) {
    var self = this,
        tempSource, tempTarget;
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

        if (add){
            tempSource = parseInt(self.nodeFindIndex(self, item.source));
            tempTarget = parseInt(self.nodeFindIndex(self, item.target));
            self.links.push({source:tempSource, target:tempTarget , value:item.value});
        } 
        else add = true;
    })
    return this.update();
}

Graph.prototype.update = function() {
    var self = this,
        calculateTopFive = function(d){
            if(d == 10) 
                return 1;
            else
                return 5 + (5%10-d+1);
        },
        calculateBottomFive = function(d){
            if(d == 1){
                return 10;
            }
            else if(d == 2){
                return 4;
            }
            else if(d==3){
                return 3;
            }
            else if(d==4){
                return 2;
            }
            else{
                return 1;
                  // return d - (d%5)-(d%5-1);
                  // return 5 + (5%10-d+1);
            }            
        },
        setMarker = function(d){
            var k = parseInt(Math.sqrt(d.value)),
                url = "url(#";
            if(d.target.x == d.source.x && d.target.y == d.source.y){
                url = url+"curve";
            }
            return k >= 10 ? url+10+")" : url+k+")";
        };        

    if (this.remove) {
        this.vis.selectAll("path.link").remove()
        this.remove = false;
    }
    this.vis.selectAll("path").remove();
    this.vis.selectAll("defs").remove();
    this.vis.selectAll("g").remove();
    this.force.start();

      //~ Arrow Marker
    this.vis.append("svg:defs")
        .selectAll("marker")
        .data([1,2,3,4,5,6,7,8,9,10])
        .enter().append("svg:marker")
        .attr("class","straight")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", -1.5)
        .attr("markerWidth",function(d){ return d > 5 ? calculateTopFive(d) : calculateBottomFive(d);})
        .attr("markerHeight", function(d){return d > 5 ? calculateTopFive(d) : calculateBottomFive(d);})
        .attr("markerUnits","strokeWidth")
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    this.vis.append("svg:defs")
        .selectAll("marker")
        .data([1,2,3,4,5,6,7,8,9,10])
        .enter().append("svg:marker")
        .attr("id", function(d){ return "curve"+d;})
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 9)
        .attr("refY", -1)
        .attr("markerWidth",function(d){ return d > 5 ? calculateTopFive(d) : calculateBottomFive(d);})
        .attr("markerHeight", function(d){return d > 5 ? calculateTopFive(d) : calculateBottomFive(d);})
        .attr("markerUnits","strokeWidth")
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    var path = this.vis.append("svg:g").selectAll("path.link")
        .data(this.links);

    var node = this.vis.append("svg:g").selectAll("circle.node")
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

      var text = this.vis.append("svg:g").selectAll("g")
        .data(this.force.nodes())
        .enter().append("svg:g");

      // A copy of the text with a thick white stroke for legibility.
      text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .text(function(d) { return d.name; });

    path.enter().append("path")
        .attr("class", "links")
        .attr("marker-end", function(d){ return setMarker(d); })
        .style("stroke-width",function(d){ var k =  parseInt(Math.sqrt(d.value)); if (k > 10) return 10; else return k; });

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
        .text( function(d) { if (d.color == '#b94431') { return d.id + ' (' + d.size + ')';} else { return d.id;} } )
        .attr("x", function(d) {return d.x;})
        .attr("y", function(d) {return d.y;})

    circle.append("title")
        .text(function(d) {
            return d.name;
        });

    node.exit().remove();

    this.force.on("tick", function(d) {
        path.attr("d", function(d) {
            if (d.target.x != d.source.x && d.target.y != d.source.y) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            }
            else{
                var dx = d.target.x + 15,
                    dy = d.target.y + 15,
                    dr = Math.sqrt(15 * 15 + 15 * 15);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 1,1 " + (d.target.x+15) + "," + (d.target.y+15); 
            }
        });

        node.attr(
            "transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            }
        );
        text.attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
        });
    });

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
                    return view.renderGraph(d.id,true);
                break;
                case 'remove':
                    return view.removeGraphNode(d.id);
                break;
                }
            }
        }
    );
}