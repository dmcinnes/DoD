$(function () {

  var game = $('#game');
  var cards  = game.find('.card');
  var stacks = game.find('.stack');

  var draggable;

  var isTouchscreen = function () {
    return /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
  };

  // set all cards not marked as non-draggable to draggable
  cards.not('.misc').attr('draggable', 'true');
  cards.on('dragstart', function (event) {
    draggable = $(this);
    var originalEvent = event.originalEvent;
    var dataTransfer = originalEvent.dataTransfer;
    dataTransfer.effectAllowed = 'move';
    if (!isTouchscreen()) {
      var x = originalEvent.layerX;
      var y = originalEvent.layerY;
      dataTransfer.setDragImage(draggable[0], x, y);
    }
  });
  stacks.on('dragover', function (event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
  });
  stacks.on('dragenter', function (event) {
    var stack = $(this);
    if (stack.filter('.single:has(.card)').length == 0) {
      stack.addClass('stack-hover');
    }
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
    // don't drop if we're single and have a card
    if (stack.filter('.single:has(.card)').length == 0) {
      setTimeout(function () {
        var card = draggable.detach();
        stack.append(card);
        draggable = null;
      }, 0);
    }
  });

  game.on('click', '.card:not(.selected)', function (event) {
    var card = $(this);
    if (card.closest('.face-down').length == 0) {
      event.stopPropagation();
      unselectCards();
      selectCard($(this));
    }
  });

  game.on('click', function (event) {
    event.preventDefault();
    unselectCards();
  });

  GameKeys.registerKeyDownHandler('left', function () {
    rotateSelectedCard(-1);
  });

  GameKeys.registerKeyDownHandler('right', function () {
    rotateSelectedCard(+1);
  });

  GameKeys.registerKeyDownHandler('up', function () {
    updateGold(+1);
  });

  GameKeys.registerKeyDownHandler('down', function () {
    updateGold(-1);
  });

  var selectCard = function (card) {
    var selected = card.hasClass('selected');
    if (!selected) {
      card.addClass('selected');
      var bgSize    = card.css('background-size').split(' ');;
      var bgLeft    = parseInt(bgSize[0], 10) * 5;
      var bgTop     = parseInt(bgSize[1], 10) * 5;
      var bgPos     = card.css('background-position').split(' ');;
      var bgPosLeft = parseInt(bgPos[0], 10) * 5;
      var bgPosTop  = parseInt(bgPos[1], 10) * 5;
      card.css({
        backgroundSize:     bgLeft    + 'px ' + bgTop    + 'px',
        backgroundPosition: bgPosLeft + 'px ' + bgPosTop + 'px'
      });
    }
  };

  var unselectCards = function () {
    game.find('.selected').removeClass('selected').
      css({
        backgroundSize:     '',
        backgroundPosition: ''
      });
  };

  var updateGold = function (increment) {
    var goldStack = $('.stack.gold');
    var gold = goldStack.attr('data-gold-tens') +
               goldStack.attr('data-gold-ones');
    var gold = parseInt(gold, 10) + increment;
    if (gold < 0) {
      gold = 0;
    } else if (gold > 79) {
      gold = 79;
    }
    var ones, tens = ''
    if (gold < 10) {
      // make tens empty when there isn't any
      // so the tooltip is rendered propery
      tens = '';
    } else {
      tens = Math.floor(gold / 10);
    }
    ones = gold % 10;
    goldStack.attr('data-gold-tens', tens);
    goldStack.attr('data-gold-ones', ones);
  };

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
