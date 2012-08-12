(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return hasOwnProperty.call(object, name);
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
      return require(absolute);
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
          router     = require('lib/router');

      this.View.Dashboard = new dashboard();
      this.View.Sidebar = new sidebar();
      this.View.Header = new header();
      this.Router = new router();

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

window.require.define({"initialize": function(exports, require, module) {
  var Application = require('application');

  $(function() {
      Application.initialize();
      Backbone.history.start();
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
          _.bindAll(this, 'drop');
      },

      drop: function(e) {
          e.preventDefault();
          e.stopPropagation();

          var data = JSON.parse(e.originalEvent.dataTransfer.getData('Text')),
              wrap = function(value) {
                  return '<span class=\"label label-warn\">'+value+'</span>';
              },
              uid = wrap(data.uid);
          return $(e.target).html([data.title, uid].join('<br/>'));
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
          "dragstart .nav li a": "dragStart"
      },

      initialize: function() {
          _.bindAll(this, 'getRenderData', 'render', 'dragStart', 'addEach', 'addOne');
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


    return "<div id=\"placeholder\">\n  <div class=\"msg\">\n    <h3>Start dragging any node from sidebar into target</h3>\n    <hr class=\"soften\"/>\n    <div id=\"drop-target\">\n        <center>Drop your target here!</center>\n    </div>\n    <hr class=\"soften\"/>\n    <h4>Or simply double click which item you like</h4>\n  </div>\n</div>";});
}});

window.require.define({"views/templates/header": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<span class=\"toggle-sidebar pull-left\"><i class=\"icon-th-list icon-white\"></i></span>\n<span class=\"toggle-details pull-right\"><i class=\"icon-plus icon-white\"></i></span>";});
}});

window.require.define({"views/templates/home": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n      <li class=\"\" draggable=\"true\">\n        <a href=\"#\" data-id=\"";
    foundHelper = helpers.group;
    stack1 = foundHelper || depth0.group;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "group", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\"><span class=\"\">";
    foundHelper = helpers.name;
    stack1 = foundHelper || depth0.name;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</span></a>\n      </li>\n    ";
    return buffer;}

    buffer += "<div id=\"content\">\n  <ul class=\"nav nav-list\">\n    <li class=\"nav-header\">\n      Pages\n    </li>\n    <li class=\"divider\"></li>\n    ";
    stack1 = depth0.data;
    stack2 = helpers.each;
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n  </ul>\n</div>\n";
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

