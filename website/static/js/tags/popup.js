$.extend(Viral, {
  overlay: $('<div id="overlay"><div id="overlay-cell"></div></div>'),
  showPopup: function(body) {
   this.overlay.children().append(body);
   this.overlay.fadeIn('fast');
   this.overlay.focus();
  },
  hidePopup: function() {
   this.overlay.children().empty();
   this.overlay.hide();
  }
 });

$(function(){
  Viral.overlay.hide();
  $('body').append(Viral.overlay);
 });


Viral.popup = {
 confirm_body: $('<div class="popup"><p id="confirm_q"> '
		 + '</p><input id="confirm_ok" type="button" value="Ok"></input>'
		 + '<input id="confirm_cancel" type="button" value="Cancel">'
		 + '</input></div>'),
 
 showConfirm: function(question, confirm, cancel, context, extra) {
  var body = this.confirm_body;
  body.children('#confirm_q').html(question);
  body.children('#confirm_ok').unbind('click');
  body.children('#confirm_ok').bind('click', function(){
    if (confirm) confirm.call(context || {}, extra);
    Viral.hidePopup();
   });
  body.children('#confirm_cancel').unbind('click');
  body.children('#confirm_cancel').bind('click', function(){
    if (cancel) cancel.call(context || {}, extra);
    Viral.hidePopup();
   });
  Viral.showPopup(body);
 },
 
 comment_body: $('<div class="popup"><b>Comments:</b><br><textarea id="comment" cols="38" rows="20"></textarea><br>'
		 + '<input id="comment_ok" type="button" value="Submit"></input>'
		 + '<input id="comment_cancel" type="button" value="Cancel">'
		 + '</input></div>'),
 
 showComment: function() {
  Viral.popup.comment_body.children('#comment_ok').bind('click', function(){
    $.ajax({
      url: 'http://tagnet.media.mit.edu/'+Viral.data.person+'/comments',
      data: { comment: $('#comment').val() },
       error: function(){ alert('Failed to submit comment!'); },
       success: function(){},
       type: 'POST'
       });
    $('#comment').val('');
    Viral.hidePopup();
   });
  Viral.popup.comment_body.children('#comment_cancel').bind('click', function(){
    Viral.hidePopup();
   });
  Viral.showPopup(this.comment_body);
 }
};

$(function(){
    $('#suggest a').bind('click', function(evt){
      evt.preventDefault();
      Viral.popup.showComment();
     });
    $('#suggest').css('left',Viral.viz.el.width() - 130);
 });