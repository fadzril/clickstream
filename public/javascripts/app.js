(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle) {
    for (var key in bundle) {
      if (has(bundle, key)) {
        modules[key] = bundle[key];
      }
    }
  }

  globals.require = require;
  globals.require.define = define;
  globals.require.brunch = true;
})();

window.require.define({"application": function(exports, require, module) {
  // Application bootstrapper.
  Application = {
  
    initialize: function() {
      this.View = {};
      this.Collections = {};
      this.Models =  {};
      var sidebar    = require('views/home_view'),
          dashboard  = require('views/dashboard_view'),
          header     = require('views/header_view'),
          page       = require('models/pages_model'),
          router     = require('lib/router'),
          graph      = require('./graph'),
          PagesCollection   = require('models/pages_collection'),
          KeywordCollection = require('models/keyword_collection'),
          ProductCollection = require('models/product_collection');
  	    donut      = require('./donut');
  
      this.View.Dashboard = new dashboard();
      this.View.Sidebar   = new sidebar();
      this.View.Header    = new header();
      this.Router         = new router();
      this.Graph          = new graph();
      this.Donut          = new donut();
      this.Collections.pages    = new PagesCollection();
      this.Collections.keyword  = new KeywordCollection();
      this.Collections.product  = new ProductCollection();
  
      $(window).resize(this.relayout);
  
      if (typeof Object.freeze === 'function') 
        Object.freeze(this);
    },
  
    relayout: function() {
      return $('#section').layout({resize: false});
    }
  }
  
  module.exports = Application;
  
}});

window.require.define({"donut": function(exports, require, module) {
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
}});

