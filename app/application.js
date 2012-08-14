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
