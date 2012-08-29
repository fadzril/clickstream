var Application = require('application');
var View = require('./view');
var template = require('./templates/header');

module.exports = View.extend({
    id: 'dashboard-header-view',
    template: template,
    events: {
        "click .toggle-sidebar" : "sidebar",
        "click .toggle-details" : "details"
    },

    initialize: function() {
        var self = this;
        _.bindAll(this, 'sidebar', 'details');
    },

    sidebar: function(e) {
        e.preventDefault();
        var sidebar = $('.west');
        return sidebar
            .animate({
                width: 'toggle'
            }, {
                duration: 500, 
                complete: this.relayout, 
                step: this.relayout
            }
        );
    },

    details: function() {
        var details = $('#dashboard-view').find('#donut-view');
        if(!details.is(':visible'))
            details.slideDown();
        else
            details.slideUp();
    },

    relayout: function() {
        var section = $('#section');
        return section.layout({resize: false});
    },

    afterRender: function() {
        return this.$('#drop-target').dropArea();
    }
});
