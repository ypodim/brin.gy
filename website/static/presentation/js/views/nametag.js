define([
  'jquery',
  'underscore', 
  'backbone',
  'text!templates/nametag.html'
  ], function($, _, Backbone, nametagTemplate){
  var nametagView = Backbone.View.extend({
    template: _.template( nametagTemplate ),
    events: {
        
    },
    initialize: function(options) {
        _.bindAll(this, 'render');
        // this.state = options.state;
        this.attr = options.attr;
        this.value = options.value;
    },
    animate: function(rotation, scale, isException){
        var deg = Math.floor(Math.random()*2*rotation) - rotation;
        var that = this;
        setTimeout(function(){
            $(that.el).css('-webkit-transform', 'rotate('+deg+'deg) scale('+scale+')');    
        }, 1);
        $(this.el).attr('id','nametag').addClass('welcome anime');
        // if (this.value in {'backbone.js':1, 'Spanish':1}) {
        //     $(this.el).addClass('exception');
        // }
        if (isException) $(this.el).addClass('exception');
        
        return this;
    },
    render: function(x, y, exact){
        var left = x;
        var top = y;
        if (exact == undefined) {
            left = x + Math.random() * 80;
            top  = y + Math.random() * 80;
        }
        
        $(this.el).html(this.template({attr:this.attr, value:this.value}));
        $(this.el).css({left:left, top:top});
        return this;
    },
  });
  return nametagView;
});
