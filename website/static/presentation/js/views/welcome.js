define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'views/nametag',
  'text!templates/slide2.html',
  'text!templates/lastSlide.html',
  'text!templates/mapSlide.html',
  ], function($, _, Backbone, router, nametagView, slidePicTemplate, lastSlideTemplate, mapTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),
    events: {
        'click div':'nextSlide',
        'click div#nametag':'internalTransition',
    },

    slide: 0,
    slides: [],

    pointer: 0,
    taglist: [],

    internalSlideCounter: 0,


    slideIntro: function(){
        var compiled_template = _.template( slidePicTemplate );
        this.el.html( compiled_template() );
    },

    throwTag: function(tag){
        var nview = new nametagView({attr:tag.key, value:tag.val});
        nview.render(tag.x*200, tag.y*110);
        $(this.el).append(nview.el);
        nview.animate(20);
    },
    processNext: function(){
        if (this.pointer < this.taglist.length) {
            this.throwTag(this.taglist[this.pointer]);
            this.pointer++;
            setTimeout(this.processNext, 100);
        }
    },
    slideManyTags: function(){
        $(this.el).css('background-color','rgba(0,0,0,0.1)');
        var that = this;
        var x = -1;
        var y = -1;
        $.getJSON("http://satellite.brin.gy/profile/all/keyvals", function(json){
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

    slide2: function(){
        $(this.el).css('background-color','rgba(0,0,0,0.1)');
        var nview = new nametagView({attr:'name', value:'Pol<br>MIT Media Lab'});
        nview.render('25%', '25%', true);
        $(this.el).append(nview.el);
        nview.$('div').css('padding-top','30px');
        nview.animate(0, 0.7);
    },

    slideMap: function(){
        var compiled_template = _.template( mapTemplate );
        var that = this;
        this.el.html( compiled_template() );
        if (GBrowserIsCompatible()) {
            var map = new GMap2(document.getElementById("map_canvas"));
            map.setCenter(new GLatLng(37.4419, -122.1419), 15);
            // map.setUIToDefault();
        }
        setTimeout(function(){
            map.panBy(new GSize(-1600, -450));
        },10)
        setTimeout(function(){
            that.$('.mapCaption').show();
            that.$('.mapSlide').css('border','5px solid red');
        },1500)
    },

    lastSlide: function(){
        window.location = 'http://brin.gy/';
        var compiled_template = _.template( lastSlideTemplate );
        this.el.html( compiled_template() );
    },

    internalTransition:function(evt){
        if (this.slides[this.slide-1] == 'slideManyTags') {
            this.$('div#nametag:not(.exception)').css('opacity',0.05);
            this.internalSlideCounter++;
        }
    },
    nextSlide:function(evt){
        if (this.slides[this.slide-1] == 'slideManyTags') {
            if (this.internalSlideCounter < 1)
                return;
        }
        

        var newone = $(this.el).clone(true).empty();
        $(this.el).before(newone);
        $(this.el).addClass('anime slideLeft');

        var that = this;
        setTimeout(function(){
            $(that.el).remove();
            that.el = newone;

            that[that.slides[that.slide]]();

            that.slide++;
            if (that.slide >= that.slides.length)
                that.slide = 0;
        }, 700);
        
    },
    render: function(){
        console.log('next');
        this.nextSlide();
    },
    initialize: function(options){
        _.bindAll(this, 'render', 'slideIntro', 'slide2', 'slideManyTags', 'slideMap', 'throwTag', 'processNext', 'nextSlide');
        
        
        this.slides.push('slideIntro');
        this.slides.push('slide2');
        this.slides.push('slideManyTags');
        this.slides.push('slideMap');
        
        this.slides.push('lastSlide');
    },
  });
  return welcomeView;
});
