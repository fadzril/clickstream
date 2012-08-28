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
          pages      = require('models/pages_collection'),
          router     = require('lib/router'),
          graph      = require('./graph');
  
      this.View.Dashboard = new dashboard();
      this.View.Sidebar   = new sidebar();
      this.View.Header    = new header();
      this.Router         = new router();
      this.Graph          = new graph();
  
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

window.require.define({"graph": function(exports, require, module) {
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
  
  module.exports = Backbone.Router.extend({
    routes: {
      '': 'home'
    },
  
    home: function() {
      var dashboard = Application.View.Dashboard,
          sidebar   = Application.View.Sidebar,
          header    = Application.View.Header;
  
      $('.dashboard').html(dashboard.render().el);
      $('.sidebar').html(sidebar.el);
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
      url: 'miserables3.json',
      initialize: function(attributes) {
          console.info(attributes);
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
          this.renderGraph();
      },
  
      renderGraph: function(uid) {
          var graph = Application.Graph;
          (uid !== undefined) ?
              graph.request(uid + '.json', true) :
              graph.request('miserables.json')
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
  var pages       = require('models/pages_collection');
  var page        = require('models/pages_model');
  var View        = require('./view');
  var template    = require('./templates/home');
  
  module.exports = View.extend({
      id: 'home-view',
      template: template,
  
      events: {
          "dragstart .nav li a": "dragStart",
          "click .nav li a"    : "reset"
      },
  
      initialize: function() {
          _.bindAll(this, 'getRenderData', 'render', 'dragStart', 'addEach', 'addOne', 'reset');
          this.collection = new pages();
          this.getRenderData();
      },
  
      getRenderData: function() {
          this.collection.fetch();
          this.collection.bind('reset', this.addEach, this);
          return this;
      },
  
      render: function() {
          this.$el.html(this.template({data: this.data, page: this.page}));
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
  
      reset: function() {
          var graph = $('#graph');
          if (graph.length) {
              graph.slideUp();
          }
          Application.View.Dashboard.render();
      },
  
      addEach: function(item) {
          var nodes = _.pluck(item.toJSON(), 'nodes');
          this.data = _.first(nodes);
          _(this.data).each(this.addOne);
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

