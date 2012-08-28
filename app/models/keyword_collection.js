var Collections = require('models/collection'),
    Pages       = require('models/pages_model');

module.exports = Collections.extend({
    model: Pages,
    url: '../ajax/controllerAction.action',
    initialize: function(attributes) {
        console.info(attributes);
    },

    setPages: function(attributes) {
    	this.add('pages', attributes['initalNodes'])
    },

    setSearch: function() {
    	
    }
})