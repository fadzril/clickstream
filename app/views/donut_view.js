var Application = require('application');
var View = require('./view');
var template = require('./templates/donut');

module.exports = View.extend({
    id: 'donut-view',
    container: 'dashboard-view',
    template: template,

    initialize: function(options) {
        if (options !== undefined) {
            this.target = options.target;
            this.data = options.data;
        }
        var self = this;
        _.bindAll(this, 'getRenderData', 'afterRender', 'setInfoList');
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
                // color       : self.target.color
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
        $('#dashboard-view').find('#donut-view').remove();
        this.$el.html(this.template({data: this.collection}));
        this.afterRender();
        return this;
    },

    afterRender: function() {
        var self = this;
        setTimeout(function() {
            self.donut.init(self.data);
            self.donut.updatePie();
            self.setInfoList()
        }, 100);
    },

    setInfoList: function() {
        var height  = this.$el.parent().height(),
            list    = this.$('#donut-info'),
            PIE_HEIGHT = 167,
            BUFFER_HEIGHT = 100;

        if (list.height() > height) {
            return list.css({
                'height': height - (PIE_HEIGHT + BUFFER_HEIGHT),
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            })
        }
    }
});