window.require.define({"graph": function(exports, require, module) {
  var Application = require('application');
  var DonutView   = require('views/donut_view');
  
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
              // if(d == 10) 
                  return 1;
              // else
              //     return 5 + (5%10-d+1);
          },
          calculateBottomFive = function(d){
              if(d == 1){
                  return 10;
              }
              else if(d == 2){
                  return 5;
              }
              else if(d==3){
                  return 3;
              }
              else if(d==4){
                  return 2.5;
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
      
      var links = Application.Graph.links;
          color = Application.Graph.colorize;
          source = _(_(links).pluck('source')).pluck('index'),
          target = _(_(links).pluck('target')).pluck('index'),
          obj = [],
          generateObj = function(type){
              var data = type == "source" ? source : target,
                  t = type == "source" ? "target" : "source";
              
              data.forEach(function(val,index){
                  if(val == d.index){
                      var _obj = {
                              port: "port",
                              octetTotalCount: links[index].value,
                              name : links[index][t].name,
                              // color: color(links[index][t].id),
                              color: color(links[index][t].id),
                              type: t
                          };
                      obj.push(_obj);
                  }
              });
          };
  
      _.extend(self, {color:color(self.id)});
      generateObj("target");
      generateObj("source");
  
      if (obj.length) {
          var view = new DonutView({target: d, data: obj});
          return $('#dashboard-view').append(view.render().el);
      }
  
      return false;
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
}});

window.require.define({"initialize": function(exports, require, module) {
  var Application = require('application');
  
  $(function() {
      Application.initialize();
      window.history = Backbone.history.start();
  });
  
}});

window.require.define({"lib/router": function(exports, require, module) {
  var Application = require('application');
  var sidebar     = require('views/home_view');
  var dash        = require('views/dashboard_view')
  
  module.exports = Backbone.Router.extend({
    routes: {
      ''          : 'home',
      '!/:pages'  : 'pages'
  
    },
  
    home: function(params) {
      var dashboard = Application.View.Dashboard,
          side      = Application.View.Sidebar,
          header    = Application.View.Header;
  
      $('.dashboard').html(dashboard.render().el);
      $('.sidebar').html(side.el);
      $('#settings').html(header.render().el);
  
      $('#section').layout({resize: false});
    },
  
    pages: function(params) {
      var dashboard = new dash(),
          side      = new sidebar({page: params}),
          header    = Application.View.Header;
  
      $('.dashboard').html(dashboard.render().el);
      $('.sidebar').html(side.render().el);
      $('#settings').html(header.render().el);
  
      $('#section').layout({resize: false});
    }
  });
  
}});

window.require.define({"lib/view_helper": function(exports, require, module) {
  // Put your handlebars.js helpers here.
  
}});

window.require.define({"models/collection": function(exports, require, module) {
  // Base class for all collections.
  module.exports = Backbone.Collection.extend({
    url: '',
    initialize: function(options) {
      
    }
  });
  
}});

window.require.define({"models/keyword_collection": function(exports, require, module) {
  var Collections = require('models/collection'),
      Pages       = require('models/pages_model');
  
  module.exports = Collections.extend({
      model: Pages,
      url: '../ajax/controllerAction.action',
      initialize: function(attributes) {
          console.info(attributes);
      },
  
      setPages: function(attributes) {
      	this.add('pages', attributes['initialKeywordNode'])
      },
  
      setSearch: function() {
      	
      }
  })
}});

window.require.define({"models/model": function(exports, require, module) {
  // Base class for all models.
  module.exports = Backbone.Model.extend({
    defaults: {},
  
    initialize: function(attributes) {
      this.__super__();
      return attributes.length;
    }
  });
  
}});

window.require.define({"models/pages_collection": function(exports, require, module) {
  var Collections = require('models/collection'),
      Pages       = require('models/pages_model');
  
  module.exports = Collections.extend({
      model: Pages,
      url: '../ajax/controllerAction.action',
      initialize: function(attributes) {
          console.info(attributes);
      },
  
      setPages: function(attributes) {
      	this.add('pages', attributes['initalNodes'])
      },
  
      setSearch: function() {
      	
      }
  })
}});

window.require.define({"models/pages_model": function(exports, require, module) {
  var Model = require('./model');
  
  module.exports = Model.extend({
    defaults: {
      name: null,
      group: null
    },
  
    initialize: function(attributes) {
    }
  });
}});

window.require.define({"models/product_collection": function(exports, require, module) {
  var Collections = require('models/collection'),
      Pages       = require('models/pages_model');
  
  module.exports = Collections.extend({
      model: Pages,
      url: '../ajax/controllerAction.action',
      initialize: function(attributes) {
          console.info(attributes);
      },
  
      setPages: function(attributes) {
      	this.add('pages', attributes['initialProductNode'])
      },
  
      setSearch: function() {
      	
      }
  })
}});

window.require.define({"views/dashboard_view": function(exports, require, module) {
  var Application = require('application');
  var View = require('./view');
  var template = require('./templates/dashboard');
  
  module.exports = View.extend({
      id: 'dashboard-view',
      template: template,
      events: {
          "drop #drop-target" : "drop"
      },
  
      initialize: function() {
          var self = this;
          _.bindAll(this, 'drop', 'renderGraph');
      },
  
      drop: function(e) {
          e.preventDefault();
          e.stopPropagation();
  
          var data = JSON.parse(e.originalEvent.dataTransfer.getData('Text')),
              wrap = function(value) {
                  return '<span class=\"label label-warn\">'+value+'</span>';
              },
              uid = wrap(data.uid);
  
  
          this.$('h4').html([data.title, uid].join('<br/>'));
          this.renderGraph(data.uid, false);
      },
  
      renderGraph: function(uid,type) {
          var graph = Application.Graph;
          if(uid !== undefined){
              if (type == true){
                  graph.request('../ajax/clickpathJSONResult.action',uid, type);
              }
              else{
                  graph.request('../ajax/controllerAction.action',uid);
              }
          }
      },
  
      removeGraphNode: function(uid) {
          var graph = Application.Graph;
          return graph.nodeRemove(uid);
      },
  
      afterRender: function() {
          return this.$('#drop-target').dropArea();
      }
  });
  
}});

window.require.define({"views/donut_view": function(exports, require, module) {
  var Application = require('application');
  var View = require('./view');
  var template = require('./templates/donut');
  
  module.exports = View.extend({
      id: 'donut-view',
      container: 'dashboard-view',
      template: template,
  
      initialize: function(options) {
          if (options !== undefined) {
              this.target = options.target;
              this.data = options.data;
          }
          var self = this;
          _.bindAll(this, 'getRenderData', 'afterRender', 'setInfoList');
      },
  
      getRenderData: function() {
          this.donut = Application.Donut;
          this.collection = [];
          var self            = this,
              colors          = [],
              clickStreams    = _.pluck(self.data,"octetTotalCount");
              totalSum        = _.reduce(clickStreams, function(memo, num){ return memo + num; }, 0);
              
          this.data.forEach(function(val, index){
              var obj = {
                  percentage  : ((val.octetTotalCount/totalSum)*100).toFixed(2),
                  pathView    : val.octetTotalCount,
                  urlStart    : val.type == 'source' ? val.name : self.target.name,
                  urlEnd      : val.type == 'target' ? val.name : self.target.name,
                  color       : val.type == 'target' ? val.color: self.target.color
                  // color       : self.target.color
              }
              if(val.type === "source"){
                  colors.push(index);
              }
              self.collection.push(obj);
          });
          return this;
      },
  
      render: function(){
          this.getRenderData();
          $('#dashboard-view').find('#donut-view').remove();
          this.$el.html(this.template({data: this.collection}));
          this.afterRender();
          return this;
      },
  
      afterRender: function() {
          var self = this;
          setTimeout(function() {
              self.donut.init(self.data);
              self.donut.updatePie();
              self.setInfoList()
          }, 100);
      },
  
      setInfoList: function() {
          var height  = this.$el.parent().height(),
              list    = this.$('#donut-info'),
              PIE_HEIGHT = 167,
              BUFFER_HEIGHT = 100;
  
          if (list.height() > height) {
              return list.css({
                  'height': height - (PIE_HEIGHT + BUFFER_HEIGHT),
                  'overflow-x': 'hidden',
                  'overflow-y': 'auto'
              })
          }
      }
  });
  
}});

window.require.define({"views/header_view": function(exports, require, module) {
  var Application = require('application');
  var View = require('./view');
  var template = require('./templates/header');
  
  module.exports = View.extend({
      id: 'dashboard-header-view',
      template: template,
      events: {
          "click .toggle-sidebar" : "sidebar",
          "click .toggle-details" : "details"
      },
  
      initialize: function() {
          var self = this;
          _.bindAll(this, 'sidebar', 'details');
      },
  
      sidebar: function(e) {
          e.preventDefault();
          var sidebar = $('.west');
          return sidebar
              .animate({
                  width: 'toggle'
              }, {
                  duration: 500, 
                  complete: this.relayout, 
                  step: this.relayout
              }
          );
      },
  
      details: function() {
          var details = $('#dashboard-view').find('#donut-view');
          if(!details.is(':visible'))
              details.slideDown();
          else
              details.slideUp();
      },
  
      relayout: function() {
          var section = $('#section');
          return section.layout({resize: false});
      },
  
      afterRender: function() {
          return this.$('#drop-target').dropArea();
      }
  });
  
}});

window.require.define({"views/home_view": function(exports, require, module) {
  var Application = require('application');
  var page        = require('models/pages_model');
  var pages       = require('models/pages_collection');
  var View        = require('./view');
  var template    = require('./templates/home');
  module.exports = View.extend({
      id: 'home-view',
      template: template,
  
      events: {
          "dragstart .nav li a": "dragStart",
          "click .nav li a"    : "resetPath"
      },
  
      initialize: function(options) {
          _.bindAll(this, 'getRenderData', 'render', 'dragStart', 'addEach', 'addOne', 'resetPath');
          this.state = (options !== undefined) ? options.page : 'pages';
          this.getRenderData();
      },
  
      getRenderData: function() {
          var self = this;
          this.collection = Application.Collections[this.state] !== undefined ? 
              Application.Collections[this.state] : new pages();
  
          if (this.collection.toJSON().length == 0) {
              var nodeID;
              switch(this.state){
                  case 'keyword':
                      nodeID = 2;
                  break;
                  case 'product':
                      nodeID = 3
                  break;
                  default: 
                      nodeID = 1;
              }
              this.collection.fetch( { data: $.param({ nodeID : nodeID}) });
              this.collection.bind('reset', this.addEach, self);
          }
          return this;
      },
  
      render: function() {
          var data;
          if (this.data !== undefined){
              data = this.data;
          }
          else{
              data = this.collection.toJSON();
          }
          this.$el.html(this.template({data: data, page: this.page}));
          return this;
      },
  
      afterRender: function() {
          this.$('.nav li a').dropArea();
          return this;
      },
  
      dragStart: function(e) {
          // e.preventDefault();
          // e.stopPropagation();
  
          var title = $(e.target).text(),
              uid   = $(e.target).data('id'),
              item  = JSON.stringify({'title': title, 'uid': uid});
          return e.originalEvent.dataTransfer.setData('Text', item);
      },
  
      resetPath: function() {
          var graph = $('#graph');
              // path  = window.location.hash.replace('#', '');
          if (graph.length) {  
              graph.slideUp();
          }
          // Application.View.Dashboard.render();
          // return Application.Router.navigate(path, {trigger: true, replace: true});
      },
  
      addEach: function(item) {
          var key = '';
          switch(this.state){
              case 'keyword':
                  key = 'initialKeywordNode';
              break;
              case 'product':
                  key = 'initialProductNode';
              break;
              default:
                  key = 'initalNodes';
              break;
          }
          this.data = _.first(_.pluck(item.toJSON(), key));
          Application.Collections[this.state].add(this.data);
          return this.render();
      },
  
      addOne: function(item) {
          var model = new page();
          Application.Collections.Pages = this.collection;
          return Application.Collections.Pages.add(model.set(item));
      }
  
  });
  
}});

window.require.define({"views/templates/dashboard": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<div id=\"placeholder\">\r\n  <div class=\"msg\">\r\n    <h3>Start dragging any node from sidebar into target</h3>\r\n    <h4>Drop your target inside box below</h4>\r\n    <hr class=\"soften\"/>\r\n    <div id=\"drop-target\" class=\"well\">\r\n        <center></center>\r\n    </div>\r\n    <hr class=\"soften\"/>\r\n  </div>\r\n</div>\r\n<div id=\"graph\"></div>";});
}});

