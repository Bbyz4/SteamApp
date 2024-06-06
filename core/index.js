const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

//const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//TU MUSISZ DAĆ LOKALNE SWOJE KONTO KTORE MA DOSTEP DO NASZEJ BAZY, MOŻE BYĆ POSTGRES
const pool = new Pool({
    user: 'aaa',
    host: 'localhost',
    database: 'SteamProject',
    password: 'bbb',
    port: 5433,
});

//TUTAJ MOŻNA DAWAĆ WSZYSTKIE REQUESTY DO BAZY, JAKIEŚ KWERENDY POTRZEBNE DO ZWRACANYCH WYNIKÓW

app.post('/signup', async (req, res) => {
    const { username, password, email, name, surname, date_of_birth, country } = req.body;

    try {

        const beginQuery = {
            text: `BEGIN`
        };

        const AAAAAAAAAAAAAAAAA = await pool.query(beginQuery);


        await pool.query('ALTER TABLE uzytkownicy DROP CONSTRAINT IF EXISTS sprawdz_czy_user_ma_ustawiony_poczatkowy_kraj');

        const insertUserQuery = {
            text: 'INSERT INTO uzytkownicy (nazwa, email, data_zalozenia, haslo, imie, nazwisko, data_urodzenia) VALUES ($1, $3, NOW(), $2, $4, $5, $6) RETURNING id_uzytkownika',
            values: [username, password, email, name, surname, date_of_birth],
        };

        const { rows } = await pool.query(insertUserQuery);
        const userId = rows[0].id_uzytkownika;

        const countryCodeQuery = {
            text: `SELECT k.kod_kraju
                   FROM kraje k
                   WHERE k.nazwa = $1`,
            values: [country],
        };

        const countryQueryResult = await pool.query(countryCodeQuery);
        const countryCode = countryQueryResult.rows[0].kod_kraju;

        const insertCountryQuery = {
            text: 'INSERT INTO kraje_uzytkownicy (id_uzytkownika, kod_kraju, data_zmiany) VALUES ($1, $2, NOW())',
            values: [userId, countryCode], 
        };

        await pool.query(insertCountryQuery);

        await pool.query('ALTER TABLE uzytkownicy ADD CONSTRAINT sprawdz_czy_user_ma_ustawiony_poczatkowy_kraj CHECK(sprawdz_czy_user_ma_ustawiony_poczatkowy_kraj(id_uzytkownika, data_zalozenia))');

        const commitQuery = {
            text: `COMMIT`
        };

        const AAAAAAAAAAAABAAAAA = await pool.query(commitQuery);

        res.sendStatus(201);
    } catch (error) {

        const commitQuery = {
            text: `COMMIT`
        };

        const AAAAAAAAAAAABAAAAA = await pool.query(commitQuery);

        console.error('Error:', error);
        res.sendStatus(500);
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = {
            text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const result = await pool.query(query);

        if (result.rowCount === 0) {
            res.sendStatus(401);
            return;
        }

        const user = result.rows[0];
        const [hashedPassword, salt] = user.haslo.split(' ');

        const hashedAttempt = await bcrypt.hash(password, salt);

        if (hashedPassword === hashedAttempt) {
            res.sendStatus(200); 
        } else {
            res.sendStatus(401); 
        }
    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(500);
    }
});

app.post('/search-game', async (req, res) => {
    console.log('Search game request received:', req.body); // Logowanie

    const { gameName, username } = req.body;

    try {
        const query = {
            text: 'SELECT * FROM gry WHERE nazwa = $1',
            values: [gameName],
        };
        console.log(query);        
        const result = await pool.query(query);
        console.log(result);
        if (result.rowCount === 1) {
            console.log('Game found:', result.rows[0]); // Logowanie
            const game1 = result.rows[0];

            const usQuery = {
                text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
                values: [username],
            };
    
            const resultAAA = await pool.query(usQuery);
    
            const userID = resultAAA.rows[0].id_uzytkownika

            const query2 = {
                text: `SELECT ROUND(oblicz_koszt_gry_w_danej_walucie($2, jaka_walute_mial_dany_kraj(jaki_kraj_mial_dany_user($1::INTEGER, NOW()::timestamp), NOW()::timestamp), NOW()::timestamp) * zwroc_kurs_waluty_na_dolary(jaka_walute_mial_dany_kraj(jaki_kraj_mial_dany_user($1::INTEGER, NOW()::timestamp), NOW()::timestamp), NOW()::timestamp),2) AS ccc`,
                values: [userID, game1.id_gry]
            }

            const resultBBB = await pool.query(query2);

            const gamePrice = resultBBB.rows[0].ccc;

            const query3 = {
                text: `
                    SELECT jaka_walute_mial_dany_kraj(jaki_kraj_mial_dany_user($1::INTEGER, NOW()::timestamp), NOW()::timestamp) AS bbb`,
                values: [userID],
            };

            const result3 = await pool.query(query3);

            const currency = result3.rows[0].bbb;

            console.log("CURRENCY:", gamePrice);

            res.json({
                name: game1.nazwa,
                description: game1.opis,
                id_gry: game1.id_gry,
                cena: gamePrice,
                waluta: currency
            });
        } else {
            console.log('Game not found');
            res.status(404).json({ error: 'Game not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/user-info', async (req, res) => {
    const { username } = req.body; 

    try {
        const query = {
            text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const result = await pool.query(query);

        if (result.rowCount === 1) {
            const userInfo = result.rows[0];
            res.json({
                username: userInfo.nazwa,
                email: userInfo.email,
                name: userInfo.imie,
                surname: userInfo.nazwisko,
                date_of_birth: userInfo.data_urodzenia,
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get-all-games', async (req, res) => {
    try {
        const query = {
            text: 'SELECT nazwa, opis FROM gry',
        };

        const result = await pool.query(query);

        if (result.rowCount > 0) {
            const games = result.rows.map(game => ({
                name: game.nazwa,
                description: game.opis
            }));
            res.json({ games: games });
        } else {
            res.status(404).json({ error: 'No games found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get-all-payment-methods', async (req, res) => {
    try {
        const query = {
            text: 'SELECT pelna_nazwa, id_metody FROM metody_platnosci',
        };

        const result = await pool.query(query);

        if (result.rowCount > 0) {
            const games = result.rows.map(game => ({
                nazwa: game.pelna_nazwa,
                ident: game.id_metody
            }));
            res.json({ metody: games });
        } else {
            res.status(404).json({ error: 'No games found' });
        }



    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal server error' });
    }
});

app.post('/get-all-countries', async (req, res) => {
    try {
        const query = {
            text: 'SELECT nazwa FROM kraje',
        };

        const result = await pool.query(query);

        if (result.rowCount > 0) {
            const games = result.rows.map(game => ({
                nazwa: game.nazwa
            }));
            res.json({ metody: games });
        } else {
            res.status(404).json({ error: 'No games found' });
        }



    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal server error' });
    }
});

app.post('/get-reviews', async (req, res) => {
    const {gameName} = req.body;
    try {

        const query = {
            text: 'select u.nazwa, r.ocena, r.opis from recenzje r join uzytkownicy u on r.recenzent = u.id_uzytkownika join gry g on r.gra = g.id_gry where g.nazwa = $1',
            values: [gameName],
        };

        const result = await pool.query(query);
        //console.log(result);
        if (result.rowCount >= 0) {
            const reviews = result.rows.map(review => ({
                nazwa: review.nazwa,
                ocena: review.ocena,
                opis: review.opis
            }));
            //console.log(reviews);
            res.json({ reviews : reviews });
        } else {
            res.status(404).json({ error: 'No games found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get-library-games', async (req, res) => {
    const {username} = req.body;
    try
    {
        const usQuery = {
            text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const result = await pool.query(usQuery);

        const userID = result.rows[0].id_uzytkownika

        const query = {
            text: `SELECT gry.nazwa, gry.opis
            FROM zakupy_gier
            JOIN gry ON gry.id_gry = zakupy_gier.gra
            WHERE zakupy_gier.otrzymujacy = $1
            AND zakupy_gier.id_zakupu NOT IN
            (
                SELECT zwroty.id_zakupu
                FROM zwroty
            )`,
            values: [userID]
        }

        const result2 = await pool.query(query);

        const userGames = result2.rows.map(game => ({
            name: game.nazwa,
            description: game.opis
        }));

        res.json({games: userGames});
    }
    catch (error)
    {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get-friends', async (req, res) => {
    const { username } = req.body;
    try {
        const query = {
            text: `
                    SELECT u2.nazwa AS username, z.data_zawarcia AS date_of_friendship
                    FROM znajomosci z 
                    JOIN uzytkownicy u1 ON z.id_uzytkownika_1 = u1.id_uzytkownika 
                    JOIN uzytkownicy u2 ON z.id_uzytkownika_2 = u2.id_uzytkownika 
                    WHERE u1.nazwa = $1
                    AND z.id_znajomosci NOT IN
                    (
                        SELECT znajomosci_zerwania.id_znajomosci
                        FROM znajomosci_zerwania
                    )
                    UNION
                    SELECT u1.nazwa AS username, z.data_zawarcia AS date_of_friendship
                    FROM znajomosci z 
                    JOIN uzytkownicy u1 ON z.id_uzytkownika_1 = u1.id_uzytkownika 
                    JOIN uzytkownicy u2 ON z.id_uzytkownika_2 = u2.id_uzytkownika 
                    WHERE u2.nazwa = $1
                    AND z.id_znajomosci NOT IN
                    (
                        SELECT znajomosci_zerwania.id_znajomosci
                        FROM znajomosci_zerwania
                    )` 
                    ,
            values: [username],
        };
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/add-friend', async (req, res) => {
    const { username, friendUsername } = req.body;
    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };
        const friendQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [friendUsername],
        };

        const userResult = await pool.query(userQuery);
        const friendResult = await pool.query(friendQuery);

        if (userResult.rowCount === 1 && friendResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;
            const friendId = friendResult.rows[0].id_uzytkownika;

            const insertFriendQuery = {
                text: 'INSERT INTO znajomosci (id_uzytkownika_1, id_uzytkownika_2, data_zawarcia) VALUES ($1, $2, NOW())',
                values: [userId, friendId],
            };

            await pool.query(insertFriendQuery);
            res.sendStatus(201);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/remove-friend', async (req, res) => {
    const { username, friendUsername } = req.body;
    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };
        const friendQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [friendUsername],
        };

        const userResult = await pool.query(userQuery);
        const friendResult = await pool.query(friendQuery);

        if (userResult.rowCount === 1 && friendResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;
            const friendId = friendResult.rows[0].id_uzytkownika;
            
            const friendIdQuery = {
                text: `
                SELECT id_znajomosci
                FROM znajomosci 
                WHERE (id_uzytkownika_1 = $1 AND id_uzytkownika_2 = $2) 
                   OR (id_uzytkownika_1 = $2 AND id_uzytkownika_2 = $1)
                ORDER BY id_znajomosci DESC
                LIMIT 1`,
                values: [userId, friendId],
            };

            const friendIdResult = await pool.query(friendIdQuery);

            const friendshipID = friendIdResult.rows[0].id_znajomosci;

            const deleteFriendQuery = {
                text: `INSERT INTO znajomosci_zerwania (id_znajomosci, zrywajacy, powod, data_zerwania) VALUES ($1, $2, 'XDDD', NOW())`,
                values: [friendshipID, userId],
            };

            await pool.query(deleteFriendQuery);
            res.sendStatus(200);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get-achievements', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const usQuery = {
            text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const result1 = await pool.query(usQuery);

        if (result1.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userID = result1.rows[0].id_uzytkownika;

        const query = {
            text: `
                SELECT o.nazwa, o.opis
                FROM osiagniecia_uzytkownikow ou
                JOIN osiagniecia o USING (id_osiagniecia)
                WHERE ou.id_uzytkownika = $1`,
            values: [userID],
        };

        const result = await pool.query(query);
        console.log('Achievements query result:', result.rows); // Dodaj to, aby zobaczyć wynik zapytania


            const achievements = result.rows.map(achievement => ({
                name: achievement.nazwa,
                description: achievement.opis,
            }));
            res.json({ achievements });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.post('/change-country', async (req, res) => {
    const { username, country } = req.body;

    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };
        const userResult = await pool.query(userQuery);

        if (userResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;

            const countryCodeQuery = {
                text: 'SELECT kod_kraju FROM kraje WHERE nazwa = $1',
                values: [country],
            };
            const countryResult = await pool.query(countryCodeQuery);

            if (countryResult.rowCount === 1) {
                const countryCode = countryResult.rows[0].kod_kraju;

                const updateCountryQuery = {
                    text: 'INSERT INTO kraje_uzytkownicy (id_uzytkownika, kod_kraju, data_zmiany) VALUES ($1, $2, NOW() )',
                    values: [userId, countryCode],
                };
                await pool.query(updateCountryQuery);

                res.sendStatus(200);
            } else {
                res.status(404).json({ error: 'Country not found' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/delete-account', async (req, res) => {
    const { username } = req.body;

    try {
        const usQuery = {
            text: 'SELECT * FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const result1 = await pool.query(usQuery);

        if (result1.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userID = result1.rows[0].id_uzytkownika;

            const insertDeletedUserQuery = {
                text: `INSERT INTO usuniete_konta (id_uzytkownika, usuwajacy, data_usuniecia ) VALUES ($1, 'uzytkownik', NOW() )`,
                values: [userID],
            };

            await pool.query(insertDeletedUserQuery);

            res.sendStatus(200);
        } 
         catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.post('/add-review', async (req, res) => {
    const { username, gameName, review, rating } = req.body;

    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };
        const gameQuery = {
            text: 'SELECT id_gry FROM gry WHERE nazwa = $1',
            values: [gameName],
        };

        const userResult = await pool.query(userQuery);
        const gameResult = await pool.query(gameQuery);

        if (userResult.rowCount === 1 && gameResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;
            const gameId = gameResult.rows[0].id_gry;

            const insertReviewQuery = {
                text: 'INSERT INTO recenzje (recenzent, gra, ocena, opis, data_wystawienia) VALUES ($1, $2, $3, $4, NOW())',
                values: [userId, gameId, rating, review],
            };

            await pool.query(insertReviewQuery);
            res.sendStatus(201);
        } else {
            res.status(404).json({ error: 'User or game not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/purchase-game', async (req, res) => {
    const { username, gameId, method } = req.body;

    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const userResult = await pool.query(userQuery);
        console.log(userResult);
        if (userResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;

            const insertPurchaseQuery = {
                text: 'INSERT INTO zakupy_gier (kupujacy, otrzymujacy, gra, metoda_platnosci, data_zakupu) VALUES ($2, $2, $1, $3, NOW())',
                values: [gameId, userId, method],
            };

            await pool.query(insertPurchaseQuery);
            res.sendStatus(201);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/users-money', async (req, res) => {
    const {username} = req.body;

    try {
        const userQuery = {
            text: 'SELECT id_uzytkownika FROM uzytkownicy WHERE nazwa = $1',
            values: [username],
        };

        const userResult = await pool.query(userQuery);
        console.log(userResult);
        if (userResult.rowCount === 1) {
            const userId = userResult.rows[0].id_uzytkownika;

            const query = {
                text: `
                    SELECT oblicz_saldo_uzytkownika($1) AS aaa`,
                values: [userId],
            };
    
            const result = await pool.query(query);
            console.log('Achievements query result:', result.rows);
    
    
            const cash = result.rows.map(achievement => ({
                val: achievement.aaa
            }));

            const query2 = {
                text: `
                    SELECT jaka_walute_mial_dany_kraj(jaki_kraj_mial_dany_user($1::INTEGER, NOW()::timestamp), NOW()::timestamp) AS bbb`,
                values: [userId],
            };

            const result2 = await pool.query(query2);

            const currency = result2.rows.map(achievement => ({
                val: achievement.bbb
            }));

            console.log('Achievements query result:', result2.rows);

                res.json({ cash, currency });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

