$(function () {

  var game = $('#game');

  game.find('.card').draggable({
    revert: true
  });
  game.find('.stack').droppable({
    hoverClass: 'stack-hover',
    drop: function (event, ui) {
      console.log(ui);
      // move to the new stack
      var card = $(ui.draggable).detach();
      // so it doesn't 'revert' after being added to this stack
      card.css({left: 0, top: 0});
      $(this).prepend(card);
    }
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
