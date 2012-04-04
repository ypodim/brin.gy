define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'views/nametag',
  'text!templates/welcome.html',
  ], function($, _, Backbone, router, nametagView, welcomeViewTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),

    pointer: 0,
    taglist: [],
    throwTag: function(tag){
        var nview = new nametagView({attr:tag.key, value:tag.val});
        nview.render(tag.x*200, tag.y*110);
        $(this.el).append(nview.el);
        nview.animate();
    },
    processNext: function(){
        if (this.pointer < this.taglist.length) {
            this.throwTag(this.taglist[this.pointer]);
            this.pointer++;
            setTimeout(this.processNext, 100);
        }
    },
    render: function(){
        // var compiled_template = _.template( welcomeViewTemplate );
        // this.el.html( compiled_template() );
        var that = this;
        var x = -1;
        var y = -1;
        $.getJSON(this.state.satellite.url+"/profile/all/keyvals", function(json){
            for (var i in json.items) {
                var attr = json.items[i];
                for (var j in attr.values){
                    var val = attr.values[j];

                    if (y < 4)
                        that.taglist.push({key:attr.key, val:val.val, x:x, y:y});

                    x++;
                    if (x >= 4) {
                        y += 1;
                        x = -1;
                    }
                }
            }
            that.processNext();
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'throwTag', 'processNext');
        this.state = options.state;
    },
  });
  return welcomeView;
});
