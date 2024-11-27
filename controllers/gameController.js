const Player = require("../models/playerModel")
const cards = require("../utils/cards")
const Room = require("../models/roomModel")
const WebSocket = require("ws");
const broadcastToRoom = (wss, roomId, message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify(message));
        }
    });
};
const GameController = {
    handleTossSocket: async (roomId, tossCardId, wss) => {
        const players = await Player.getPlayersInRoom(roomId);
        if (!players || players.length === 0) throw new Error(`No players found in room ${roomId}`);
        const tossCard = cards.find((card) => card.id === tossCardId);
        if (!tossCard) throw new Error(`Invalid tossCardId: ${tossCardId}`);

        const shuffleDeck = () => {
            const deck = [...cards];
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            return deck;
        };

        let deck = shuffleDeck();
        const playerCards = {};
        let tossWinner = null;

        // Track whether each player has received a card and track the distributed card IDs
let playersReceivedCard = new Set();
let distributedCardIds = new Set();

while (deck.length > 0 && playersReceivedCard.size < players.length && !tossWinner) {
    for (const player of players) {
        // Skip the player if they have already received a card
        if (playersReceivedCard.has(player.user_id)) continue;

        const card = deck.pop();
        if (!card || distributedCardIds.has(card.value)) continue; // Skip if the card has already been distributed

        // Assign the card to the player
        if (!playerCards[player.user_id]) {
            playerCards[player.user_id] = [];
        }
        playerCards[player.user_id].push(card.id);

        // Mark this player as having received a card and the card as distributed
        playersReceivedCard.add(player.user_id);
        distributedCardIds.add(card.id);

        // Broadcast card distribution
        broadcastToRoom(wss, roomId, {
            event: "cardDistribution",
            payload: { userId: player.user_id, card },
        });
    }
}
  tossWinner = Object.keys(playerCards).reduce((winner, playerId) => {
       console.log("winnerwinner",winner)
            // Get the card ids for this player
            const playerCardIds = playerCards[playerId];
            if (playerCardIds.length > 0) {
                // Retrieve the card details based on the id
                const playerCard = cards.find(card => card.id === playerCardIds[0]); // Assuming only one card is distributed
          console.log("playerCardplayerCard",playerCard)
                if (winner === null || playerCard.value > winner.value) {
                    return { user_id: playerId, value: playerCard.value };
                }
            }
            return winner;
        }, null);

        if (!tossWinner) throw new Error("No toss winner found, re-running toss");
        console.log(" await Room.updateTossWinner(roomId, tossWinner);",tossWinner)
        await Room.updateTossWinner(roomId, tossWinner);
         // Broadcast toss result
        broadcastToRoom(wss, roomId, {
            event: "tossResult",
            payload: { tossWinner, playerCards },
        });
         // Countdown before gameCardDistribution
        await new Promise((resolve) => {
            let countdown = 5;
            const interval = setInterval(() => {
                if (countdown > 0) {
                    broadcastToRoom(wss, roomId, {
                        event: "timerUpdate",
                        payload: { taskId:2 , countdown },
                    });
                    countdown -= 1;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
        deck = shuffleDeck();
        const gameCards = {};

        for (const player of players) {
            if (deck.length >= 3) {
                gameCards[player.user_id] = deck.splice(0, 3).map((card) => {
                    broadcastToRoom(wss, roomId, {
                        event: "gameCardDistribution",
                        viewCardStatus:1,
                        payload: { userId: player.user_id, card },
                    });
                    return card.id;
                });
            }
        }

        await Player.updateTurn(roomId, tossWinner, true);

       
        console.log(`Toss winner: ${tossWinner}`);
    },
};

module.exports = GameController;


