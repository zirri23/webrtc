window.DEFAULT_PROFILE_PIC = "img/user.jpeg";
window.DRAG_TO_DROP_MAP = {};
window.DROP_TO_FUNCTION_MAP = {};

function getButton(text, href, id, type, size) {
  return sprintf("<a href='%s' id='%s' class='btn btn-%s btn-%s'>%s</a>", href, id, type, size, text);
}

function getRandom(number) {
  return Math.floor((Math.random() * 2 - 1) * number);
}

function cloneById(elementId, newId) {
  var clone = $(sprintf("#%s", elementId)).clone();
  clone.removeAttr("id");
  if(newId) {
    clone.attr("id", newId);
  }
  return clone;
}

(function($) {
  $.fn.drags = function(opt) {
      var $this = $(this);
      var pos_y_abs = 0, pos_x_abs = 0;
      opt = $.extend({handle:"",cursor:"url(/img/hand.png)"}, opt);

      if(opt.handle === "") {
          var $el = this;
      } else {
          var $el = this.find(opt.handle);
      }

      return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
          if(opt.handle === "") {
              var $drag = $(this).addClass('draggable');
          } else {
              var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
          }
          var z_idx = $drag.css('z-index'),
              drg_h = $drag.outerHeight(),
              drg_w = $drag.outerWidth(),
              pos_y = $drag.offset().top + drg_h - e.pageY,
              pos_x = $drag.offset().left + drg_w - e.pageX;
          pos_y_abs = $drag.offset().top;
          pos_x_abs = $drag.offset().left;   
          $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
              $('.draggable').offset({
                  top:e.pageY + pos_y - drg_h,
                  left:e.pageX + pos_x - drg_w
              }).on("mouseup", function() {
                  $(this).removeClass('draggable').css('z-index', z_idx);
              });
          });
          e.preventDefault(); // disable selection
      }).on("mouseup", function() {
        var dropSelectors = DRAG_TO_DROP_MAP[$this.selector];
        for (var j = 0; j < dropSelectors.length; j++) {
          var intersections = findIntersections(dropSelectors[j], $this.selector);
          if (intersections.length > 0) {
            for (var i = 0; i < intersections.length; i++) {
              window.draggable = intersections[i].draggable;
              window.droppable = intersections[i].droppable;
              DROP_TO_FUNCTION_MAP[{drop: dropSelectors[j], drag: $this.selector}]();
            }
          }
        }
        if (opt.revert) {
          $('.draggable').offset({
              top:pos_y_abs,
              left:pos_x_abs
          }, "slow");
        }
        if(opt.handle === "") {
            $(this).removeClass('draggable');
        } else {
            $(this).removeClass('active-handle').parent().removeClass('draggable');
        }
      });

  };
})(jQuery);


(function($) {
  $.fn.drops = function(opt) {
    var drops = DRAG_TO_DROP_MAP[opt.accept] || new Array();
    drops.push($(this).selector);
    DRAG_TO_DROP_MAP[opt.accept] = drops;
    DROP_TO_FUNCTION_MAP[{drop: $(this).selector, drag: opt.accept}] = opt.drop;
  };
})(jQuery);


function findIntersections(targetSelector, intersectorsSelector) {
  var intersectors = [];
  $(targetSelector).each(function() {
    var target = $(this);
    var tAxis = target.offset();
    var t_x = [tAxis.left, tAxis.left + target.outerWidth()];
    var t_y = [tAxis.top, tAxis.top + target.outerHeight()];
    
    $(intersectorsSelector).each(function() {
      var intersector = $(this);
      var thisPos = intersector.offset();
      var i_x = [thisPos.left, thisPos.left + intersector.outerWidth()];
      var i_y = [thisPos.top, thisPos.top + intersector.outerHeight()];
      
      if ( t_x[0] < i_x[1] && t_x[1] > i_x[0] &&
          t_y[0] < i_y[1] && t_y[1] > i_y[0]) {
        intersectors.push({droppable: target, draggable: intersector});
      }
      
    });
  });
  return intersectors;
}