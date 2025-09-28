import { useState } from "react";
import { authService } from "../services/auth";
import { useNavigate } from "react-router-dom"; // Si usas React Router

// Función auxiliar para validar longitud en bytes UTF-8
function utf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Usar solo si tienes Router

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación del límite de bcrypt (72 bytes UTF-8)
    if (utf8ByteLength(password) > 72) {
      setError("La contraseña no debe exceder los 72 caracteres o bytes en UTF-8.");
      return;
    }

    const res = await authService.login(username, password);
    if (res.success) {
      navigate("/dashboard"); // O window.location.href = "/dashboard";
    } else {
      setError(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Usuario"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      <button type="submit">Iniciar sesión</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}

export default LoginPage;