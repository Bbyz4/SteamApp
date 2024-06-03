const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const crypto = require('crypto');
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

        res.sendStatus(201);
    } catch (error) {
        await pool.query('ALTER TABLE uzytkownicy ADD CONSTRAINT sprawdz_czy_user_ma_ustawiony_poczatkowy_kraj CHECK(sprawdz_czy_user_ma_ustawiony_poczatkowy_kraj(id_uzytkownika, data_zalozenia))');
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


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
