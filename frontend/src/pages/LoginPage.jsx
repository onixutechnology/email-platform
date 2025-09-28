import { useState } from "react";
import { authService } from "../services/auth";
import { useNavigate } from "react-router-dom";

function utf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (utf8ByteLength(password) > 72) {
      setError("La contraseña no debe exceder los 72 caracteres o bytes en UTF-8.");
      return;
    }
    const res = await authService.login(username, password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="card login-card" style={{
      maxWidth: 420, margin: "40px auto", padding: "2.5rem 2.3rem", boxShadow: "var(--card-shadow)"
    }}>
      <h2 className="card-header" style={{ marginBottom: 24 }}>🔒 Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="input-group" style={{ gap: 15 }}>
        <label className="input-label" htmlFor="user">Usuario</label>
        <input
          id="user"
          type="text"
          className="form-input"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Usuario"
          required
          style={{ fontSize: 18 }}
        />
        <label className="input-label" htmlFor="pass">Contraseña</label>
        <input
          id="pass"
          type="password"
          className="form-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          style={{ fontSize: 18 }}
        />
        <button type="submit" className="button" style={{ width: "100%", fontSize: 18 }}>Acceder</button>
        {error && <div className="toast" style={{ background: "var(--danger)", color: "#fff", marginTop: "0.7em" }}>{error}</div>}
      </form>
      <div style={{ marginTop: '1.2em', color: "#888", fontSize: 14 }}>
        ¿Olvidaste tu contraseña? <a href="/reset" style={{ color: "var(--primary)", textDecoration: "underline" }}>Recupérala aquí</a>
      </div>
    </div>
  );
}

export default LoginPage;