var Application = require('application');

$(function() {
    Application.initialize();
    window.history = Backbone.history.start();
});
