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