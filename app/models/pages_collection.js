var Collections = require('models/collection'),
    Pages       = require('models/pages_model');

module.exports = Collections.extend({
    model: Pages,
    url: 'miserables3.json',
    initialize: function(attributes) {
        console.info(attributes);
    }
})