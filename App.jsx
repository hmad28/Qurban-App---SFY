// ══════════════════════════════════════════════════════════════
// AUTH PAGES: Login + Sign Up (Pendaftaran Panitia)
// Tambahkan komponen ini ke App.jsx, ganti LoginPage yang lama
// ══════════════════════════════════════════════════════════════

// ── Konstanta & helpers dari App.jsx yang sudah ada ──────────
// (sudah tersedia: C, css, hashPassword, verifyPassword, uuid,
//  now, saveSession, Btn, Input, Toast)

// ── Strength meter password ───────────────────────────────────
function PasswordStrength({ pass }) {
  if (!pass) return null;
  const checks = [
    pass.length >= 8,
    /[A-Z]/.test(pass),
    /[0-9]/.test(pass),
    /[^A-Za-z0-9]/.test(pass),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  const colors = [C.red, C.orange, C.gold, C.green];
  const label = score === 0 ? "" : labels[score - 1];
  const color = score === 0 ? C.border : colors[score - 1];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= score ? color : C.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      {label && (
        <div style={{ fontSize: 11, color, fontFamily: "monospace", letterSpacing: 0.5 }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Input password dengan toggle show/hide ────────────────────
function PasswordInput({ label, value, onChange, placeholder = "••••••••", error = "", hint = "", showStrength = false }) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={css.label}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...css.input, paddingRight: 48, borderColor: error ? C.red : C.border }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {hint && !error && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>⚠ {error}</div>}
      {showStrength && <PasswordStrength pass={value} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN PAGE (pengganti LoginPage lama)
// ══════════════════════════════════════════════════════════════
function LoginPage({ onLogin, panitiaList, setPanitiaList, addLog }) {
  const [tab, setTab] = React.useState("login"); // "login" | "signup"
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🕌</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.white, margin: 0, letterSpacing: "-0.5px" }}>
            Qurban App
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
            Sistem Manajemen Qurban Digital · {new Date().getFullYear()} M
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          gap: 4,
        }}>
          {[{ id: "login", label: "Masuk" }, { id: "signup", label: "Daftar Akun" }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, border: "none", borderRadius: 9,
                padding: "9px 0",
                fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                background: tab === t.id ? C.green : "transparent",
                color: tab === t.id ? "#fff" : C.muted,
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "login"
          ? <LoginForm onLogin={onLogin} panitiaList={panitiaList} setPanitiaList={setPanitiaList} addLog={addLog} />
          : <SignUpForm panitiaList={panitiaList} setPanitiaList={setPanitiaList} addLog={addLog} onSuccess={() => setTab("login")} />
        }
      </div>
    </div>
  );
}

// ── Form Login ────────────────────────────────────────────────
function LoginForm({ onLogin, panitiaList, setPanitiaList, addLog }) {
  const [username, setUsername] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState("");
  const [lockMsg, setLockMsg] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handle = () => {
    if (!username.trim() || !pass.trim()) { setErr("Username dan password wajib diisi."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = panitiaList.find(u => u.username === username.toLowerCase().trim());
      if (!user) { setErr("Username atau password salah."); return; }

      if (user.status === "nonaktif") {
        setErr("Akun Anda telah dinonaktifkan. Hubungi admin.");
        addLog(null, "AUTH_LOGIN_LOCKED", "AUTH", user.id, user.nama, { info: "Akun nonaktif" });
        return;
      }

      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const sisa = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
        setLockMsg(`Akun terkunci. Coba lagi dalam ${sisa} menit.`);
        addLog(null, "AUTH_LOGIN_LOCKED", "AUTH", user.id, user.nama, { info: "Akun terkunci sementara" });
        return;
      }

      if (!verifyPassword(pass, user.passwordHash)) {
        const attempts = (user.loginAttempts || 0) + 1;
        const locked = attempts >= 5;
        const lockedUntil = locked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
        setPanitiaList(prev => prev.map(u => u.id === user.id ? { ...u, loginAttempts: attempts, lockedUntil } : u));
        setErr("Username atau password salah.");
        addLog(null, "AUTH_LOGIN_FAIL", "AUTH", user.id, user.nama, { attempts });
        if (locked) setLockMsg("Akun dikunci 15 menit karena 5× gagal login.");
        return;
      }

      setPanitiaList(prev => prev.map(u => u.id === user.id ? { ...u, loginAttempts: 0, lockedUntil: null } : u));
      const session = {
        panitiaId: user.id, panitiaName: user.nama, role: user.role,
        loginAt: now(), token: uuid(), mustChangePassword: user.mustChangePassword || false,
      };
      saveSession(session, remember);
      addLog(session, "AUTH_LOGIN_OK", "AUTH", user.id, user.nama, {});
      onLogin(session);
    }, 400);
  };

  return (
    <div style={{ ...css.card, padding: 24 }}>
      <Input
        label="Username"
        value={username}
        onChange={v => { setUsername(v); setErr(""); setLockMsg(""); }}
        placeholder="Masukkan username"
        onKeyDown={e => e.key === "Enter" && handle()}
      />
      <PasswordInput
        label="Password"
        value={pass}
        onChange={v => { setPass(v); setErr(""); }}
        placeholder="••••••••"
      />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer", fontSize: 13, color: C.muted }}>
        <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
        Ingat saya (7 hari)
      </label>

      {(err || lockMsg) && (
        <div style={{ color: C.red, fontSize: 13, marginBottom: 14, padding: "10px 14px", background: "#3B000033", borderRadius: 8, border: `1px solid ${C.red}33` }}>
          ⚠️ {lockMsg || err}
        </div>
      )}

      <Btn color={C.green} onClick={handle} disabled={loading} style={{ width: "100%", padding: "13px 0", fontSize: 15 }}>
        {loading ? "⏳ Memproses..." : "Masuk →"}
      </Btn>

      <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: C.muted }}>
        Hubungi admin jika lupa username atau password.
      </div>
    </div>
  );
}

