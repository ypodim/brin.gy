/*
 * visualization framework
 */
$(function(){
  Viral.viz = {};
  
  // create the canvas
  var main = $('#main');
  var d = Math.min(main.height(), main.width());
  var canvas = $('<canvas height="'+ d +'px" ' +
		    'width="'+ d +'px" id="viz"></canvas>');
  main.append(canvas);
  
  // initialize the canvas
  var ctx = canvas[0].getContext("2d");
  ctx.w = ctx.h = d;
  
  // basic canvas functionality
  var viz = Viral.viz;
  $.extend(Viral.viz, {
    el: canvas,
    ctx: ctx,
    
    reset_ctx: function() {
     ctx.fillStyle = 'black';
     ctx.setTransform(1,0,0,1,0,0);
     ctx.shadowOffsetX = 0;
     ctx.shadowOffsetY = 0;
     ctx.shadowColor = 'transparent black';
    },
    
    erase: function() {
     ctx.save();
     ctx.fillStyle = 'white';
     ctx.setTransform(1,0,0,1,0,0);
     ctx.fillRect(0,0, ctx.w, ctx.h);
     ctx.restore();
    },
     
    repaint: function() {
     this.repaint_flag = true;
    }
   });
  
  // canvas animation framework
  /* 
   * animator:
   * step(w, h, input) // return true when done
   * 
   * renderer:
   * step(w, h, input)
   * paint(ctx)
   * bind(canvas)
   * unbind(canvas)
   */
  $.extend(Viral.viz, {
    animation_delay: 50, // 20 fps
    
    stop: function() {
      clearInterval(this.animation_interval);
      delete this.animation_interval;
      this.viz = false;
    },
    
    set_viz: function(vizualization) {
     if (this.viz) {
      this.stop_animation();
      this.viz.unbind(canvas, ctx, viz);
      clearInterval(this.animation_interval);
      delete this.animation_interval;
     }
     
     this.viz = vizualization;
     if (this.viz) {
      this.viz.bind(canvas, ctx, viz);
      this.animation_interval = setInterval(
	    this.step_animation.bind(this), this.animation_delay);
      this.repaint();
     }
    },
    
    start_animation: function(animation) {
     if (this.viz) {
      if (this.animation) {
       this.stop_animation();
      }
      this.animation = animation;
     }
    },
    
    stop_animation: function() {
     delete this.animation;
    },
    
    get_input: function() {
     var data = {mousex:this.mousex, mousey:this.mousey,
		 mousemoved:this.mouseflag,
		 mouseover:this.mouseover
     };
     this.mouseflag = false;
     return data;
    },
    
    step_animation: function() {
     if (!this.viz) return;
     
     var input = this.get_input();
     if (!this.animation) {
      this.viz.step(this.ctx.w, this.ctx.h, input);
     }
     if (this.animation) {
      if (this.animation.step(this.ctx.w, this.ctx.h, input)) {
       this.stop_animation();
      }
     }
     if (this.repaint_flag) this.viz.paint(ctx, input);
    }
   });
  
  // mouse move input
  var off = canvas.offset();
  canvas.bind('mousemove', function(evt) {
    Viral.viz.mousex = evt.pageX - off.left;
    Viral.viz.mousey = evt.pageY - off.top;
    Viral.viz.mouseflag = true;
   });
  canvas.bind('mouseenter', function(evt) {
    Viral.viz.mouseover = true;
   });
  canvas.bind('mouseleave', function(evt) {
    Viral.viz.mouseover = false;
   });
  
  // alphabetical listing
  var alpha = Viral.viz.alpha = {
   state: {
    selected_tag: -10,
    tag_size: 12
   },
   
   bind: function(canvas, ctx, viz) {
    Viral.event.bind('DATA_tag_selected.viz', function(evt, tag) {
      this.scroll_to(Viral.data.findTagIndex(tag));
     }.bind(this));
    Viral.event.bind('DATA_tags_changed.viz', function(evt, tag) {
      viz.repaint();
     });
    
    canvas.bind('click.viz', function(evt) {
      if (!this.state.data) return;
      
      var index = Math.round((evt.pageY - ctx.h / 2) /
			     (this.state.tag_size + 6));
      
      if (index in this.state.data) {
       var data = this.state.data[index];
       var offset = data.width + 4;
       var x = evt.pageX - canvas.offset().left - ctx.w / 2;
       if (true) {//x > -data.width && x < offset + 10) {
	var t = data.text;
	if (Viral.data.tags.indexOf(t) > -1) { // FIXME: slow
	 Viral.popup.showConfirm('Remove <b>'+t+'</b> from your tags?',
				 Viral.data.removeTag, null, Viral.data, t);
	} else {
	 Viral.popup.showConfirm('Add <b>'+t+'</b> to your tags?',
			 Viral.data.addTag, null, Viral.data, t);
	}
       } else {
	//Viral.data.selectTag(data.text);
       }
      }
     }.bind(this));
    
    // set up the graphics context
    viz.reset_ctx();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.translate(d/2, d/2);
   },
   
   unbind: function(canvas) {
    Viral.event.unbind('.viz');
   },
   
   step: function(w, h, input) {
    if (input.mousemoved) Viral.viz.repaint();
    if (input.mouseover) {
     var d = 0;
     if (input.mousey < 80 && this.state.selected_tag > 1) {
      d = -2;
     } else if (input.mousey < 150 && this.state.selected_tag > 0) {
      d = -1
     } else if (input.mousey > h - 60 &&
		this.state.selected_tag < Viral.data.all_tags.length - 2) {
      d = 2;
     } else if (input.mousey > h - 130 &&
		this.state.selected_tag < Viral.data.all_tags.length - 1) {
      d = 1;
     } else {
      return;
     }
     this.state.selected_tag += d;
     Viral.data.selectTag(Viral.data.all_tags[
         this.state.selected_tag]);
    }
   },
   
   paint: function(ctx, input) {
    viz.erase();
    
    var data = {};
    
    var index = (input.mouseover ?
		 Math.round((input.mousey - ctx.h / 2) /
			    (this.state.tag_size + 6))
                 : .1);
    var hover = .1;
    
    var s = this.state.tag_size;
    var h = s + 6;
    var l = ctx.h / (2.0*h);
    var c = this.state.selected_tag;
    
    //ctx.fillStyle = '#999';
    //ctx.font = '12px monospace';
    //ctx.fillText('-->', -250, 0);
    ctx.font = '12px helvetica';
    ctx.fillStyle = '#000';
    
    for (var i = Math.floor(-l+4); i < l-2; i++) {
     if (i >= -c && i < Viral.data.all_tags.length - c) {
      
      var text = Viral.data.all_tags[c + i];
      var fig = (Viral.data.tags.indexOf(text) > -1 ? '-' : '+');
      
      if (fig == '+') {
       ctx.font = '12px helvetica';
      } else {
       ctx.font = 'bold 12px helvetica';
      }
      
      var width = ctx.measureText(text).width - 100;

      if (i == index) {
       var x = input.mousex - ctx.w / 2;
       var offset = width + 4;
       hover = index; //(x > -width && x < offset + 10) ? index : .1;
       
       ctx.fillStyle = '#f4f4f4';
       ctx.fillRect(-120, i*h-9, 310, 16);
       ctx.fillStyle = (hover == i) ? fig == '+' ? '#0B0' : '#C00' : '#000';
       ctx.fillText(text, -100, i * h);
       ctx.fillStyle = '#000';
      } else {
       ctx.fillText(text, -100, i * h);
      }
      
      data[i] = {
       width: width,
       text: text,
       fig: fig
      };
     }
    }
    
    ctx.font = "12px monospace";
    ctx.fillStyle = '#777';
    /*for (var i in data) {
     var d = data[i];
     if (i == hover) {
      /*ctx.fillStyle = '#0AF';
      ctx.beginPath();
      ctx.arc(d.width + 9, i * h, 6, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      */
    var d = data[hover];
    if (d) {
      ctx.fillStyle = d.fig == '+' ? '#0B0' : '#C00';
      ctx.fillText(d.fig, -114 /*d.width + 8*/, hover * h);
    }
    /*  ctx.fillStyle = '#777';
     } else {
      ctx.fillText(d.fig, d.width + 8, i * h);
     }
     }*/
    
    this.state.data = data;
   },
   
   scroll_to: function(tag_index) {
    Viral.viz.start_animation({
      step: function(){ 
       var sel = this.state.selected_tag;
       if (sel == tag_index) return true;
       var d = (tag_index - sel) / 20.0;
       d = d < 0 ? Math.floor(d) : Math.ceil(d);
       this.state.selected_tag += d;
       Viral.viz.repaint();
      }.bind(this)
     });
   }
  };
});

Viral.event.bind('DATA_loaded', function(evt) {
  Viral.viz.set_viz(Viral.viz.alpha);
 });

