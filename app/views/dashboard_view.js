var Application = require('application');
var View = require('./view');
var template = require('./templates/dashboard');

module.exports = View.extend({
    id: 'dashboard-view',
    template: template,
    events: {
        "drop #drop-target" : "drop"
    },

    initialize: function() {
        var self = this;
        _.bindAll(this, 'drop');
    },

    drop: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var data = JSON.parse(e.originalEvent.dataTransfer.getData('Text')),
            wrap = function(value) {
                return '<span class=\"label label-warn\">'+value+'</span>';
            },
            uid = wrap(data.uid);
        return $(e.target).html([data.title, uid].join('<br/>'));
    },

    afterRender: function() {
        return this.$('#drop-target').dropArea();
    }
});
