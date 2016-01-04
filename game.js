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
  // game.find('.stack.single').droppable({

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

});
