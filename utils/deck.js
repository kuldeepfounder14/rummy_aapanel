const suits = { S: 4, H: 3, C: 2, D: 1 };
const ranks = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
const Deck = {
    createDeck: () => {
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(`${rank} of ${suit}`);
            }
        }
        return deck;
    },

    shuffleDeck: (deck) => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    },

    // Draw a card without modifying the deck
    peekRandomCard: (deck) => {
        if (deck.length > 0) {
            const index = Math.floor(Math.random() * deck.length);
            return deck[index];  // Don't remove the card from the deck
        } else {
            console.log("Deck is empty");
            return null; // No card to draw
        }
    },

    drawCard: (deck) => {
        if (deck.length > 0) {
            return deck.pop();
        } else {
            console.log("Deck is empty");
            return null; // No card to draw
        }
    },

    drawMultipleCards: (deck, count) => {
        if (deck.length >= count) {
            return Array.from({ length: count }, () => Deck.drawCard(deck));
        } else {
            console.log("Not enough cards left in the deck");
            return []; // Return an empty array if there aren't enough cards
        }
    },
};

module.exports = Deck;