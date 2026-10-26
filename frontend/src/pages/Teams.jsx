import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const box = {
  background: "#121218",
  border: "1px solid #222",
  borderRadius: 14,
};

const inputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #333",
  background: "#0f0f14",
  color: "white",
  width: "100%",
};

const btnRed = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#d90429",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          background: "#0b0b0f",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 16,
          color: "white",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGhost}>Close</button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit

  const emptyForm = {
    _id: "",
    code: "",
    name: "",
    country: "",
    horsepower: 900,
    engineSupplier: "",
  };

  const [form, setForm] = useState(emptyForm);

  async function loadTeams() {
    const res = await api.get("/teams");
    setTeams(res.data);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await api.get("/teams");
        if (!cancelled) setTeams(res.data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load teams");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, []);

  function openCreate() {
    setMode("create");
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(t) {
    setMode("edit");
    setForm({
      _id: t._id,
      code: t.code,
      name: t.name,
      country: t.country,
      horsepower: t.carSpecs?.horsepower ?? 900,
      engineSupplier: t.carSpecs?.engineSupplier ?? "",
    });
    setOpen(true);
  }

  async function submit() {
    try {
      setErr("");

      const payload = {
        code: form.code.toUpperCase(), // 🔥 uppercase constraint
        name: form.name,
        country: form.country,
        carSpecs: {
          horsepower: Number(form.horsepower), // 🔥 max validated in schema
          engineSupplier: form.engineSupplier,
        },
        metadata: {
          createdFromUI: true,
        },
      };

      if (!payload.code || !payload.name) {
        throw new Error("Code and Name are required");
      }

      if (mode === "create") {
        await api.post("/teams", payload);
      } else {
        await api.put(`/teams/${form._id}`, payload);
      }

      setOpen(false);
      await loadTeams();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Save failed");
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h1 style={{ color: "white", margin: 0 }}>Teams</h1>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={btnRed}>+ Add Team</button>
      </div>

      <div style={{ color: "#9a9a9a", marginBottom: 14 }}>
        Teams stored in MongoDB (uppercase code, JSON fields, numeric validation)
      </div>

      {err && <div style={{ color: "#ff6b6b", marginBottom: 10 }}>{err}</div>}

      <div style={box}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 160px 140px 120px",
            padding: 12,
            color: "#9a9a9a",
            fontWeight: 800,
          }}
        >
          <div>Code</div>
          <div>Name</div>
          <div>Country</div>
          <div>HP</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 12, color: "white" }}>Loading...</div>
        ) : (
          teams.map((t) => (
            <div
              key={t._id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 160px 140px 120px",
                padding: 12,
                borderTop: "1px solid #222",
                color: "white",
              }}
            >
              <div style={{ fontWeight: 900 }}>{t.code}</div>
              <div>{t.name}</div>
              <div>{t.country}</div>
              <div>{t.carSpecs?.horsepower}</div>
              <div>
                <button onClick={() => openEdit(t)} style={btnGhost}>Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Add Team" : "Edit Team"}
        onClose={() => setOpen(false)}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder="Code (ex: FER)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} />
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="Horsepower" value={form.horsepower} onChange={(e) => setForm({ ...form, horsepower: e.target.value })} style={inputStyle} />
          <input placeholder="Engine Supplier" value={form.engineSupplier} onChange={(e) => setForm({ ...form, engineSupplier: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={submit} style={btnRed}>Save</button>
          <button onClick={() => setOpen(false)} style={btnGhost}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
