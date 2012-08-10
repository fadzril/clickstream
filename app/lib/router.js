var Application = require('application');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home'
  },

  home: function() {
    var dashboard = Application.View.Dashboard,
        sidebar   = Application.View.Sidebar;

    $('#dashboard').html(dashboard.render().el);
    $('#sidebar').html(sidebar.el);
  }
});