// ── Form Sign Up (Daftar Akun Panitia) ────────────────────────
function SignUpForm({ panitiaList, setPanitiaList, addLog, onSuccess }) {
  const [form, setForm] = React.useState({ nama: "", username: "", pass: "", pass2: "" });
  const [errors, setErrors] = React.useState({});
  const [toast, setToast] = React.useState({ msg: "", type: "ok" });
  const [loading, setLoading] = React.useState(false);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3500);
  };

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = "Nama lengkap wajib diisi";
    if (!form.username.trim()) e.username = "Username wajib diisi";
    else if (form.username.length < 3) e.username = "Minimal 3 karakter";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Hanya huruf, angka, dan underscore";
    else if (panitiaList.find(u => u.username === form.username.toLowerCase())) e.username = "Username sudah digunakan";
    if (!form.pass) e.pass = "Password wajib diisi";
    else if (form.pass.length < 6) e.pass = "Minimal 6 karakter";
    if (!form.pass2) e.pass2 = "Konfirmasi password wajib diisi";
    else if (form.pass !== form.pass2) e.pass2 = "Password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newUser = {
        id: "USR_" + Date.now(),
        nama: form.nama.trim(),
        username: form.username.toLowerCase().trim(),
        passwordHash: hashPassword(form.pass),
        role: "panitia",
        status: "aktif",
        mustChangePassword: false,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: now(),
        createdBy: "SELF_REGISTER",
        updatedAt: now(),
        updatedBy: "SELF_REGISTER",
      };
      setPanitiaList(prev => [...prev, newUser]);
      addLog(null, "AUTH_REGISTER", "AUTH", newUser.id, newUser.nama, { username: newUser.username });
      showToast("Akun berhasil dibuat! Silakan masuk.", "ok");
      setTimeout(() => onSuccess(), 1500);
    }, 400);
  };

  const f = (k) => v => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type} />
      <div style={{ ...css.card, padding: 24 }}>

        {/* Info role */}
        <div style={{ padding: "10px 14px", background: C.greenDark + "55", border: `1px solid ${C.green}33`, borderRadius: 8, marginBottom: 20, fontSize: 12, color: C.greenLight }}>
          ℹ️ Akun baru otomatis terdaftar sebagai <strong>Panitia</strong>. Untuk hak akses Admin, minta kepada Admin yang sudah ada.
        </div>

        <Input label="Nama Lengkap" value={form.nama} onChange={f("nama")} placeholder="cth: Budi Santoso" error={errors.nama} />
        <Input
          label="Username"
          value={form.username}
          onChange={v => { f("username")(v); setErrors(p => ({ ...p, username: "" })); }}
          placeholder="cth: budi123"
          error={errors.username}
          hint="Huruf, angka, dan underscore saja"
        />
        <PasswordInput
          label="Password"
          value={form.pass}
          onChange={f("pass")}
          placeholder="Min. 6 karakter"
          error={errors.pass}
          showStrength={true}
        />
        <PasswordInput
          label="Konfirmasi Password"
          value={form.pass2}
          onChange={f("pass2")}
          placeholder="Ulangi password"
          error={errors.pass2}
        />

        <Btn color={C.green} onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px 0", fontSize: 15 }}>
          {loading ? "⏳ Mendaftar..." : "Buat Akun →"}
        </Btn>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// GLOBAL SEARCH COMPONENT
