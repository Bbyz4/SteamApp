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
            text: 'INSERT INTO uzytkownicy (nazwa, email, data_zalozenia, haslo, imie, nazwisko, data_urodzenia) VALUES ($1, $3, CURRENT_DATE, $2, $4, $5, $6) RETURNING id_uzytkownika',
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
            text: 'INSERT INTO kraje_uzytkownicy (id_uzytkownika, kod_kraju, data_zmiany) VALUES ($1, $2, $3)',
            values: [userId, countryCode, new Date()], 
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

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});