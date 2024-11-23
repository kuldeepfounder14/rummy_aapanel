const Player = require("../models/playerModel")
const cards = require("../utils/cards")
const Room = require("../models/roomModel")
const WebSocket = require("ws");

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

        while (deck.length > 0 && !tossWinner) {
            for (const player of players) {
                const card = deck.pop();
                if (!card) continue;

                if (!playerCards[player.user_id]) {
                    playerCards[player.user_id] = [];
                }
                playerCards[player.user_id].push(card.id);

                // Broadcast card distribution
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(
                            JSON.stringify({
                                event: "cardDistribution",
                                payload: { userId: player.user_id, card },
                            })
                        );
                    }
                });

                if (card.id === tossCardId && !tossWinner) {
                    tossWinner = player.user_id;
                    break;
                }
            }
        }

        if (!tossWinner) throw new Error("No toss winner found, re-running toss");

        await Room.updateTossWinner(roomId, tossWinner);
         // Broadcast toss result
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        event: "tossResult",
                        payload: { tossWinner, playerCards },
                    })
                );
            }
        });

        deck = shuffleDeck();
        const gameCards = {};

        for (const player of players) {
            if (deck.length >= 3) {
                gameCards[player.user_id] = deck.splice(0, 3).map((card) => {
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(
                                JSON.stringify({
                                    event: "gameCardDistribution",
                                    payload: { userId: player.user_id, card },
                                })
                            );
                        }
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


