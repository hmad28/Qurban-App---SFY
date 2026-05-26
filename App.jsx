// ══════════════════════════════════════════════════════════════
// IMPORT EXCEL — Komponen untuk Qurban App
//
// Dependensi: tambahkan SheetJS ke project
//   npm install xlsx
//   atau pakai CDN di index.html:
//   <script src="https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js"></script>
//
// Di React (Artifact/Claude), import dengan:
//   import * as XLSX from 'xlsx';
// ══════════════════════════════════════════════════════════════

// Untuk dipakai di Artifact claude.ai (sudah tersedia XLSX global):
// import * as XLSX from 'xlsx';   ← pakai ini jika pakai npm/vite

// ── Validator HP ─────────────────────────────────────────────
function isValidHP(hp) {
  if (!hp) return false;
  return /^08\d{8,12}$/.test(String(hp).replace(/\s|-/g, ""));
}

// ── Parser sheet Hewan ────────────────────────────────────────
function parseHewan(rows) {
  // rows = array of objects dengan key = header kolom
  const results = { data: [], errors: [] };
  const JENIS_VALID = ["Sapi", "Kambing", "Domba"];

  rows.forEach((row, idx) => {
    const lineNo = idx + 4; // baris Excel mulai dari row 4
    const jenis   = String(row["Jenis *"] || row["Jenis"] || "").trim();
    const nama    = String(row["Nama Hewan *"] || row["Nama Hewan"] || "").trim();
    const berat   = Number(row["Berat (kg) *"] || row["Berat (kg)"] || 0);
    const asal    = String(row["Asal / Peternak"] || "").trim();
    const harga   = Number(row["Harga (Rp) *"] || row["Harga (Rp)"] || 0);
    const kapasitas = Number(row["Kapasitas Peserta *"] || row["Kapasitas Peserta"] || 1);
    const ket     = String(row["Keterangan"] || "").trim();

    const rowErrors = [];
    if (!jenis) rowErrors.push("Jenis kosong");
    else if (!JENIS_VALID.includes(jenis)) rowErrors.push(`Jenis tidak valid: "${jenis}" (harus Sapi/Kambing/Domba)`);
    if (!nama) rowErrors.push("Nama Hewan kosong");
    if (!berat || berat <= 0) rowErrors.push("Berat harus > 0");
    if (!harga || harga <= 0) rowErrors.push("Harga harus > 0");
    if (!kapasitas || kapasitas < 1) rowErrors.push("Kapasitas minimal 1");

    if (rowErrors.length) {
      results.errors.push({ baris: lineNo, nama: nama || "(kosong)", masalah: rowErrors });
      return;
    }

    const prefix = jenis === "Sapi" ? "S" : jenis === "Kambing" ? "K" : "D";
    results.data.push({
      id: prefix + Date.now() + "_" + idx,
      jenis, nama, berat: String(berat), asal, harga: String(harga),
      kapasitas: String(kapasitas),
      keterangan: ket,
      status: "Menunggu",
      statusHistory: [],
      createdBy: "IMPORT_EXCEL",
      createdAt: new Date().toISOString(),
      updatedBy: "IMPORT_EXCEL",
      updatedAt: new Date().toISOString(),
    });
  });

  return results;
}

// ── Parser sheet Mudhohi ──────────────────────────────────────
function parseMudhohi(rows, hewanList) {
  const results = { data: [], errors: [] };
  const BAYAR_VALID = ["Lunas", "Belum Lunas", "Cicilan"];

  rows.forEach((row, idx) => {
    const lineNo = idx + 4;
    const nama      = String(row["Nama Lengkap *"] || row["Nama Lengkap"] || "").trim();
    const hp        = String(row["No. HP (WA) *"] || row["No. HP"] || row["HP"] || "").replace(/\s|-/g, "");
    const alamat    = String(row["Alamat / RT-RW"] || row["Alamat"] || "").trim();
    const jenisHewan= String(row["Jenis Hewan *"] || row["Jenis Hewan"] || "").trim();
    const namaHewan = String(row["Nama Hewan *"] || row["Nama Hewan"] || "").trim();
    const bayar     = String(row["Status Bayar *"] || row["Status Bayar"] || "").trim();
    const nominal   = Number(row["Nominal (Rp) *"] || row["Nominal (Rp)"] || row["Nominal"] || 0);

    const rowErrors = [];
    if (!nama) rowErrors.push("Nama kosong");
    if (!hp) rowErrors.push("No. HP kosong");
    else if (!isValidHP(hp)) rowErrors.push(`Format HP tidak valid: "${hp}" (harus 08xxxxxxxxxx)`);
    if (!jenisHewan) rowErrors.push("Jenis Hewan kosong");
    if (!namaHewan) rowErrors.push("Nama Hewan kosong");
    if (!bayar) rowErrors.push("Status Bayar kosong");
    else if (!BAYAR_VALID.includes(bayar)) rowErrors.push(`Status Bayar tidak valid: "${bayar}"`);
    if (!nominal || nominal <= 0) rowErrors.push("Nominal harus > 0");

    // Cari hewanId berdasarkan nama hewan
    const hewanObj = hewanList.find(h =>
      h.nama.toLowerCase() === namaHewan.toLowerCase() &&
      h.jenis.toLowerCase() === jenisHewan.toLowerCase()
    );
    if (namaHewan && jenisHewan && !hewanObj) {
      rowErrors.push(`Hewan "${namaHewan}" (${jenisHewan}) tidak ditemukan di sheet Hewan`);
    }

    if (rowErrors.length) {
      results.errors.push({ baris: lineNo, nama: nama || "(kosong)", masalah: rowErrors });
      return;
    }

    results.data.push({
      id: "M" + Date.now() + "_" + idx,
      nama, hp, alamat,
      jenisHewan, hewanId: hewanObj?.id || "",
      bayar, nominal: String(nominal),
      cicilanLog: [], waLog: [],
      createdBy: "IMPORT_EXCEL",
      createdAt: new Date().toISOString(),
      updatedBy: "IMPORT_EXCEL",
      updatedAt: new Date().toISOString(),
    });
  });

  return results;
}

