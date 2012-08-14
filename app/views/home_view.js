var Application = require('application');
var pages       = require('models/pages_collection');
var page        = require('models/pages_model');
var View        = require('./view');
var template    = require('./templates/home');

module.exports = View.extend({
    id: 'home-view',
    template: template,

    events: {
        "dragstart .nav li a": "dragStart",
        "click .nav li a"    : "reset"
    },

    initialize: function() {
        _.bindAll(this, 'getRenderData', 'render', 'dragStart', 'addEach', 'addOne', 'reset');
        this.collection = new pages();
        this.getRenderData();
    },

    getRenderData: function() {
        this.collection.fetch();
        this.collection.bind('reset', this.addEach, this);
        return this;
    },

    render: function() {
        this.$el.html(this.template({data: this.data, page: this.page}));
        return this;
    },

    afterRender: function() {
        this.$('.nav li a').dropArea();
        return this;
    },

    dragStart: function(e) {
        // e.preventDefault();
        // e.stopPropagation();

        var title = $(e.target).text(),
            uid   = $(e.target).data('id'),
            item  = JSON.stringify({'title': title, 'uid': uid});
        return e.originalEvent.dataTransfer.setData('Text', item);
    },

    reset: function() {
        var graph = $('#graph');
        if (graph.length) {
            graph.slideUp();
        }
        Application.View.Dashboard.render();
    },

    addEach: function(item) {
        var nodes = _.pluck(item.toJSON(), 'nodes');
        this.data = _.first(nodes);
        _(this.data).each(this.addOne);
        return this.render();
    },

    addOne: function(item) {
        var model = new page();
        Application.Collections.Pages = this.collection;
        return Application.Collections.Pages.add(model.set(item));
    }

});
