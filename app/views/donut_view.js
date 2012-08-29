var Application = require('application');
var View = require('./view');
var template = require('./templates/donut');

module.exports = View.extend({
    id: 'donut-view',
    container: 'dashboard-view',
    template: template,
    events: {
        "click #graph cirlce" : "updateInfo"
    },

    initialize: function(options) {
        if (options !== undefined) {
            this.target = options.target;
            this.data = options.data;
        }
        var self = this;
        _.bindAll(this, 'updateInfo', 'getRenderData', 'afterRender');
    },

    updateInfo: function(d ,data) {
        var view = Application.Donut;
            stream = [],
            c = [],
            clickStreams = _.pluck(data,"octetTotalCount");
            totalSum = _.reduce(clickStreams, function(memo, num){ return memo + num; }, 0);
        data.forEach(function(val, index){
            obj = {
                percentage  : ((val.octetTotalCount/totalSum)*100).toFixed(2),
                pathView    : val.octetTotalCount,
                urlStart    : val.type == 'source' ? val.name : d.name,
                urlEnd      : val.type == 'target' ? val.name : d.name,
                color       : val.type == 'target' ? val.color: d.color
            }
            if(val.type === "source"){
                c.push(index);
            }
            stream.push(obj);
        });
        if(c.length != 0){
            var idx = c[0];
            data[idx].color = stream[idx].color;
        }
        this.render(stream);
        view.init(data);
        view.updatePie();
    },

    getRenderData: function() {
        this.donut = Application.Donut;
        this.collection = [];
        var self            = this,
            colors          = [],
            clickStreams    = _.pluck(self.data,"octetTotalCount");
            totalSum        = _.reduce(clickStreams, function(memo, num){ return memo + num; }, 0);
            
        this.data.forEach(function(val, index){
            var obj = {
                percentage  : ((val.octetTotalCount/totalSum)*100).toFixed(2),
                pathView    : val.octetTotalCount,
                urlStart    : val.type == 'source' ? val.name : self.target.name,
                urlEnd      : val.type == 'target' ? val.name : self.target.name,
                color       : val.type == 'target' ? val.color: self.target.color
            }
            if(val.type === "source"){
                colors.push(index);
            }
            self.collection.push(obj);
        });
        return this;
    },

    render: function(){
        this.getRenderData();
        this.$el.html(this.template({data: this.collection}));
        this.afterRender();
        return this;
    },

    afterRender: function() {
        var self = this;
        setTimeout(function() {
            self.donut.init(self.data);
            self.donut.updatePie();
        }, 100);
    }
});
