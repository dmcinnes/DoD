$(function () {

  var game = $('#game');

  game.find('.card').draggable({
    revert: true,
    revertDuration: 0,
    containment: 'window',
    appendTo: document.body,
    helper: 'clone'
  });
  game.find('.stack').droppable({
    hoverClass: 'stack-hover',
    drop: function (event, ui) {
      // re-enable single from stack
      var from = $(ui.draggable).parent('.stack');
      if (from.hasClass('single')) {
        from.droppable('enable');
      }
      // move to the new stack
      var stack = $(this);
      setTimeout(function () {
        var card = $(ui.draggable).detach();
        stack.prepend(card);
      }, 0);
      // disable this stack if it's a single
      if (stack.hasClass('single')) {
        stack.droppable('disable');
      }
    }
  });
  // disable all single stacks that have a card in them
  game.find('.stack.single:has(.card)').droppable('disable');

  game.on('click', '.card', function (event) {
    var card = $(this);
    var selected = $(this).hasClass('selected');
    game.find('.selected').removeClass('selected');
    if (!selected) {
      card.addClass('selected');
    }
    event.stopPropagation();
  });

  game.on('click', function (event) {
    event.preventDefault();
    game.find('.selected').removeClass('selected');
  });

  GameKeys.registerKeyDownHandler('left', function () {
    rotateSelectedCard(-1);
  });

  GameKeys.registerKeyDownHandler('right', function () {
    rotateSelectedCard(+1);
  });

  var rotClasses = ['rot-90', 'rot-180', 'rot-270'];

  var rotateSelectedCard = function (direction) {
    var card = game.find('.card.selected');
    if (card[0]) {
      for (var i = 0; i < rotClasses.length; i++) {
        if (card.hasClass(rotClasses[i])) {
          card.removeClass(rotClasses[i]);
          // doesn't add anything if out of range
          card.addClass(rotClasses[i+direction]);
          return;
        }
      }
      // nothing found, set first or last depending
      // on direction
      if (direction > 0) {
        card.addClass(rotClasses[0]);
      } else {
        card.addClass(rotClasses[2]);
      }
    }
  };

});
