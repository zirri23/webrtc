var util = require('util');

exports.Rank = {
  King:  {name: 'king',  stringName: 'king',  value: 13},
  Queen: {name: 'queen', stringName: 'queen', value: 12},
  Jack:  {name: 'jack',  stringName: 'jack',  value: 11},
  Ace:   {name: 'ace',   stringName: 'ace',   value: 14},
  Ten:   {name: '10',    stringName: 'ten',   value: 10},
  Nine:  {name: '9',     stringName: 'nine',  value:  9},
  Eight: {name: '8',     stringName: 'eight', value:  8},
  Seven: {name: '7',     stringName: 'seven', value:  7},
  Six:   {name: '6',     stringName: 'six',   value:  6},
  Five:  {name: '5',     stringName: 'five',  value:  5},
  Four:  {name: '4',     stringName: 'four',  value:  4},
  Three: {name: '3',     stringName: 'three', value:  3},
  Two:   {name: '2',     stringName: 'two',   value:  2},
};

exports.Suit = {
  Spades:   "spades",
  Hearts:   "hearts",
  Diamonds: "diamonds",
  Clubs:    "clubs"
};

var Card = function(rank, suit) {
  this.rank = rank;
  this.suit = suit;
};

Card.prototype = {  
  fileFormat: function() {
    return util.format('%s_of_%s', this.rank.name, this.suit);
  },
  toString: function() {
    return util.format('%s of %s', this.rank.name, this.suit);
  },
  equals: function(otherCard) {
    return this.rank === otherCard.rank && this.suit === otherCard.suit;
  },
  beats: function(otherCard) {
    return this.suit === otherCard.suit && this.rank.value > otherCard.rank.value;
  }
};

exports.Card = {};
var deck = [];
for (rank in exports.Rank) {
  for (suit in exports.Suit) {
    var card = new Card(exports.Rank[rank], exports.Suit[suit]);
    exports.Card[card.fileFormat()] = card;
    deck.push(card);
  }
}

exports.valueOf = function(fileFormat) {
  return exports.Card[fileFormat];
};

exports.Deck = function() {
  return deck.slice(0);
};

exports.getSparDeck = function() {
  var deck = exports.Deck();
  var sparDeck = [];
  for (var i = 0; i < deck.length; i++) {
    if (deck[i].rank.value > 5 && deck[i] != exports.Card['ace_of_spades']) {
      sparDeck.push(deck[i].fileFormat());
    }
  }
  return shuffle(sparDeck);
};

function shuffle(o){
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};
