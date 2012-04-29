define([
  'jquery', 
  'underscore', 
  'backbone',
  'text!templates/stats.html'
  ], function($, _, Backbone, statsTemplate){
  var StatsView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(statsTemplate),

    events: {
        
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
      this.state = options.state;
    },

    render: function() {
        var that = this;
        var url = this.state.agent.baseurl+'/stats';
        $.getJSON(url, function(json){
            for (var i in json.timeline) {
                var body = JSON.parse(json.timeline[i]);
                var u = body.user;
                if (!body.user)
                    u = 'anonymous';

                var d = new Date().getTime()/1000;
                var diff = d - body.tstamp;
                var diffstr = Math.floor(diff)+' seconds ago';
                if (diff >= 60 && diff < 3600)
                    diffstr = Math.floor(diff/60)+' mins ago';
                if (diff >= 3600 && diff < 86400)
                    diffstr = Math.floor(diff/3600)+' hours ago';
                if (diff >= 86400)
                    diffstr = Math.floor(diff/86400)+' days ago';

                var stat = that.template({
                    user: u,
                    verb: body.type,
                    object: '',
                    tdiff: diffstr,
                });

                
                that.el.append(stat);
            }
            // that.el.html(html);
        });
        return this;
    },
  });
  return StatsView;
});