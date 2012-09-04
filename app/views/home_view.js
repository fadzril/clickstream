var Application = require('application');
var page        = require('models/pages_model');
var pages       = require('models/pages_collection');
var View        = require('./view');
var template    = require('./templates/home');
module.exports = View.extend({
    id: 'home-view',
    template: template,

    events: {
        "dragstart .nav li a": "dragStart",
        "click .nav li a"    : "resetPath"
    },

    initialize: function(options) {
        _.bindAll(this, 'getRenderData', 'render', 'dragStart', 'addEach', 'addOne', 'resetPath');
        this.state = (options !== undefined) ? options.page : 'pages';
        this.getRenderData();
    },

    getRenderData: function() {
        var self = this;
        this.collection = Application.Collections[this.state] !== undefined ? 
            Application.Collections[this.state] : new pages();

        if (this.collection.toJSON().length == 0) {
            var nodeID;
            switch(this.state){
                case 'keyword':
                    nodeID = 2;
                break;
                case 'product':
                    nodeID = 3
                break;
                default: 
                    nodeID = 1;
            }
            this.collection.fetch( { data: $.param({ nodeID : nodeID}) });
            this.collection.bind('reset', this.addEach, self);
        }
        return this;
    },

    render: function() {
        var data;
        if (this.data !== undefined){
            data = this.data;
        }
        else{
            data = this.collection.toJSON();
        }
        this.$el.html(this.template({data: data, page: this.page}));
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

    resetPath: function() {
        var graph = $('#graph');
            // path  = window.location.hash.replace('#', '');
        if (graph.length) {  
            graph.slideUp();
        }
        // Application.View.Dashboard.render();
        // return Application.Router.navigate(path, {trigger: true, replace: true});
    },

    addEach: function(item) {
        var key = '';
        switch(this.state){
            case 'keyword':
                key = 'initialKeywordNode';
            break;
            case 'product':
                key = 'initialProductNode';
            break;
            default:
                key = 'initalNodes';
            break;
        }
        this.data = _.first(_.pluck(item.toJSON(), key));
        Application.Collections[this.state].add(this.data);
        return this.render();
    },

    addOne: function(item) {
        var model = new page();
        Application.Collections.Pages = this.collection;
        return Application.Collections.Pages.add(model.set(item));
    }

});
