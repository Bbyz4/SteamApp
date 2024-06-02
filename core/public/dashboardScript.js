document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem("username");
    document.getElementById("username").textContent = username;
});

function openTab(tabName) {
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }
    document.getElementById("greeting").style.display = "none";
    document.getElementById(tabName).style.display = "block";
}

//PROFIL
document.getElementById('profileButton').addEventListener('click', function() {
    openTab('profile');
    fetchUserInfo();
});

function fetchUserInfo() {
    const username = localStorage.getItem('username');
    fetch('/user-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username})
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch user information');
        }
    })
    .then(userInfo => {
        displayUserInfo(userInfo);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayUserInfo(userInfo) {
    console.log("C");
    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = `
        <p>Username: ${userInfo.username}</p>
        <p>Email: ${userInfo.email}</p>
        <p>Name: ${userInfo.name}</p>
        <p>Surname: ${userInfo.surname}</p>
        <p>Date of Birth: ${userInfo.date_of_birth}</p>
    `;
}

//BIBLIOTEKA
document.getElementById('libraryButton').addEventListener('click', function() {
    console.log("AA");
    openTab('library');
    fetchLibInfo();
});

function fetchLibInfo() {
    console.log("BB");
    const username = localStorage.getItem('username');
    fetch('/get-library-games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username})
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch library information');
        }
    })
    .then(userInfo => {
        displayUserLibrary(userInfo.games);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayUserLibrary(games) {
    console.log("CC");
    const shopTab = document.getElementById('libContent');
    shopTab.innerHTML = "";
    const gameList = document.createElement('ul');

    games.forEach(game => {
        const listItem = document.createElement('li');
        listItem.textContent = `${game.name}: ${game.description}`;
        gameList.appendChild(listItem);
    });

    shopTab.appendChild(gameList);
}

//SKLEP
document.getElementById('shopButton').addEventListener('click', function() {
    openTab('shop');
    fetchBuyableGames();
});

function fetchBuyableGames(){
    fetch('/get-all-games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch games');
        }
    })
    .then(data => {
        displayGames(data.games);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayGames(games) {
    const shopTab = document.getElementById('shopContent');
    shopTab.innerHTML = "";
    const gameList = document.createElement('ul');

    games.forEach(game => {
        const listItem = document.createElement('li');
        listItem.textContent = `${game.name}: ${game.description}`;
        gameList.appendChild(listItem);
    });

    shopTab.appendChild(gameList);
}

// Friends
document.getElementById('friendsButton').addEventListener('click', function() {
    openTab('friends');
    fetchFriends();
});

function fetchFriends() {
    const username = localStorage.getItem('username');
    fetch('/get-friends', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username})
    })
    .then(response => response.json())
    .then(friends => displayFriends(friends))
    .catch(error => console.error('Error:', error));
}

function displayFriends(friends) {
    const friendsContent = document.getElementById('friendsContent');
    friendsContent.innerHTML = '';
    const friendsList = document.createElement('ul');
    friends.forEach(friend => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${friend.username} - Friends since: ${friend.date_of_friendship}</span>
            <button onclick="removeFriend('${friend.username}')">Remove</button>
        `;
        friendsList.appendChild(listItem);
    });
    friendsContent.appendChild(friendsList);
}

function removeFriend(friendUsername) {
    const username = localStorage.getItem('username');
    fetch('/remove-friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username, friendUsername: friendUsername})
    })
    .then(response => {
        if (response.ok) {
            alert('Friend removed successfully');
            fetchFriends();
        } else {
            alert('Failed to remove friend');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Dodawanie znajomego
document.getElementById('addFriendForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = localStorage.getItem('username');
    const friendUsername = document.getElementById('friendUsername').value;

    fetch('/add-friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username, friendUsername: friendUsername})
    })
    .then(response => {
        if (response.ok) {
            alert('Friend added successfully');
            fetchFriends();
        } else {
            alert('Failed to add friend');
        }
    })
    .catch(error => console.error('Error:', error));
});