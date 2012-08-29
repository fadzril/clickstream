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
