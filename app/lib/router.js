var Application = require('application');
var sidebar     = require('views/home_view');
var dash        = require('views/dashboard_view')

module.exports = Backbone.Router.extend({
  routes: {
    ''          : 'home',
    '!/:pages'  : 'pages'

  },

  home: function() {
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
