/* ============================================================
   TAILWIND THEME CONFIG
   Must load AFTER the Tailwind CDN script and BEFORE the app.
   Edit colours, fonts, shadows here to re-theme the whole site.
   ============================================================ */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink:    '#132025',
        slatey: '#33464A',
        earth:  '#44372B',
        beige:  '#BFA68E',
        lightbeige:'#F1ECE5',
        sand:   '#FAF8F5',
        shell:  '#F3EDE6',
        line:   '#E7E0D7',
        muted:  '#6B7A7E',
        ok:     '#2F6B4F',
        warn:   '#8A6A1F',
        bad:    '#8C3A32'
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"','system-ui','-apple-system','Segoe UI','sans-serif'] },
      borderRadius: { xl2: '20px' },
      maxWidth: { shell: '1340px' },
      boxShadow: {
        card: '0 1px 2px rgba(19,32,37,.04), 0 8px 24px -12px rgba(19,32,37,.18)',
        lift: '0 2px 4px rgba(19,32,37,.05), 0 20px 40px -20px rgba(19,32,37,.30)',
        pop:  '0 30px 70px -30px rgba(19,32,37,.45)'
      }
    }
  }
}