// ── Parser sheet Mustahiq ────────────────────────────────────
function parseMustahiq(rows) {
  const results = { data: [], errors: [] };

  rows.forEach((row, idx) => {
    const lineNo = idx + 4;
    const nama    = String(row["Nama Lengkap *"] || row["Nama Lengkap"] || "").trim();
    const rt      = String(row["RT"] || "").trim();
    const alamat  = String(row["Alamat"] || "").trim();
    const anggota = row["Jumlah Anggota"] ? String(Number(row["Jumlah Anggota"])) : "";
    const sesi    = String(row["Sesi Pengambilan"] || "").trim();
    const ket     = String(row["Keterangan"] || "").trim();

    if (!nama) {
      results.errors.push({ baris: lineNo, nama: "(kosong)", masalah: ["Nama kosong"] });
      return;
    }

    results.data.push({
      id: "P" + Date.now() + "_" + idx,
      nama, rt, alamat, anggota, sesi, keterangan: ket,
      sudahAmbil: false,
      ambilLog: { ditandaiOleh: null, ditandaiWaktu: null, dibatalkanOleh: null, dibatalkanWaktu: null, alasanBatal: null },
      createdBy: "IMPORT_EXCEL",
      createdAt: new Date().toISOString(),
      updatedBy: "IMPORT_EXCEL",
      updatedAt: new Date().toISOString(),
    });
  });

  return results;
}

// ── Baca sheet dari workbook (skip baris header & contoh) ─────
function readSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
  // Baca dari baris ke-3 (header) seterusnya
  const raw = XLSX.utils.sheet_to_json(ws, { defval: "", range: 2 }); // range:2 = skip 2 baris pertama (title + instruksi)
  // Filter baris yang benar-benar kosong
  return raw.filter(row => Object.values(row).some(v => String(v).trim() !== ""));
}