window.require.define({"views/templates/donut": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\r\n        <li>\r\n          <h3><b style=\"color:";
    foundHelper = helpers.color;
    stack1 = foundHelper || depth0.color;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "color", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\">";
    foundHelper = helpers.percentage;
    stack1 = foundHelper || depth0.percentage;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "percentage", { hash: {} }); }
    buffer += escapeExpression(stack1) + "%</b></h3> \r\n          <span>";
    foundHelper = helpers.urlStart;
    stack1 = foundHelper || depth0.urlStart;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "urlStart", { hash: {} }); }
    buffer += escapeExpression(stack1) + " --> ";
    foundHelper = helpers.urlEnd;
    stack1 = foundHelper || depth0.urlEnd;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "urlEnd", { hash: {} }); }
    buffer += escapeExpression(stack1) + "<br />";
    foundHelper = helpers.pathView;
    stack1 = foundHelper || depth0.pathView;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pathView", { hash: {} }); }
    buffer += escapeExpression(stack1) + " <b>path views</b></span>\r\n        </li>\r\n        ";
    return buffer;}

    buffer += "<div class=\"row-fluid\">\r\n  <div class=\"span12\">\r\n    <center>\r\n      <div id=\"donut\"></div>\r\n    </center>\r\n  </div>\r\n  <div class=\"span12\">\r\n    <div id=\"donut-info\">\r\n      <ul>\r\n        ";
    foundHelper = helpers.data;
    stack1 = foundHelper || depth0.data;
    stack2 = helpers.each;
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\r\n      </ul>\r\n    </div>\r\n  </div>\r\n</div>";
    return buffer;});
}});

