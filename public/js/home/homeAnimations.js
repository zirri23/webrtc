function arrangeInCircle(fields, container, radius, left, top, center) {
  var width = container.width();
  var height = container.height();
  var angle = 0;
  var step = (2*Math.PI) / fields.length;
  fields.each(function() {
    var x = Math.round(width/2 + radius * Math.cos(angle) - $(this).width()/2);
    var y = Math.round(height/2 + radius * Math.sin(angle) - $(this).height()/2);
    $(this).css({
      "margin-left": (x + left) + 'px',
      "margin-top": (y + top) + 'px',
      "z-index": 1
    });
    angle += step;
  });
  center.find("img").css({
    "width": radius * 2,
  });
  center.css({
    "margin-left": (left - radius/1.3) + 'px',
    "margin-top": (top - radius/3.2) + 'px',
    "width": radius * 1.6,
  });
}
