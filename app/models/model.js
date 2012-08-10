// Base class for all models.
module.exports = Backbone.Model.extend({
  defaults: {},

  initialize: function(attributes) {
    this.__super__();
    return attributes.length;
  }
});