window.require.define({"views/templates/header": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<span class=\"toggle-sidebar pull-left\"><i class=\"icon-th-list icon-white\"></i></span>\r\n<span class=\"toggle-details pull-right\"><i class=\"icon-plus icon-white\"></i></span>";});
}});

window.require.define({"views/templates/home": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\r\n      <li class=\"\" draggable=\"true\">\r\n        <a href=\"#\" data-id=\"";
    foundHelper = helpers.id;
    stack1 = foundHelper || depth0.id;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "id", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\"><span class=\"label label-info\">";
    foundHelper = helpers.name;
    stack1 = foundHelper || depth0.name;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</span></a>\r\n      </li>\r\n    ";
    return buffer;}

    buffer += "<div id=\"content\">\r\n  <ul class=\"nav nav-list\">\r\n    <li class=\"nav-header\">\r\n      Pages\r\n    </li>\r\n    <li class=\"divider\"></li>\r\n    ";
    stack1 = depth0.data;
    stack2 = helpers.each;
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\r\n  </ul>\r\n</div>\r\n";
    return buffer;});
}});

window.require.define({"views/view": function(exports, require, module) {
  require('lib/view_helper');
  
  // Base class for all views.
  module.exports = Backbone.View.extend({
    initialize: function() {
      this.render = _.bind(this.render, this);
    },
  
    template: function() {},
    getRenderData: function() {},
  
    render: function() {
      this.$el.html(this.template(this.getRenderData()));
      this.afterRender();
      return this;
    },
  
    afterRender: function() {}
  });
  
}});

