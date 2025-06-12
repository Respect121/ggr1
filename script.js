// Discord OAuth Configuration
const DISCORD_CLIENT_ID = '1381932044040409098'; // ضع هنا Client ID الخاص بتطبيقك
const DISCORD_REDIRECT_URI = encodeURIComponent(window.location.origin); // أو ضع الرابط المحدد
const DISCORD_SCOPE = 'identify';

// Check if user is already logged in
let currentUser = localStorage.getItem('discord_user');
if (currentUser) {
  currentUser = JSON.parse(currentUser);
  hideLoginOverlay();
  showUserInfo();
} else {
  showLoginOverlay();
}

// Discord Login Handler
document.getElementById('discordLoginBtn').addEventListener('click', function(e) {
  e.preventDefault();
  
  const authURL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${DISCORD_REDIRECT_URI}&response_type=code&scope=${DISCORD_SCOPE}`;
  
  // فتح نافذة جديدة لتسجيل الدخول
  const popup = window.open(authURL, 'discord-login', 'width=500,height=700');
  
  // مراقبة إغلاق النافذة
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      // التحقق من وجود الكود في الـ URL
      checkForAuthCode();
    }
  }, 1000);
});

// Check for authorization code in URL
function checkForAuthCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    exchangeCodeForToken(code);
  }
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code) {
  try {
    const response = await fetch('/api/discord/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: decodeURIComponent(DISCORD_REDIRECT_URI)
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      getUserInfo(data.access_token);
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    alert('حدث خطأ في تسجيل الدخول، يرجى المحاولة مرة أخرى');
  }
}

// Get user information from Discord
async function getUserInfo(accessToken) {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const userData = await response.json();
    
    // حفظ بيانات المستخدم
    const userInfo = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      hasApplied: false // لتتبع ما إذا كان قد قدم من قبل
    };
    
    localStorage.setItem('discord_user', JSON.stringify(userInfo));
    currentUser = userInfo;
    
    hideLoginOverlay();
    showUserInfo();
    
    // إزالة الكود من الـ URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
  } catch (error) {
    console.error('Error getting user info:', error);
    alert('حدث خطأ في الحصول على بيانات المستخدم');
  }
}

// Show/Hide functions
function showLoginOverlay() {
  document.getElementById('loginOverlay').style.display = 'flex';
}

function hideLoginOverlay() {
  document.getElementById('loginOverlay').style.display = 'none';
}

function showUserInfo() {
  if (!currentUser) return;
  
  // إضافة معلومات المستخدم في الهيدر
  const header = document.querySelector('header');
  let userInfoDiv = document.querySelector('.user-info');
  
  if (!userInfoDiv) {
    userInfoDiv = document.createElement('div');
    userInfoDiv.className = 'user-info';
    userInfoDiv.style.display = 'flex';
    
    const avatarURL = currentUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${currentUser.discriminator % 5}.png`;
    
    userInfoDiv.innerHTML = `
      <img src="${avatarURL}" alt="Avatar" class="user-avatar">
      <span class="user-name">${currentUser.username}#${currentUser.discriminator}</span>
      <button class="logout-btn" onclick="logout()">خروج</button>
    `;
    
    header.appendChild(userInfoDiv);
  }
}

// Logout function
function logout() {
  localStorage.removeItem('discord_user');
  currentUser = null;
  document.querySelector('.user-info').remove();
  showLoginOverlay();
}

// تعديل معالج إرسال النموذج للتحقق من حالة التقديم
const originalFormHandler = applicationForm.addEventListener;
applicationForm.removeEventListener('submit', originalFormHandler);

applicationForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!currentUser) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }
  
  // التحقق من التقديم السابق
  if (currentUser.hasApplied) {
    alert('لقد قمت بالتقديم من قبل! لا يمكنك التقديم أكثر من مرة واحدة.');
    return;
  }
  
  // باقي كود إرسال النموذج الأصلي...
  const name = document.getElementById('name').value;
  const discord = document.getElementById('discord').value;
  const story = document.getElementById('story').value;
  const situation1 = document.getElementById('situation1').value;
  const situation2 = document.getElementById('why').value;
  
  const message = {
    content: '📝<@&1278077473816449045> **طلب تفعيل جديد**',
    embeds: [{
      title: 'معلومات المتقدم',
      color: 0xD4AF37,
      fields: [
        { name: 'معرف الديسكورد المؤكد', value: `${currentUser.username}#${currentUser.discriminator} (${currentUser.id})` },
        { name: 'الاسم والعمر و من وين', value: name },
        { name: 'يوزر او ايدي حسابك الديسكورد', value: discord },
        { name: 'اسم وعمر شخصيتك الخيالية والقصة', value: story },
        { name: 'السيناريو الأول (المركبة المعطلة)', value: situation1 },
        { name: 'السيناريو الثاني (الرهينة)', value: situation2 }
      ],
      timestamp: new Date().toISOString()
    }]
  };
  
  try {
    const webhookURL = "https://discord.com/api/webhooks/1366849448180846602/vYjdf1DtN_92N44KUCa3-hESzEh0fKNp05em_MQDUzYcn3i4hBhB1PG0ZLm6hreAba9c";
    
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    if (response.ok) {
      // تحديد أن المستخدم قد قدم
      currentUser.hasApplied = true;
      localStorage.setItem('discord_user', JSON.stringify(currentUser));
      
      alert('تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة قريباً.');
      applicationForm.reset();
      
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById('home').classList.add('active');
    } else {
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى لاحقاً.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى لاحقاً.');
  }

document.getElementById('discordLoginBtn').addEventListener('click', function () {
  const clientId = '1381932044040409098'; // ← حطيت لك الـ Client ID تبعك
  const redirectUri = encodeURIComponent('https://respect-cfw.ct.ws');
  const scope = 'identify';
  const responseType = 'code';

  // تحويل المستخدم لتسجيل الدخول بالديسكورد
  window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
});

});

// التحقق من الكود عند تحميل الصفحة
window.addEventListener('load', checkForAuthCode);