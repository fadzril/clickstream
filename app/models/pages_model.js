var Model = require('./model');

module.exports = Model.extend({
  defaults: {
    name: null,
    group: null
  },

  initialize: function(attributes) {
  }
});