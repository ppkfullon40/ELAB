
// ===== BULLETIN BOARD FUNCTIONALITY =====
// This will be used with Firebase initialized from index.html

let db = null;

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.firebaseDb && window.firebaseOnValue) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
}

// Initialize bulletin board when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await waitForFirebase();
  loadAnnouncements();
});

// Load announcements
function loadAnnouncements() {
  const grid = document.getElementById('announcements-grid');
  const noAnnouncements = document.getElementById('no-announcements');
  
  if (!grid) return; // Only run on pages with announcements
  
  // Check if Firebase is available
  if (!window.firebaseDb || !window.firebaseOnValue || !window.firebaseRef) {
    console.log('Firebase not yet initialized, will retry...');
    setTimeout(loadAnnouncements, 500);
    return;
  }

  db = window.firebaseDb;
  
  try {
    window.firebaseOnValue(window.firebaseRef(db, 'announcements'), (snapshot) => {
      grid.innerHTML = '';
      const announcements = snapshot.val();

      if (!announcements || Object.keys(announcements).length === 0) {
        noAnnouncements.style.display = 'block';
        return;
      }

      noAnnouncements.style.display = 'none';

      // Sort by most recent first
      const sortedAnnouncements = Object.entries(announcements)
        .sort((a, b) => b[1].createdAt - a[1].createdAt);

      sortedAnnouncements.forEach(([key, announcement]) => {
        const card = document.createElement('div');
        card.className = 'announcement-card';
        
        // Check if user is logged in and is the owner
        const isOwner = window.currentUser && window.currentUser.email === announcement.ownerEmail;
        const deleteButton = isOwner ? `
          <button class="delete-btn" onclick="deleteAnnouncement('${key}')">Delete</button>
        ` : '';

        const imageUrl = announcement.imageUrl && announcement.imageUrl.toString().trim();
        const hasImage = imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null' && /^(https?:\/\/|data:image\/)/i.test(imageUrl);

        card.innerHTML = `
          ${hasImage ? `
            <div class="announcement-image">
              <img src="${imageUrl}" alt="${announcement.title}" onerror="this.closest('.announcement-image').style.display='none'">
            </div>
          ` : ''}
          <div class="announcement-content">
            <h3 class="announcement-title">${announcement.title}</h3>
            <p class="announcement-description">${announcement.description}</p>
            <p class="announcement-date">${announcement.timestamp}</p>
            ${deleteButton}
          </div>
        `;
        grid.appendChild(card);
      });
    });
  } catch (error) {
    console.log('Error loading announcements:', error);
    setTimeout(loadAnnouncements, 500);
  }
}

// Delete announcement
window.deleteAnnouncement = async (announcementId) => {
  if (!confirm('Are you sure you want to delete this announcement?')) return;

  try {
    if (window.firebaseRemove && window.firebaseRef && db) {
      await window.firebaseRemove(window.firebaseRef(db, `announcements/${announcementId}`));
      alert('Announcement deleted!');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ===== ORDER PAGE FUNCTIONALITY =====
const orderBtn = document.getElementById('orderBtn');
if (orderBtn) {
    orderBtn.addEventListener('click', () =>{
        orderBtn.innerText = "LOADING...";
        window.location.href = "orders.html";
    });
}

const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        document.querySelector('.order-step').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });
}

const cards = document.querySelectorAll('.fuel-card');
const totalPriceElement = document.getElementById('total-price');

function updateGrandTotal() {
    let grandTotal = 0;

    cards.forEach(card => {
        const qtyElement = card.querySelector('.quantity');
        const qty = parseInt(qtyElement.innerText) || 0;
        const price = parseInt(card.dataset.price) || 0;
        grandTotal += qty * price;
    });

    totalPriceElement.innerText = grandTotal;
}

cards.forEach(card => {
    const plusBtn = card.querySelector('.btn-plus');
    const minusBtn = card.querySelector('.btn-minus');
    const qtyDisplay = card.querySelector('.quantity');

    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            let qty = parseInt(qtyDisplay.innerText) || 0;
            qty++;
            qtyDisplay.innerText = qty;
            updateGrandTotal();
        });
    }

    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            let qty = parseInt(qtyDisplay.innerText) || 0;
            if (qty > 0) {
                qty--;
                qtyDisplay.innerText = qty;
                updateGrandTotal();
            }
        });
    }
});

// initialize total
if (totalPriceElement) {
    updateGrandTotal();
}
