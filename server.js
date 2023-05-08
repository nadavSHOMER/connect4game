
let http = require('http');
let url = require('url');
let st = require('./server_tools');
let onwin = false;



http.createServer((req, res) => {
    let q = url.parse(req.url, true);
    let path = q.pathname;
    if (path.startsWith("/api")) {
        path = path.substring(4);
        let username = q.query.username;
        let password = q.query.password;
        if (!username || !password) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("username and password are required");
            return;
        }
        if (path.startsWith("/signup")) {
            st.query("INSERT INTO users(username, password) VALUES(?,?)", [username, password], (result, err) => {
                if (err) {
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end("taken");
                    return;
                }
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("ok");
            })
        }
        else if (path.startsWith("/login")) {
            validateUser(username, password, (isValid) => {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end(isValid ? "ok" : "invalid");
            });
        }
        //updating lobby 

        else if (path.startsWith("/get_lobby")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    st.query("UPDATE users SET lobby=? WHERE username=? AND NOT lobby=-1", [Date.now(), username], (result, err) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "text/plain" });
                            res.end("");
                            return;
                        }
                        st.query("SELECT username FROM users WHERE ? - lobby < 2000", [Date.now()], (result, err) => {
                            if (err) {
                                res.writeHead(500, { "Content-Type": "text/plain" });
                                res.end("");
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result));
                        });

                    });
                }
            });
        }
        //return the id game if =1 if =-1 not returning
        else if (path.startsWith("/get_game_id")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    st.query("SELECT id FROM games WHERE (player1=? OR player2=?) AND active=1", [username, username], (result, err) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "text/plain" });
                            res.end("");
                            return;
                        }
                        if (result.length >= 1) {
                            let gameId = result[0].id;
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end(gameId + "");
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end("-1");
                        }
                    });
                }
            });
        }
        //if the lobby =-1 the player is no longer in the lobby if 2 rows where effected >> new game in database
        else if (path.startsWith("/start_game")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    onwin = false;
                    let partner = q.query.partner;
                    if (!partner) return;
                    st.query("UPDATE users SET lobby = -1 WHERE username IN (?,?) AND ?-lobby<2000", [username, partner, Date.now()], (result, err) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "text/plain" });
                            res.end("");
                            return;
                        }
                        if (result.affectedRows == 2) {
                            st.query("INSERT INTO games(player1,player2) VALUES (?,?)", [username, partner], (result, err) => {
                                if (err) {
                                    res.writeHead(500, { "Content-Type": "text/plain" });
                                    res.end("");
                                    return;
                                }
                                res.writeHead(200, { 'Content-Type': 'text/plain' });
                                res.end("ok");
                            });
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end("error");
                        }
                    });
                }
            });
        }
        //leave game ?
        else if (path.startsWith("/leave_game")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    st.query("SELECT id,player1,player2 FROM games WHERE (player1=? OR player2=?) AND active=1", [username, username], (result, err) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "text/plain" });
                            res.end("");
                            return;
                        }
                        if (result.length >= 1) {
                            let gameId = result[0].id;
                            let partner;
                            if (result[0].player1 == username) {
                                partner = result[0].player2;
                            } else {
                                partner = result[0].player1;
                            }
                            st.query("UPDATE games SET active=0 WHERE id=? AND active=1", [gameId], (result, err) => {
                                if (err) {
                                    res.writeHead(500, { "Content-Type": "text/plain" });
                                    res.end("");
                                    return;
                                }
                                if (result.affectedRows == 1) {
                                    st.query("UPDATE users SET lobby=0 WHERE username IN (?,?)", [username, partner], (result, err) => {
                                        if (err) {
                                            res.writeHead(500, { "Content-Type": "text/plain" });
                                            res.end("");
                                            return;
                                        }
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        res.end("ok");
                                    });
                                } else if (result.affectedRows == 0) {
                                    st.query("UPDATE users SET lobby=0 WHERE username = ?", [username], (result, err) => {
                                        if (err) {
                                            res.writeHead(500, { "Content-Type": "text/plain" });
                                            res.end("");
                                            return;
                                        }
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        res.end("ok");
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        //finding out the game status 
        else if (path.startsWith("/get_game_status")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    let gameId = q.query.id;
                    if (!gameId) return;
                    st.query("SELECT player1,player2,active,cell1,cell2,cell3,cell4,cell5,cell6,cell7,cell8,cell9,cell10,cell11,cell12,cell13,cell14,cell15,cell16,cell17,cell18,cell19,cell20,cell21,cell22,cell23,cell24,cell25,cell26,cell27,cell28,cell29,cell30,cell31,cell32,cell33,cell34,cell35,cell36,cell37,cell38,cell39,cell40,cell41,cell42 FROM games WHERE id=? AND (player1=? OR player2=?)", [gameId, username, username], (result, err) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "text/plain" });
                            res.end("");
                            return;
                        }
                        if (result.length == 1) {
                            let gameStatus = {
                                id: gameId,
                                player1: result[0].player1,
                                player2: result[0].player2,
                                active: result[0].active[0] == 1,
                                board: [result[0].cell1, result[0].cell2, result[0].cell3, result[0].cell4, result[0].cell5, result[0].cell6, result[0].cell7, result[0].cell8, result[0].cell9, result[0].cell10, result[0].cell11, result[0].cell12, result[0].cell13, result[0].cell14, result[0].cell15, result[0].cell16, result[0].cell17, result[0].cell18, result[0].cell19, result[0].cell20, result[0].cell21, result[0].cell22, result[0].cell23, result[0].cell24, result[0].cell25, result[0].cell26, result[0].cell27, result[0].cell28, result[0].cell29, result[0].cell30, result[0].cell31, result[0].cell32, result[0].cell33, result[0].cell34, result[0].cell35, result[0].cell36, result[0].cell37, result[0].cell38, result[0].cell39, result[0].cell40, result[0].cell41, result[0].cell42],
                                win: onwin
                            };

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(gameStatus));
                        }
                    });
                }
            });
        }

        else if (path.startsWith("/play_cell")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    let cell = q.query.cell;
                    let gameId = q.query.id;
                    if (cell && gameId) {
                        cell = parseInt(cell);
                        gameId = parseInt(gameId);
                        if (isNaN(cell) || isNaN(gameId) || cell < 0 || cell > 41) {
                            res.end("");
                            return;
                        }
                        st.query("SELECT player1,player2,cell1,cell2,cell3,cell4,cell5,cell6,cell7,cell8,cell9,cell10,cell11,cell12,cell13,cell14,cell15,cell16,cell17,cell18,cell19,cell20,cell21,cell22,cell23,cell24,cell25,cell26,cell27,cell28,cell29,cell30,cell31,cell32,cell33,cell34,cell35,cell36,cell37,cell38,cell39,cell40,cell41,cell42 FROM games WHERE id=? AND active=1", [gameId], (result, err) => {
                            if (err) {
                                res.end("");
                                return;
                            }
                            if (result.length == 1) {
                                let player1 = result[0].player1;
                                let player2 = result[0].player2;
                                if (player1 == username || player2 == username) {
                                    let blueOrRed = player1 == username ? 1 : 2; //players
                                    let board = [result[0].cell1, result[0].cell2, result[0].cell3, result[0].cell4, result[0].cell5, result[0].cell6, result[0].cell7, result[0].cell8, result[0].cell9, result[0].cell10, result[0].cell11, result[0].cell12, result[0].cell13, result[0].cell14, result[0].cell15, result[0].cell16, result[0].cell17, result[0].cell18, result[0].cell19, result[0].cell20, result[0].cell21, result[0].cell22, result[0].cell23, result[0].cell24, result[0].cell25, result[0].cell26, result[0].cell27, result[0].cell28, result[0].cell29, result[0].cell30, result[0].cell31, result[0].cell32, result[0].cell33, result[0].cell34, result[0].cell35, result[0].cell36, result[0].cell37, result[0].cell38, result[0].cell39, result[0].cell40, result[0].cell41, result[0].cell42];
                                    let countBlue = 0;
                                    for (let i = 0; i < 42; i++) {
                                        if (board[i] != 0) countBlue++;
                                    }
                                    let isBlueTurn = countBlue % 2 == 0;
                                    //blue or red turn
                                    if (board[cell] == 0 && ((isBlueTurn && blueOrRed == 1) || (!isBlueTurn && blueOrRed == 2))) {
                                        st.query("UPDATE games SET cell" + (cell + 1) + "=" + BlueOrRed + " WHERE id=?", [gameId], (result, err) => {
                                            if (err) {
                                                res.end("");
                                                return;
                                            }
                                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                                            res.end("ok");
                                        });
                                    } else {
                                        res.end("oops");
                                        return;
                                    }
                                }
                            } else {
                                res.end("ohoh");
                                return;
                            }
                        });
                    } else {
                        res.end();
                        return;
                    }
                }
            });
        }

        else if (path.startsWith("/win")) {
            validateUser(username, password, (isValid) => {
                if (isValid) {
                    let gameId = q.query.id;
                    if (gameId) {
                        gameId = parseInt(gameId);
                        if (isNaN(gameId)) {
                            res.end("");
                            return;
                        }
                        st.query("SELECT player1,player2,cell1,cell2,cell3,cell4,cell5,cell6,cell7,cell8,cell9,cell10,cell11,cell12,cell13,cell14,cell15,cell16,cell17,cell18,cell19,cell20,cell21,cell22,cell23,cell24,cell25,cell26,cell27,cell28,cell29,cell30,cell31,cell32,cell33,cell34,cell35,cell36,cell37,cell38,cell39,cell40,cell41,cell42 FROM games WHERE id=? AND active=1", [gameId], (result, err) => {
                            if (err) {
                                res.end("");
                                return;
                            }
                            if (result.length == 1) {
                                let player1 = result[0].player1;
                                let player2 = result[0].player2;
                                if (player1 == username || player2 == username) {
                                    let board = [result[0].cell1, result[0].cell2, result[0].cell3, result[0].cell4, result[0].cell5, result[0].cell6, result[0].cell7, result[0].cell8, result[0].cell9, result[0].cell10, result[0].cell11, result[0].cell12, result[0].cell13, result[0].cell14, result[0].cell15, result[0].cell16, result[0].cell17, result[0].cell18, result[0].cell19, result[0].cell20, result[0].cell21, result[0].cell22, result[0].cell23, result[0].cell24, result[0].cell25, result[0].cell26, result[0].cell27, result[0].cell28, result[0].cell29, result[0].cell30, result[0].cell31, result[0].cell32, result[0].cell33, result[0].cell34, result[0].cell35, result[0].cell36, result[0].cell37, result[0].cell38, result[0].cell39, result[0].cell40, result[0].cell41, result[0].cell42];
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify(checkWin(board, player1, player2)));
                                }


                            } else {
                                res.end("ohoh");
                                return;
                            }
                        });
                    } else {
                        res.end();
                        return;
                    }
                }
            });
        }


    } else {//serve static files
        st.serveStaticFile(path, res);
    }
}).listen(8080);



