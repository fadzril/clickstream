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
        _.bindAll(this, 'drop', 'renderGraph');
    },

    drop: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var data = JSON.parse(e.originalEvent.dataTransfer.getData('Text')),
            wrap = function(value) {
                return '<span class=\"label label-warn\">'+value+'</span>';
            },
            uid = wrap(data.uid);


        this.$('h4').html([data.title, uid].join('<br/>'));
        this.renderGraph(data.uid, false);
    },

    renderGraph: function(uid,type) {
        var graph = Application.Graph;
        if(uid !== undefined){
            if (type == true){
                graph.request('../ajax/clickpathJSONResult.action',uid, type);
            }
            else{
                graph.request('../ajax/controllerAction.action',uid);
            }
        }
    },

    removeGraphNode: function(uid) {
        var graph = Application.Graph;
        return graph.nodeRemove(uid);
    },

    afterRender: function() {
        return this.$('#drop-target').dropArea();
    }
});
