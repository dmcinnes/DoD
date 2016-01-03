$(function () {

  var game = $('#game');

  game.find('.card').draggable();
  game.find('.stack').droppable({
    hoverClass: 'stack-hover',
    drop: function () {
      console.log('dorp');
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
