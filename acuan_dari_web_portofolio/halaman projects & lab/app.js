// 1. Konfigurasi Database Google Sheets API Baru
const SPREADSHEET_ID = '1YMxR6-SlP-TT0B3y6NScT4L0YH0GXZEId_PY0Jgp8fQ';
const SHEET_NAME = 'Database_App'; 
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

let localProjectsData = [];

// DOM Elemen
const projectsGrid = document.getElementById('projects-grid');
const filterButtons = document.querySelectorAll('.cert-btn');
const mobileMenuBtn = document.getElementById('mobile-menu');
const navOverlay = document.getElementById('nav-overlay');
const closeMenuBtn = document.getElementById('close-menu');
const navbar = document.getElementById('navbar');

// ==========================================
// UTILITY: ESCAPE HTML (XSS Protection - Lebih Aman)
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === "'") return '&#039;';
    if (m === '"') return '&quot;';
    return m;
  });
}

// ==========================================
// 2. AMBIL DATA DARI GOOGLE SHEETS
// ==========================================
async function fetchProjectsData() {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL);
    if (!response.ok) throw new Error('Gagal mengakses URL spreadsheet');
    
    const rawText = await response.text();
    const jsonString = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1];
    const data = JSON.parse(jsonString);
    const rows = data.table.rows;
    
    localProjectsData = rows.map(row => {
      return {
        id: row.c[0] ? row.c[0].v : '',
        timestamp: row.c[1] ? row.c[1].v : '',
        judul: row.c[2] ? row.c[2].v : 'Tanpa Judul',
        kategori: row.c[3] ? row.c[3].v : 'Umum',
        link_dokumentasi: row.c[4] ? row.c[4].v : '#',
        deskripsi: row.c[5] ? row.c[5].v : 'Tidak ada deskripsi.',
        link_gambar: row.c[6] ? row.c[6].v : ''
      };
    });

    renderProjects(localProjectsData);
  } catch (error) {
    console.error('Error fetching data:', error);
    projectsGrid.innerHTML = `
      <div class="loading-status" style="color: #B22222; grid-column: 1/-1; text-align: center;">
        Gagal memuat data. Pastikan Google Sheets sudah dipublikasikan.
        <br><br>
        <button class="cert-btn btn-secondary" id="retry-fetch" style="max-width:200px; margin:0 auto;">
          ↻ Coba Lagi
        </button>
      </div>
    `;
    const retryBtn = document.getElementById('retry-fetch');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchProjectsData);
    }
  }
}

// ==========================================
// 3. WARNA BADGE BERDASARKAN KATEGORI
// ==========================================
function getBadgeClass(kategori) {
  const kat = kategori.toLowerCase().trim();
  if (kat === 'ai') return 'badge-ai';
  if (kat === 'cisco') return 'badge-cisco';
  if (kat === 'linux') return 'badge-linux';
  if (kat === 'mikrotik') return 'badge-mikrotik';
  if (kat === 'windows server') return 'badge-windows';
  if (kat === 'website') return 'badge-website';
  return 'badge-default';
}

// ==========================================
// 4. FUNGSI BAGIKAN (SHARE)
// ==========================================
async function shareProject(url, title) {
  if (!url || url === '#') {
    alert('Tidak ada link dokumentasi untuk proyek ini.');
    return;
  }
  const shareData = {
    title: title,
    text: 'Lihat proyek ini di Lab Archive saya:',
    url: url
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Gagal membagikan:', err);
        fallbackCopy(url);
      }
    }
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Link dokumentasi telah disalin ke clipboard!');
  }).catch(() => {
    alert('Gagal menyalin link. Silakan salin manual: ' + url);
  });
}

// ==========================================
// 5. RENDER KARTU PROYEK (DENGAN TOMBOL BAGIKAN)
// ==========================================
function renderProjects(projects) {
  projectsGrid.innerHTML = '';

  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="loading-status" style="grid-column: 1/-1; text-align: center;">Tidak ada proyek dalam kategori ini.</div>
    `;
    return;
  }

  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const imgUrl = project.link_gambar ? project.link_gambar : 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600';
    const badgeClass = getBadgeClass(project.kategori);
    
    // Escape untuk keamanan
    const judulEscaped = escapeHtml(project.judul);
    const deskripsiEscaped = escapeHtml(project.deskripsi);
    const kategoriEscaped = escapeHtml(project.kategori);
    
    card.innerHTML = `
      <div class="project-img-wrap">
        <img src="${imgUrl}" alt="Preview ${judulEscaped}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600';">
      </div>
      <div class="project-info">
        <div>
          <span class="project-badge ${badgeClass}">${kategoriEscaped}</span>
          <h3 class="project-title">${judulEscaped}</h3>
          <p class="project-desc">${deskripsiEscaped}</p>
        </div>
        <div class="project-actions">
          <a href="${project.link_dokumentasi}" target="_blank" rel="noopener noreferrer" class="project-link">
            Lihat Dokumentasi
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="project-share" data-url="${project.link_dokumentasi}" data-title="${judulEscaped}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Bagikan
          </button>
        </div>
      </div>
    `;
    
    projectsGrid.appendChild(card);
    
    // Event listener untuk tombol bagikan
    const shareBtn = card.querySelector('.project-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = shareBtn.getAttribute('data-url');
        const title = shareBtn.getAttribute('data-title');
        shareProject(url, title);
      });
    }
  });
}

// ==========================================
// 6. LOGIKA FILTER KATEGORI
// ==========================================
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active-filter'));
    button.classList.add('active-filter');

    const selectedCategory = button.getAttribute('data-category');

    if (selectedCategory === 'all') {
      renderProjects(localProjectsData);
    } else {
      const filtered = localProjectsData.filter(p => p.kategori.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
      renderProjects(filtered);
    }
  });
});

// ==========================================
// 7. MENU MOBILE (OVERLAY) + ARIA
// ==========================================
if (mobileMenuBtn && navOverlay && closeMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    navOverlay.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
  });

  closeMenuBtn.addEventListener('click', () => {
    navOverlay.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  });

  const overlayLinks = document.querySelectorAll('.overlay-links a');
  overlayLinks.forEach(link => {
    link.addEventListener('click', () => {
      navOverlay.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ==========================================
// 8. SMART HIDDEN NAVBAR ON SCROLL (THROTTLE + RAF)
// ==========================================
let lastScrollTop = 0;
let ticking = false;

if (navbar) {
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(() => {
        let currentScroll = window.scrollY;
        if (currentScroll > lastScrollTop && currentScroll > 100) {
          navbar.classList.add('nav-hidden');
        } else {
          navbar.classList.remove('nav-hidden');
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ==========================================
// 9. JALANKAN FETCH SAAT DOM SIAP
// ==========================================
document.addEventListener('DOMContentLoaded', fetchProjectsData);