$(function () {

  var game = $('#game');
  var cards  = game.find('.card');
  var stacks = game.find('.stack');

  var draggable;

  cards.attr('draggable', 'true');
  cards.on('dragstart', function (event) {
    var dataTransfer = event.originalEvent.dataTransfer;
    dataTransfer.effectAllowed = 'move';
    draggable = $(this);
  });
  stacks.on('dragover', function (event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
  });
  stacks.on('dragenter', function (event) {
    $(this).addClass('stack-hover');
  });
  stacks.on('dragleave', function (event) {
    $(this).removeClass('stack-hover');
  });
  stacks.on('dragend', function (event) {
    game.find('.stack').removeClass('stack-hover');
  });
  stacks.on('drop', function (event) {
    event.preventDefault();
    var stack = $(this);
    setTimeout(function () {
      var card = draggable.detach();
      stack.prepend(card);
      draggable = null;
    }, 0);
  });

  // // disable all single stacks that have a card in them
  // game.find('.stack.single:has(.card)').droppable('disable');

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
