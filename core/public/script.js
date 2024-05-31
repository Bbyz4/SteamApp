document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const email = document.getElementById('new-email').value;
    const name = document.getElementById('new-name').value;
    const surname = document.getElementById('new-surname').value;
    const dateOfBirth = document.getElementById('new-date-of-birth').value;
    const country = document.getElementById('new-country').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            email: email,
            name: name,
            surname: surname,
            date_of_birth: dateOfBirth,
            country: country
        }),
    })
    .then(response => {
        if (response.ok) {
            alert('Signup successful! Please login.');
            window.location.href = '/login.html';
        } else {
            alert('Signup failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
    .then(response => {
        if (response.ok) {
            //USERNAME OBECNIE ZALOGOWANEGO UZYTKOWNIKA
            localStorage.setItem('username', username);

            alert('Login successful!');
            window.location.href = '/dashboard.html';
        } else if (response.status === 401) {
            alert('Invalid username or password. Please try again.');
        } else {
            alert('Login failed. Please try again later.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});