function validateUser(username, password, callback) {
    st.query("SELECT COUNT(*) AS count FROM users WHERE username=? AND BINARY password=?", [username, password], (result, err) => {
        if (err) {
            callback(false);
            return;
        }
        callback(result[0].count == 1);
    });
}

function checkWin(board, player1, player2) {
    let board2d = [
        board.slice(0, 7),
        board.slice(7, 14),
        board.slice(14, 21),
        board.slice(21, 28),
        board.slice(28, 35),
        board.slice(35)
    ];
    //Check rows
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (
                board2d[row][col] != "" &&
                board2d[row][col] == board2d[row][col + 1] &&
                board2d[row][col] == board2d[row][col + 2] &&
                board2d[row][col] == board2d[row][col + 3]
            ) {
                onwin = true;
                if (board2d[row][col] == 1) {
                    return player1;
                } else {
                    return player2;
                }
            }
        }
    }
    // check columns
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 3; row++) {
            if (
                board2d[row][col] != "" &&
                board2d[row][col] == board2d[row + 1][col] &&
                board2d[row][col] == board2d[row + 2][col] &&
                board2d[row][col] == board2d[row + 3][col]
            ) {
                onwin = true;
                if (board2d[row][col] == 1) {
                    return player1;
                } else {
                    return player2;
                }
            }
        }
    }
    // check diagonals (bottom-left to top-right)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (
                board2d[row][col] != "" &&
                board2d[row][col] == board2d[row + 1][col + 1] &&
                board2d[row][col] == board2d[row + 2][col + 2] &&
                board2d[row][col] == board2d[row + 3][col + 3]
            ) {
                onwin = true;
                if (board2d[row][col] == 1) {
                    return player1;
                } else {
                    return player2;
                }
            }
        }
    }
    // Check diagonals (top-left to bottom-right)
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (
                board2d[row][col] != "" &&
                board2d[row][col] == board2d[row - 1][col + 1] &&
                board2d[row][col] == board2d[row - 2][col + 2] &&
                board2d[row][col] == board2d[row - 3][col + 3]
            ) {
                onwin = true;
                if (board2d[row][col] == 1) {
                    return player1;
                } else {
                    return player2;
                }
            }
        }
    }

    // if no win
    return false;

}