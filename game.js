$(function () {

  // save for new game
  var rawHTML = $('#game').html();

  var game, cards, stacks, playArea;

  var draggable;
  var draggableGrabPos = {};

  var potentialRoomDrops = [];

  var isTouchscreen = function () {
    return /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
  };

  // cache all the things
  var updateGameSelectors = function () {
    game     = $('#game');
    cards    = game.find('.card');
    stacks   = game.find('.stack');
    playArea = game.find('.play-area');

    // set all non misc cards to draggable
    cards.not('.misc').attr('draggable', 'true');
    // fruits, arrows, poison and amulet are also draggable
    cards.filter('.fruits,.arrows,.poison,.amulet').attr('draggable', 'true');
  };

  var stackLimitNotReached = function (stack) {
    var limit = stack.attr('data-limit');
    return (limit === undefined || parseInt(limit, 10) > 0);
  };

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

      card.siblings('.select-controls').addClass('selected');
    }
  };

  var unselectCards = function () {
    game.find('.selected').removeClass('selected').
      css({
        backgroundSize:     '',
        backgroundPosition: ''
      });
    game.find('.select-controls').removeClass('selected');
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

  var moveCardToStack = function (card, stack) {
    if (stackLimitNotReached(stack)) {
      var limit = stack.attr('data-limit');
      if (limit !== undefined) {
        stack.attr('data-limit', parseInt(limit, 10) - 1);
      }

      var fromStack = card.closest('.stack');
      var fromLimit = fromStack.attr('data-limit');
      if (fromLimit !== undefined) {
        fromStack.attr('data-limit', parseInt(fromLimit, 10) + 1);
      }

      card.detach();
      stack.append(card);
      stack.trigger('card-drop', [card]);
    }
  };

  var shuffle = function (stack) {
    var cards = stack.children('.card');
    while (cards.length) {
      stack.append(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
    }
  };

  var resetGame = function () {
    // reset gold
    var goldStack = $('.stack.gold');
    goldStack.attr('data-gold-tens', '');
    goldStack.attr('data-gold-ones', 0);

    // reset fruit
    $('.card.fruits').removeClass('rot-90 rot-180').addClass('rot-270');

    // reset arrows
    $('.card.arrows')
      .removeClass('rot-90 rot-180 rot-270')
      .appendTo('.inventory.other');

    // reset poison
    $('.card.poison').appendTo('.inventory.other');

    // reset the upgrade cards
    $('.card.upgrade').attr('data-upgrade', 0).appendTo('.unused-random');

    // put all the character cards back in place
    $('.card.character').appendTo('.stack.characters');

    // put all the power cards back in place
    var powerStack = $('.stack.powers');
    $('.card.power').each(function (_, power) {
      moveCardToStack($(power), powerStack);
    })

    // hide the amulet
    $('.amulet').appendTo('.unused-random');

    // remove extra HP
    $('.stack.extra-hp').attr('data-limit', 0);
  };

  var newGame = function () {
    // remove any previously set event handlers
    removeEventHandlers();

    // reset to the raw html so we get any updates
    game.html(rawHTML);

    updateGameSelectors();
    setupEventHandlers();

    potentialRoomDrops = [];

    game.attr('data-level', 0);

    // shuffle and select a character
    shuffle($('.stack.characters'));
    $('.card.character:first').appendTo('.stack.player-character');

    // shuffle the power stack
    var powerStack = $('.stack.powers');
    shuffle(powerStack);

    // draw 9 cards for the player's hand
    var powers = powerStack.children('.card.power');
    var handStacks = $('.player-hand').children();
    for (var i=0; i < 9; i++) {
      moveCardToStack(powers.eq(i), handStacks.eq(i));
    }

    // set up the level
    nextLevel();
  };

  var setupGameSaveCallback = function () {
    // save game after mutation events stop for a second
    var saveGameTimeout = null;
    var observer = new MutationObserver(function(mutations) {
      if (saveGameTimeout) {
        // already have one running, clear it
        window.clearTimeout(saveGameTimeout);
      }
      saveGameTimeout = window.setTimeout(saveGame, 1000);
    });

    observer.observe(game[0], {
      attributes:    true,
      childList:     true,
      subtree:       true,
      attributeOldValue: true
    });
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
    $('.room')
      .appendTo(unusedRooms)
      .css({top:0, left:0})
      .removeClass('exhausted');
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
    potentialRoomDrops = [];
  };

  var upgradeCharacter = function (attribute) {
    var card = $('.card.upgrade-'+attribute);
    card.appendTo('.stack.player-character');
    var plus = parseInt(card.attr('data-upgrade'), 10);
    if (plus < 4) {
      card.attr('data-upgrade', plus + 1);
    }
  };

  var saveGame = function () {
    console.log('saveGame');
    localStorage.game = game.html();
    localStorage.gameLevel = game.attr('data-level');
  };

  var loadGame = function () {
    $('#game').html(localStorage.game);
    $('#game').attr('data-level', localStorage.gameLevel);
    updateGameSelectors();
    updatePotentialRoomDrops();
    setupEventHandlers();
  };

  var setupEventHandlers = function () {

    // card drag handling

    cards.on('dragstart', function (event) {
      draggable = $(this);
      draggable.addClass('being-dragged');
      game.addClass('drag-in-progress');
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
    game.on('dragend', function (event) {
      game.removeClass('drag-in-progress');
      $('.being-dragged').removeClass('being-dragged');
      game.find('.stack').removeClass('stack-hover');
    });

    // Stack drag-drop handling

    var droppableStacks = stacks.not('.non-drop');

    droppableStacks.on('dragover', function (event) {
      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = 'move';
    });
    droppableStacks.on('dragenter', function (event) {
      var stack = $(this);
      if (stackLimitNotReached(stack)) {
        stack.addClass('stack-hover');
      }
    });
    droppableStacks.on('dragleave', function (event) {
      $(this).removeClass('stack-hover');
    });
    droppableStacks.on('drop', function (event) {
      event.preventDefault();
      var stack = $(this);
      setTimeout(function () {
        moveCardToStack(draggable, stack);
        draggable = null;
      }, 0);
    });

    // Room Play Area drag/drop

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
          // some magic numbers that look right on an iPad drop
          var cardX = draggableGrabPos.x || 39;
          var cardY = draggableGrabPos.y || 55;
          var x = originalEvent.offsetX - cardX;
          var y = originalEvent.offsetY - cardY;
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

    // Card clicks

    game.on('click', '.card:not(.selected)', function (event) {
      var card = $(this);
      event.stopPropagation();
      unselectCards();
      selectCard(card);
    });

    game.on('click', function (event) {
      event.preventDefault();
      unselectCards();
    });

    // Simulate clicks on touch screens

    var touchTarget;
    var touchStartTime;

    game.on('touchstart', function (event) {
      var originalEvent = event.originalEvent;
      touchTarget = originalEvent.target;
      touchStartTime = originalEvent.timeStamp;
    });

    game.on('touchend', function (event) {
      var originalEvent = event.originalEvent;
      if (originalEvent.target === touchTarget &&
          originalEvent.timeStamp - touchStartTime < 600) { // millis
        $(touchTarget).trigger('click');
      }
      touchTarget = null;
      touchStartTime = null;
    });

    // Custom stack card-drop events

    $('.player-character').on('card-drop', function (e, card) {
      if (card.hasClass('amulet')) {
        // amulet gives you an extra HP
        $('.stack.extra-hp').attr('data-limit', 1);
      }
    });

    $('.inventory').on('card-drop', function (e, card) {
      if (card.hasClass('power')) {
        card.addClass('face-down');
      }
    });

    $('.discard').on('card-drop', function (e, card) {
      card.removeClass('face-down rot-90 rot-180 rot-270');
    });

    // Button Clicks

    $('input#shuffle').on('click', function (e) {
      e.preventDefault();
      // move all power cards from the discard back to the deck
      $('.stack.discard .card.power').appendTo('.stack.powers');
      // shuffle
      shuffle($('.stack.powers'));
    });

    $('input#gold-up').on('click', function (e) {
      e.preventDefault();
      updateGold(+1);
    });

    $('input#gold-down').on('click', function (e) {
      e.preventDefault();
      updateGold(-1);
    });

    $.each(['str', 'int', 'agl'], function (_, attribute) {
      $('input#upgrade-'+attribute).on('click', function (e) {
        e.preventDefault();
        upgradeCharacter(attribute);
      });
    });

    $('input#exhaust-room').on('click', function (e) {
      e.preventDefault();
      $('.room.selected').addClass('exhausted');
    });

    $('input#discard-power-play').on('click', function (e) {
      e.preventDefault();
      $('.power-play-area .card').appendTo('.discard');
    });

    $('input#rotate-left').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      rotateSelectedCard(-1);
    });

    $('input#rotate-right').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      rotateSelectedCard(+1);
    });

    $('input#reveal').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('.card.selected').removeClass('face-down');
    });
  };

  var removeEventHandlers = function () {
    game.find('input,card,stack').off();
    game.off();
  };

  // set up event handlers that are not tied to the
  // game field, so we shouldn't apply them more than once.
  var setupNonGameElementEventHandlers = function () {
    // Key Handlers

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

    $('input#new-game').on('click', function (e) {
      e.preventDefault();
      if (confirm('Start new Game?')) {
        newGame();
      }
    });

    $('input#next-level').on('click', function (e) {
      e.preventDefault();
      nextLevel();
    });
  };

  if (localStorage.game) {
    loadGame();
  } else {
    newGame();
  }

  setupNonGameElementEventHandlers();
  setupGameSaveCallback();
});