// Tambahkan ke root App setelah nav bar, panggil dari semana saja
// ══════════════════════════════════════════════════════════════

// Fungsi pencarian global — mencari di semua data
function buildSearchIndex(hewan, mudhohi, mustahiq) {
  const results = [];

  hewan.forEach(h => {
    results.push({
      id: h.id, type: "Hewan", icon: { Sapi: "🐄", Kambing: "🐐", Domba: "🐑" }[h.jenis] || "🐾",
      title: h.nama,
      sub: `${h.jenis} · ${h.status} · ${h.berat}kg · Rp ${Number(h.harga).toLocaleString("id")}`,
      page: "hewan",
      color: { Sapi: C.gold, Kambing: C.green, Domba: C.purple }[h.jenis] || C.muted,
      keywords: `${h.nama} ${h.jenis} ${h.status} ${h.asal}`.toLowerCase(),
    });
  });

  mudhohi.forEach(m => {
    results.push({
      id: m.id, type: "Mudhohi", icon: "💳",
      title: m.nama,
      sub: `${m.jenisHewan} · ${m.bayar} · 📱 ${m.hp} · Rp ${Number(m.nominal).toLocaleString("id")}`,
      page: "mudhohi",
      color: { Lunas: C.green, "Belum Lunas": C.red, Cicilan: C.orange }[m.bayar] || C.muted,
      keywords: `${m.nama} ${m.hp} ${m.alamat} ${m.jenisHewan} ${m.bayar}`.toLowerCase(),
    });
  });

  mustahiq.forEach(p => {
    results.push({
      id: p.id, type: "Mustahiq", icon: "🎟️",
      title: p.nama,
      sub: `RT ${p.rt || "-"} · ${p.alamat || "-"} · ${p.sudahAmbil ? "✅ Sudah Ambil" : "⏳ Belum Ambil"}`,
      page: "mustahiq",
      color: p.sudahAmbil ? C.green : C.orange,
      keywords: `${p.nama} ${p.rt} ${p.alamat} ${p.sesi}`.toLowerCase(),
    });
  });

  return results;
}

