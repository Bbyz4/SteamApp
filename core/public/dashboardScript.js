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

    const countryInput = document.getElementById('newCountry');

fetch('/get-all-countries', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
})
.then(response => response.json())
.then(methods => {

    let innerH = "";
    methods.metody.forEach(method => {
        innerH += `<option value= "${method.nazwa}">${method.nazwa}</option>`;
    });

    countryInput.innerHTML = innerH;
})
.catch(error => console.error('Error:', error));

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


// Change Country
document.getElementById('changeCountryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = localStorage.getItem('username');
    const newCountry = document.getElementById('newCountry').value;

    fetch('/change-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, country: newCountry })
    })
    .then(response => {
        if (response.ok) {
            alert('Country changed successfully');
            fetchUserInfo(); // Refresh the profile info
        } else {
            alert('Failed to change country');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Delete Account
document.getElementById('deleteAccountButton').addEventListener('click', function() {
    const username = localStorage.getItem('username');
    const confirmation = confirm('Are you sure you want to delete your account? This action cannot be undone.');

    if (confirmation) {
        fetch('/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => {
            if (response.ok) {
                alert('Account deleted successfully');
                window.location.href = '/'; // Redirect to the home page or login page
            } else {
                alert('Failed to delete account');
            }
        })
        .catch(error => console.error('Error:', error));
    }
});

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

    const username = localStorage.getItem('username');
    fetch('/users-money', {
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
        const userMoneyDisplay = document.getElementById('usersMoney');

        userMoneyDisplay.innerText = userInfo.cash[0].val + " " + userInfo.currency[0].val;
    })
    .catch(error => {
        console.error('Error:', error);
    });

    fetchAllBuyableGames();
});

document.getElementById('searchGameForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const gameName = document.getElementById('gameSearchInput').value;
    const username = localStorage.getItem('username');

    fetch('/search-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameName: gameName, username: username })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert('Failed to find game');
        }
    })
    .then(game1 => {
            displayGameDetails(game1);
    })
    .catch(error => console.error('Error:', error));
});

function fetchReviews(){
    const gameName = document.getElementById('gameSearchInput').value;
        fetch('/get-reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameName: gameName })
        })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch games');
        }
    })
    .then(data => {
            displayReviews(data.reviews);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayReviews(reviews) {
    console.log(reviews);
    const allReviewList = document.getElementById('reviews');
    allReviewList.innerHTML = "";
    const reviewList = document.createElement('ul');

    reviews.forEach(review => {
        const listItem = document.createElement('li');
        listItem.textContent = `User: ${review.nazwa} Rating: ${review.ocena} Description: ${review.opis} `;
        reviewList.appendChild(listItem);
    });

    allReviewList.appendChild(reviewList);
}


function fetchAllBuyableGames(){
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
            displayAllGames(data.games);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayAllGames(games) {
        const allGamesList = document.getElementById('allGames');
        allGamesList.innerHTML = "";
        const gameList = document.createElement('ul');

        games.forEach(game => {
            const listItem = document.createElement('li');
            listItem.textContent = `${game.name}: ${game.description}`;
            gameList.appendChild(listItem);
        });

        allGamesList.appendChild(gameList);
    }


 
    document.getElementById('addReviewForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = localStorage.getItem('username');
        const gameName = document.getElementById('gameSearchInput').value;
        const reviewText = document.getElementById('reviewText').value;
        const reviewRating = document.getElementById('reviewRating').value;
    
        fetch('/add-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, gameName: gameName, review: reviewText, rating: reviewRating })
        })
        .then(response => {
            if (response.ok) {
                alert('Review added successfully');
            } else {
                alert('Failed to add review');
            }
        })
        .catch(error => console.error('Error:', error));
    });
    

    function displayGameDetails(game1) {
        const gameDetails = document.getElementById('gameDetails');
        gameDetails.innerHTML = `
            <h3>${game1.name}</h3>
            <p>${game1.description}</p>
            <p>${game1.cena >= 0 ?  game1.cena + " " + game1.waluta : "THIS GAME IS NOT AVAILABLE IN YOUR CURRENCY"}</p>
        `;
        gameDetails.style.display = 'block';

        document.getElementById('addReview').style.display = 'block';
        document.getElementById('purchaseGame').style.display = 'block';
        fetchReviews();

        fetch('/get-all-payment-methods', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(methods => {

            let innerH = "";
            methods.metody.forEach(method => {
                innerH += `<option value= "${method.ident}">${method.nazwa}</option>`;
            });

            const payMethodSelect = document.getElementById('payMethod');

            payMethodSelect.innerHTML = innerH;
        })
        .catch(error => console.error('Error:', error));

        document.getElementById('purchaseButton').onclick = function() {
            var selectedMethod = document.getElementById('payMethod').value;
            purchaseGame(game1.id_gry, selectedMethod);
        };
    }

    function purchaseGame(gameId, selectedMethod) {
        const username = localStorage.getItem('username');

        fetch('/purchase-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, gameId: gameId, method: selectedMethod })
        })
        .then(response => {
            if (response.ok) {
                alert('Game purchased successfully');
            } else {
                alert('Failed to purchase game');
            }
        })
        .catch(error => console.error('Error:', error));
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

// Achievements
document.getElementById('achievementsButton').addEventListener('click', function() {
    openTab('achievements');
    fetchAchievements();
});

function fetchAchievements() {
    const username = localStorage.getItem('username');

    fetch('/get-achievements', {
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
            throw new Error('Failed to fetch achievements');
        }
    })
    .then(data => {
        displayAchievements(data.achievements);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayAchievements(achievements) {
	if (!Array.isArray(achievements)) {
        console.error('Expected an array but got:', achievements);
        return;
    }
    const achievementsContent = document.getElementById('achievementsContent');
    achievementsContent.innerHTML = '';
    const achievementsList = document.createElement('ul');
    achievements.forEach(achievement => {
        const listItem = document.createElement('li');
        listItem.textContent = `${achievement.name}: ${achievement.description}`;
        achievementsList.appendChild(listItem);
    });
   
    achievementsContent.appendChild(achievementsList);
}