// ══════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: ImportExcelModal
// ══════════════════════════════════════════════════════════════
function ImportExcelModal({
  onClose,
  onImport,   // callback(hasil) → { hewan, mudhohi, mustahiq }
  existingHewan = [],
  existingMudhohi = [],
  existingMustahiq = [],
  session,
  addLog,
}) {
  const [step, setStep] = React.useState("upload"); // upload | preview | confirm | done
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [preview, setPreview] = React.useState(null);
  // { hewan: {data,errors}, mudhohi: {data,errors}, mustahiq: {data,errors} }
  const [mode, setMode] = React.useState("append"); // append | replace
  const fileRef = React.useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError("File harus berformat .xlsx atau .xls");
      return;
    }
    setFile(f);
    setError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: "array" });

        const sheetNames = wb.SheetNames;
        const hasHewan    = sheetNames.some(s => s.toLowerCase().includes("hewan"));
        const hasMudhohi  = sheetNames.some(s => s.toLowerCase().includes("mudhohi"));
        const hasMustahiq = sheetNames.some(s => s.toLowerCase().includes("mustahiq"));

        if (!hasHewan && !hasMudhohi && !hasMustahiq) {
          setError("File tidak dikenali. Pastikan sheet bernama 'Hewan', 'Mudhohi', atau 'Mustahiq'.");
          setLoading(false);
          return;
        }

        const hewanSheet    = sheetNames.find(s => s.toLowerCase().includes("hewan"));
        const mudhohiSheet  = sheetNames.find(s => s.toLowerCase().includes("mudhohi"));
        const mustahiqSheet = sheetNames.find(s => s.toLowerCase().includes("mustahiq"));

        const hewanRows    = hewanSheet    ? readSheet(wb, hewanSheet)    : [];
        const mudhohiRows  = mudhohiSheet  ? readSheet(wb, mudhohiSheet)  : [];
        const mustahiqRows = mustahiqSheet ? readSheet(wb, mustahiqSheet) : [];

        // Parse — untuk mudhohi, gunakan hasil hewan supaya hewanId terhubung
        const hewanResult    = parseHewan(hewanRows || []);
        // Gabungkan hewan existing + hasil import untuk referensi mudhohi
        const allHewan = [...existingHewan, ...hewanResult.data];
        const mudhohiResult  = parseMudhohi(mudhohiRows || [], allHewan);
        const mustahiqResult = parseMustahiq(mustahiqRows || []);

        setPreview({ hewan: hewanResult, mudhohi: mudhohiResult, mustahiq: mustahiqResult });
        setStep("preview");
      } catch (err) {
        setError("Gagal membaca file: " + err.message);
      }
      setLoading(false);
    };
    reader.readAsArrayBuffer(f);
  };

  const totalErrors = preview
    ? preview.hewan.errors.length + preview.mudhohi.errors.length + preview.mustahiq.errors.length
    : 0;
  const totalImport = preview
    ? preview.hewan.data.length + preview.mudhohi.data.length + preview.mustahiq.data.length
    : 0;

  const doImport = () => {
    if (!preview) return;
    const hasil = {
      hewan:    mode === "replace" ? preview.hewan.data    : [...existingHewan,    ...preview.hewan.data],
      mudhohi:  mode === "replace" ? preview.mudhohi.data  : [...existingMudhohi,  ...preview.mudhohi.data],
      mustahiq: mode === "replace" ? preview.mustahiq.data : [...existingMustahiq, ...preview.mustahiq.data],
    };
    onImport(hasil);
    addLog && addLog(session, "IMPORT_EXCEL", "IMPORT", file?.name, file?.name, {
      hewan: preview.hewan.data.length,
      mudhohi: preview.mudhohi.data.length,
      mustahiq: preview.mustahiq.data.length,
      mode,
    });
    setStep("done");
  };

  // ── UI helpers ──────────────────────────────────────────────
  const SummaryCard = ({ icon, label, count, errors, color }) => (
    <div style={{
      background: count > 0 ? color + "18" : "#0A0D09",
      border: `1px solid ${count > 0 ? color + "44" : C.border}`,
      borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 100,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: count > 0 ? color : C.muted }}>{count}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      {errors > 0 && (
        <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>⚠ {errors} error</div>
      )}
    </div>
  );

  const ErrorList = ({ errors, label }) => {
    if (!errors?.length) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 6 }}>
          ⚠ Error di sheet {label} ({errors.length} baris):
        </div>
        {errors.slice(0, 5).map((e, i) => (
          <div key={i} style={{
            fontSize: 12, color: C.orange,
            background: "#3B000022", borderRadius: 6, padding: "6px 10px", marginBottom: 4,
          }}>
            <strong>Baris {e.baris}</strong> ({e.nama}): {e.masalah.join(", ")}
          </div>
        ))}
        {errors.length > 5 && (
          <div style={{ fontSize: 11, color: C.muted }}>...dan {errors.length - 5} error lainnya</div>
        )}
      </div>
    );
  };

  return (
    <Modal onClose={onClose} title="📥 Import dari Excel">

      {/* STEP: UPLOAD */}
      {step === "upload" && (
        <div>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${error ? C.red : C.green}`,
              borderRadius: 12, padding: "32px 20px",
              textAlign: "center", cursor: "pointer",
              background: "#0A0D09",
              marginBottom: 16,
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
            <div style={{ fontWeight: 700, color: C.white, marginBottom: 4 }}>
              {file ? file.name : "Klik untuk pilih file Excel"}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Format: .xlsx atau .xls · Gunakan template yang sudah disediakan
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          </div>

          {error && (
            <div style={{ color: C.red, fontSize: 13, marginBottom: 14, padding: "10px 14px", background: "#3B000033", borderRadius: 8 }}>
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", color: C.muted, padding: 16, fontSize: 14 }}>
              ⏳ Membaca file...
            </div>
          )}

          <div style={{ padding: "12px 16px", background: C.greenDark + "44", borderRadius: 8, border: `1px solid ${C.green}33`, fontSize: 12, color: C.greenLight }}>
            💡 Belum punya template? Download template Excel di menu Pengaturan → Template Excel
          </div>
        </div>
      )}

      {/* STEP: PREVIEW */}
      {step === "preview" && preview && (
        <div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            📄 <strong style={{ color: C.white }}>{file?.name}</strong>
          </div>

          {/* Summary cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <SummaryCard icon="🐾" label="Hewan"    count={preview.hewan.data.length}    errors={preview.hewan.errors.length}    color={C.gold} />
            <SummaryCard icon="💳" label="Mudhohi"  count={preview.mudhohi.data.length}  errors={preview.mudhohi.errors.length}  color={C.blue} />
            <SummaryCard icon="🎟️" label="Mustahiq" count={preview.mustahiq.data.length} errors={preview.mustahiq.errors.length} color={C.orange} />
          </div>

          {/* Errors */}
          {totalErrors > 0 && (
            <div style={{ marginBottom: 16 }}>
              <ErrorList errors={preview.hewan.errors}    label="Hewan" />
              <ErrorList errors={preview.mudhohi.errors}  label="Mudhohi" />
              <ErrorList errors={preview.mustahiq.errors} label="Mustahiq" />
              <div style={{ fontSize: 12, color: C.orange, padding: "8px 12px", background: "#3B1A0022", borderRadius: 8, border: `1px solid ${C.orange}33` }}>
                ⚠️ Baris yang error akan <strong>dilewati</strong>. Hanya {totalImport} data valid yang akan diimport.
              </div>
            </div>
          )}

          {totalImport === 0 && (
            <div style={{ color: C.red, fontSize: 14, textAlign: "center", padding: 16 }}>
              ❌ Tidak ada data valid yang bisa diimport.
            </div>
          )}

          {/* Mode pilihan */}
          {totalImport > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={css.label}>Mode Import</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { val: "append", icon: "➕", label: "Tambahkan ke data yang ada" },
                  { val: "replace", icon: "🔄", label: "Ganti semua data (hapus yang lama)" },
                ].map(m => (
                  <button
                    key={m.val}
                    onClick={() => setMode(m.val)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                      background: mode === m.val ? (m.val === "replace" ? C.red + "22" : C.green + "22") : "#0A0D09",
                      border: `1px solid ${mode === m.val ? (m.val === "replace" ? C.red : C.green) : C.border}`,
                      color: mode === m.val ? (m.val === "replace" ? C.red : C.greenLight) : C.muted,
                      fontSize: 12, fontWeight: mode === m.val ? 700 : 400,
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              {mode === "replace" && (
                <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>
                  ⚠️ Semua data hewan, mudhohi, dan mustahiq yang sudah ada akan dihapus!
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn color={C.muted} onClick={() => setStep("upload")} style={{ flex: 1 }}>← Kembali</Btn>
            {totalImport > 0 && (
              <Btn color={mode === "replace" ? C.red : C.green} onClick={doImport} style={{ flex: 2 }}>
                {mode === "replace" ? "⚠️" : "✅"} Import {totalImport} Data
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* STEP: DONE */}
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: C.white, marginBottom: 8 }}>Import Berhasil!</h3>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
            {preview.hewan.data.length} hewan · {preview.mudhohi.data.length} mudhohi · {preview.mustahiq.data.length} mustahiq berhasil diimport.
          </div>
          <Btn color={C.green} onClick={onClose} style={{ width: "100%" }}>Tutup</Btn>
        </div>
      )}
    </Modal>
  );
}


// ══════════════════════════════════════════════════════════════
// CARA INTEGRASI KE App.jsx
// ══════════════════════════════════════════════════════════════
//
// 1. Copy komponen ImportExcelModal ke App.jsx
//
// 2. Install SheetJS:
//    npm install xlsx
//    Lalu tambahkan di atas App.jsx:
//    import * as XLSX from 'xlsx';
//
// 3. Di SettingsPage atau halaman manapun, tambahkan state:
//    const [showImport, setShowImport] = useState(false);
//
// 4. Tambahkan tombol Import:
//    <Btn color={C.blue} onClick={() => setShowImport(true)}>
//      📥 Import dari Excel
//    </Btn>
//
// 5. Tambahkan modal:
//    {showImport && (
//      <ImportExcelModal
//        onClose={() => setShowImport(false)}
//        onImport={(hasil) => {
//          setHewan(hasil.hewan);
//          setMudhohi(hasil.mudhohi);
//          setMustahiq(hasil.mustahiq);
//          setShowImport(false);
//        }}
//        existingHewan={hewan}
//        existingMudhohi={mudhohi}
//        existingMustahiq={mustahiq}
//        session={session}
//        addLog={addLog}
//      />
//    )}
//
// 6. (Opsional) Tombol download template di Pengaturan:
//    Simpan file template_qurban.xlsx di /public/,
//    lalu buat link:
//    <a href="/template_qurban.xlsx" download>
//      📋 Download Template Excel
//    </a>
// ══════════════════════════════════════════════════════════════