function GlobalSearch({ hewan, mudhohi, mustahiq, setPage, onClose }) {
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const index = React.useMemo(() => buildSearchIndex(hewan, mudhohi, mustahiq), [hewan, mudhohi, mustahiq]);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return index.filter(r => r.keywords.includes(q)).slice(0, 10);
  }, [query, index]);

  React.useEffect(() => { setFocused(0); }, [results]);

  const go = (item) => {
    setPage(item.page);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && results[focused]) go(results[focused]);
    if (e.key === "Escape") onClose();
  };

  const typeColors = { Hewan: C.gold, Mudhohi: C.blue, Mustahiq: C.orange };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 60 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        width: "100%", maxWidth: 520, margin: "0 16px",
        overflow: "hidden", boxShadow: "0 24px 80px #00000088",
      }}>

        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cari hewan, mudhohi, mustahiq..."
            style={{ ...css.input, border: "none", background: "transparent", padding: 0, fontSize: 16 }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
          )}
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 11, padding: "3px 7px", flexShrink: 0, fontFamily: "monospace" }}>Esc</button>
        </div>

        {/* Shortcut hint — saat query kosong */}
        {!query && (
          <div style={{ padding: "20px 18px" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: 0.5, fontFamily: "monospace", textTransform: "uppercase" }}>Cari Cepat</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { icon: "🐄", label: "Hewan", color: C.gold },
                { icon: "💳", label: "Mudhohi", color: C.blue },
                { icon: "🎟️", label: "Mustahiq", color: C.orange },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => setQuery(s.label.toLowerCase())}
                  style={{
                    background: s.color + "22", border: `1px solid ${s.color}44`,
                    borderRadius: 8, padding: "8px 14px",
                    color: s.color, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {s.icon} Semua {s.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: C.muted }}>
              Total data: {hewan.length} hewan · {mudhohi.length} mudhohi · {mustahiq.length} mustahiq
            </div>
          </div>
        )}

        {/* Hasil pencarian */}
        {query && results.length === 0 && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: C.muted, fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            Tidak ada hasil untuk "<strong style={{ color: C.text }}>{query}</strong>"
          </div>
        )}

        {results.length > 0 && (
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {/* Group by type */}
            {["Hewan", "Mudhohi", "Mustahiq"].map(type => {
              const group = results.filter(r => r.type === type);
              if (!group.length) return null;
              return (
                <div key={type}>
                  <div style={{ padding: "8px 18px 4px", fontSize: 10, color: typeColors[type] || C.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {type} ({group.length})
                  </div>
                  {group.map((item, idx) => {
                    const globalIdx = results.indexOf(item);
                    const isActive = focused === globalIdx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item)}
                        onMouseEnter={() => setFocused(globalIdx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          width: "100%", textAlign: "left",
                          padding: "11px 18px",
                          background: isActive ? C.green + "22" : "transparent",
                          border: "none", cursor: "pointer",
                          borderLeft: `3px solid ${isActive ? item.color : "transparent"}`,
                          transition: "background 0.1s",
                        }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                            {item.sub}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: item.color, fontFamily: "monospace", letterSpacing: 0.5, flexShrink: 0, background: item.color + "22", padding: "2px 8px", borderRadius: 99 }}>
                          {item.type}
                        </div>
                        {isActive && <span style={{ fontSize: 12, color: C.muted }}>↵</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 14, fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
          <span>↑↓ Navigasi</span>
          <span>↵ Buka</span>
          <span>Esc Tutup</span>
        </div>
      </div>
    </div>
  );
}

// ── Tombol pencarian untuk top bar ────────────────────────────
// Tambahkan state ini di root App:
//   const [showSearch, setShowSearch] = useState(false);
//
// Tambahkan tombol ini di top bar (sebelum tombol Keluar):
function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        color: C.muted,
        cursor: "pointer",
        fontSize: 13,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        minHeight: 36,
      }}
    >
      🔍 <span style={{ fontSize: 11, fontFamily: "monospace", color: C.muted }}>Ctrl+K</span>
    </button>
  );
}

// ── Keyboard shortcut Ctrl+K ──────────────────────────────────
// Tambahkan useEffect ini di root App:
//
// useEffect(() => {
//   const handler = (e) => {
//     if ((e.ctrlKey || e.metaKey) && e.key === "k") {
//       e.preventDefault();
//       setShowSearch(true);
//     }
//   };
//   window.addEventListener("keydown", handler);
//   return () => window.removeEventListener("keydown", handler);
// }, []);


// ══════════════════════════════════════════════════════════════
// CARA INTEGRASI KE App.jsx
// ══════════════════════════════════════════════════════════════
//
// 1. Copy semua komponen di atas ke App.jsx
//    (PasswordStrength, PasswordInput, LoginPage baru, LoginForm,
//     SignUpForm, buildSearchIndex, GlobalSearch, SearchButton)
//
// 2. Hapus LoginPage yang lama dari App.jsx
//
// 3. Di root App(), tambahkan state:
//    const [showSearch, setShowSearch] = useState(false);
//
// 4. Tambahkan useEffect keyboard shortcut (lihat komentar di atas)
//
// 5. Di JSX root App, di dalam top bar, tambahkan SearchButton:
//    <SearchButton onClick={() => setShowSearch(true)} />
//
// 6. Di JSX root App, setelah top bar / nav bar, tambahkan:
//    {showSearch && (
//      <GlobalSearch
//        hewan={hewan}
//        mudhohi={mudhohi}
//        mustahiq={mustahiq}
//        setPage={setPage}
//        onClose={() => setShowSearch(false)}
//      />
//    )}
//
// ══════════════════════════════════════════════════════════════
