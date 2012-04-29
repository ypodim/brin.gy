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
                var entry = JSON.parse(json.timeline[i]);
                var u = entry.user;
                if (!entry.user)
                    u = 'anonymous';

                if (u in {ypodim:1})
                    continue;

                var d = new Date().getTime()/1000;
                var diff = d - entry.tstamp;
                var diffstr = Math.floor(diff)+' seconds ago';
                if (diff >= 60 && diff < 3600)
                    diffstr = Math.floor(diff/60)+' mins ago';
                if (diff >= 3600 && diff < 86400)
                    diffstr = Math.floor(diff/3600)+' hours ago';
                if (diff >= 86400)
                    diffstr = Math.floor(diff/86400)+' days ago';

                var obj = entry.body;
                if (typeof entry.body == 'object')
                    obj = JSON.stringify(entry.body)
                

                if (entry.type in {'attribute:added':1, 'attribute:removed':1})
                    obj = entry.body.key+': '+entry.body.val+' in '+entry.body.context

                var stat = that.template({
                    user: u,
                    verb: entry.type,
                    object: obj,
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