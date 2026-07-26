(function() {
  // ==================================================
  // KONFIGURASI GOOGLE SHEETS
  // ==================================================
  const SPREADSHEET_ID = '1GtKyr8LGv5AfSChzfP7t6_4D0rBUoC8VeRdC_Rw6eqY';
  const SHEET_NAME = 'Sheet1';
  const DATA_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  const container = document.getElementById('cert-grid-dynamic');

  // ==================================================
  // SIMPAN REFERENSI MODAL (agar tidak di-query ulang)
  // ==================================================
  const modal = document.getElementById('certModal');
  const modalImg = document.getElementById('modalImg');

  // ==================================================
  // UTILITY: ESCAPE HTML (lebih aman)
  // ==================================================
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

  // ==================================================
  // BUKA MODAL (menggunakan referensi yang sudah disimpan)
  // ==================================================
  function openModal(imgSrc) {
    if (modal && modalImg) {
      modalImg.src = imgSrc;
      modal.classList.add('show');
    }
  }

  // ==================================================
  // RENDER SERTIFIKAT KE DALAM GRID
  // ==================================================
  function renderCertificates(certificates) {
    if (!certificates.length) {
      container.innerHTML = `<div class="loading-status" style="grid-column:1/-1; text-align:center;">📭 Belum ada sertifikat. Silakan tambahkan data di Google Sheets.</div>`;
      return;
    }

    container.innerHTML = '';
    certificates.forEach(cert => {
      const isFeatured = (cert.id === '1' || cert.id === 1);
      const additionalClass = cert.tipe === 'vertical' ? 'pkl-vertical' : '';
      const featuredClass = isFeatured ? 'featured-cert' : '';
      const card = document.createElement('div');
      card.className = `cert-card ${additionalClass} ${featuredClass}`;

      // Siapkan gambar dengan fallback
      const imgHtml = `<img src="${cert.imgDepan}" alt="${escapeHtml(cert.nama)}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
      const fallbackDiv = `<div class="cert-img-fallback" style="display:none; align-items:center; justify-content:center; width:100%; height:100%; background:#e2e8f0; color:#475569; font-size:0.8rem;">📄 ${escapeHtml(cert.nama)}</div>`;

      // Tombol transkrip jika ada
      let buttonHtml = '';
      if (cert.tombolAda && cert.imgBelakang) {
        buttonHtml = `<button class="btn-transkrip" data-fullimg="${cert.imgBelakang}">📄 Lihat Transkrip</button>`;
      }

      // Gabungan penerbit & tahun dengan pemisah " - "
      let metaText = '';
      if (cert.penerbit && cert.tahun) {
        metaText = `${escapeHtml(cert.penerbit)} - ${escapeHtml(cert.tahun)}`;
      } else if (cert.penerbit) {
        metaText = escapeHtml(cert.penerbit);
      } else if (cert.tahun) {
        metaText = escapeHtml(cert.tahun);
      }

      card.innerHTML = `
        <div class="cert-img-wrap" style="position:relative;">
          ${imgHtml}
          ${fallbackDiv}
        </div>
        <div class="cert-info">
          <div class="cert-name">${escapeHtml(cert.nama)}</div>
          ${metaText ? `<div class="cert-meta">${metaText}</div>` : ''}
          ${buttonHtml}
        </div>
      `;

      // Pasang event listener untuk tombol transkrip
      const btn = card.querySelector('.btn-transkrip');
      if (btn && cert.imgBelakang) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const fullImg = this.getAttribute('data-fullimg');
          if (fullImg) {
            openModal(fullImg);
          }
        });
      }

      container.appendChild(card);
    });
  }

  // ==================================================
  // FETCH DATA DARI GOOGLE SHEETS
  // ==================================================
  async function fetchCertificates() {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error('Gagal mengakses spreadsheet');
      const rawText = await response.text();
      const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
      if (!jsonMatch) throw new Error('Respons JSON tidak valid');
      const data = JSON.parse(jsonMatch[1]);
      const rows = data.table.rows;

      const certificatesData = rows.map(row => {
        return {
          id: row.c[0] ? String(row.c[0].v) : '',
          timestamp: row.c[1] ? String(row.c[1].v) : '',
          nama: row.c[2] ? String(row.c[2].v) : 'Sertifikat',
          penerbit: row.c[3] ? String(row.c[3].v) : '',
          tahun: row.c[4] ? String(row.c[4].v) : '',
          tipe: row.c[5] ? String(row.c[5].v).toLowerCase() : 'horizontal',
          tombolAda: (row.c[6] ? String(row.c[6].v) : '') === 'ada',
          imgDepan: row.c[7] ? String(row.c[7].v) : '',
          imgBelakang: row.c[8] ? String(row.c[8].v) : ''
        };
      }).filter(cert => cert.imgDepan !== '');

      renderCertificates(certificatesData);
    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="loading-status" style="grid-column:1/-1; text-align:center; color:#B22222;">
          Gagal memuat data. Pastikan Google Sheets sudah dipublikasikan.
          <br><br>
          <button class="cert-btn btn-secondary" id="retry-fetch" style="max-width:200px; margin:0 auto;">
            ↻ Coba Lagi
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('retry-fetch');
      if (retryBtn) {
        retryBtn.addEventListener('click', fetchCertificates);
      }
    }
  }

  // Jalankan saat DOM siap
  document.addEventListener('DOMContentLoaded', fetchCertificates);

  // ==================================================
  // EVENT UNTUK MENUTUP MODAL (dari script.js, tetapi kita jaga-jaga)
  // ==================================================
  // Pastikan modal bisa ditutup jika tombol close di-klik
  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
      if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { if (modalImg) modalImg.src = ''; }, 300);
      }
    });
  }
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => { if (modalImg) modalImg.src = ''; }, 300);
      }
    });
  }
})();