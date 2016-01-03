$(function () {

  var game = $('#game');

  game.find('.card').draggable({
    revert: true,
    revertDuration: 0,
    connectToSortable: ".stack.player-hand"
  });
  game.find('.stack:not(.player-hand)').droppable({
    hoverClass: 'stack-hover',
    drop: function (event, ui) {
      // move to the new stack
      var stack = $(this);
      setTimeout(function () {
        var card = $(ui.draggable).detach();
        stack.prepend(card);
      }, 0);
    }
  });
  game.find('.stack.player-hand').sortable({
  });

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
