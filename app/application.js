// Application bootstrapper.
Application = {

  initialize: function() {
    this.View = {};
    this.Collections = {};
    this.Models =  {};
    var sidebar    = require('views/home_view'),
        dashboard  = require('views/dashboard_view'),
        page       = require('models/pages_model'),
        pages      = require('models/pages_collection'),
        router     = require('lib/router');

    this.View.Dashboard = new dashboard();
    this.View.Sidebar = new sidebar();
    this.Router = new router();

    if (typeof Object.freeze === 'function') 
      Object.freeze(this);
  } 
}

module.exports = Application;
