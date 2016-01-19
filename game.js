$(function () {

  var game     = $('#game');
  var cards    = game.find('.card');
  var stacks   = game.find('.stack');
  var playArea = game.find('.play-area');

  var draggable;
  var draggableGrabPos = {};

  var potentialRoomDrops = [];

  var isTouchscreen = function () {
    return /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
  };

  // set all non misc cards to draggable
  cards.not('.misc').attr('draggable', 'true');
  // fruits, arrows, poison and amulet are also draggable
  cards.filter('.fruits,.arrows,.poison,.amulet').attr('draggable', 'true');

  cards.on('dragstart', function (event) {
    draggable = $(this);
    var originalEvent = event.originalEvent;
    var dataTransfer = originalEvent.dataTransfer;
    dataTransfer.effectAllowed = 'move';
    if (!isTouchscreen()) {
      var x = originalEvent.layerX;
      var y = originalEvent.layerY;
      draggableGrabPos.x = x;
      draggableGrabPos.y = y;
      dataTransfer.setDragImage(draggable[0], x, y);
    }
  });

  var droppableStacks = stacks.not('.non-drop');

  droppableStacks.on('dragover', function (event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
  });
  droppableStacks.on('dragenter', function (event) {
    var stack = $(this);
    var limit = stack.data('limit');
    if (!limit ||
        stack.children('.card').length < parseInt(limit, 10)) {
      stack.addClass('stack-hover');
    }
  });
  droppableStacks.on('dragleave', function (event) {
    $(this).removeClass('stack-hover');
  });
  droppableStacks.on('dragend', function (event) {
    game.find('.stack').removeClass('stack-hover');
  });
  droppableStacks.on('drop', function (event) {
    event.preventDefault();
    var stack = $(this);
    var limit = stack.data('limit');
    if (!limit ||
        stack.children('.card').length < parseInt(limit, 10)) {
      setTimeout(function () {
        var card = draggable.detach();
        stack.append(card);
        draggable = null;
      }, 0);
    }
  });

  playArea.on('dragover', function (event) {
    event.preventDefault();
    if (draggable.is('.room')) {
      event.originalEvent.dataTransfer.dropEffect = 'move';
    }
  });
  playArea.on('drop', function (event) {
    event.preventDefault();
    if (draggable.is('.room')) {
      setTimeout(function () {
        var card = draggable.detach();
        var originalEvent = event.originalEvent;
        var x = originalEvent.layerX - draggableGrabPos.x;
        var y = originalEvent.layerY - draggableGrabPos.y;
        if (potentialRoomDrops.length > 0) {
          // find the closest
          var dist = Number.MAX_VALUE;
          var dropx = x;
          var dropy = y;
          for (var i=0; i < potentialRoomDrops.length; i++) {
            var drop = potentialRoomDrops[i];
            var left = x - drop.left;
            var top  = y - drop.top;
            var testDist = Math.sqrt(left*left + top*top);
            if (testDist < dist) {
              dist = testDist;
              dropx = drop.left;
              dropy = drop.top;
            }
          }
          x = dropx;
          y = dropy;
        }
        card.css({left: x, top: y});
        playArea.append(card);
        draggable = null;
        updatePotentialRoomDrops();
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

  var updatePotentialRoomDrops = function () {
    potentialRoomDrops = [];
    var rooms = playArea.find('.room');
    if (rooms.length == 0) {
      return;
    }

    var takenDrops = [];
    // reversed because they're rotated
    var width  = rooms.first().height();
    var height = rooms.first().width();
    rooms.each(function (i, room) {
      var pos = $(room).position();
      takenDrops.push(pos);
      potentialRoomDrops.push({
        left: pos.left - width,
        top:  pos.top
      });
      potentialRoomDrops.push({
        left: pos.left + width,
        top:  pos.top
      });
      potentialRoomDrops.push({
        left: pos.left,
        top:  pos.top - height
      });
      potentialRoomDrops.push({
        left: pos.left,
        top:  pos.top + height
      });
    });

    // remove the taken spaces
    potentialRoomDrops =
      $.grep(potentialRoomDrops, function (drop, i) {
        for (var j = 0; j < takenDrops.length; j++) {
          if (takenDrops[j].left === drop.left &&
              takenDrops[j].top  === drop.top) {
            return false;
          }
        }
        return true;
      });
  };

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

  var shuffle = function (stack) {
    var cards = stack.children('.card');
    while (cards.length) {
      stack.append(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
    }
  };

  var startGame = function () {
    $('#game').attr('data-level', 0);

    // hide the amulet
    $('.amulet').appendTo('.unused-random');

    // put all the character cards back in place
    $('.card.character').appendTo('.stack.characters');
    shuffle($('.stack.characters'));
    $('.card.character:first').appendTo('.stack.player-character');

    // put all the power cards back in place
    $('.card.power').appendTo('.stack.powers');
    shuffle($('.stack.powers'));

    var powers = $('.stack.powers').children('.card.power');
    var handStacks = $('.player-hand').children();
    for (var i=0; i < 9; i++) {
      powers.eq(i).appendTo(handStacks.eq(i));
    }

    nextLevel();
  };

  var nextLevel = function () {
    var level = $('#game').attr('data-level');
    level++;
    if (level > 8) {
      return;
    }
    $('#game').attr('data-level', level);
    var unusedRooms = $('.unused-rooms');
    var roomStack = $('.stack.rooms');
    // move all rooms back to the unused rooms pile and shuffle
    $('.room').appendTo(unusedRooms).css({top:0, left:0});
    shuffle(unusedRooms);
    var roomCount = 8;
    // if we're on level 8 we need the pit of darkness
    if (level == 8) {
      roomCount--;
      $('.room.pit-of-darkness').appendTo(roomStack);
      $('.amulet').appendTo('.other');
    }
    // always need the mystic portal
    $('.room.mystic-portal').appendTo(roomStack);
    var rooms = $('.room').not('.pit-of-darkness,.mystic-portal');
    for (var i=0; i < roomCount; i++) {
      rooms.eq(i).appendTo(roomStack);
    }
    shuffle(roomStack);
  };

  startGame();

  $('input#shuffle').on('click', function (e) {
    e.preventDefault();
    // move all power cards from the discard back to the deck
    $('.stack.discard .card.power').appendTo('.stack.powers');
    // shuffle
    shuffle($('.stack.powers'));
  });

  $('input#next-level').on('click', function (e) {
    e.preventDefault();
    nextLevel();
  });

});
