import { useState, useCallback, memo, FormEvent, Dispatch, SetStateAction } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useDispatch } from "react-redux"; // 👈 1. Importar useDispatch
import { setAuthData } from "../store/slices/authSlice"; // 👈 2. Importar setAuthData (ajusta la ruta según tu estructura)

const API_URL = "http://localhost:5000/api/auth";

interface AuthProps {
  setToken: Dispatch<SetStateAction<string | null>>;
}

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    discriminator?: string;
  };
  message?: string;
}

const MemoizedGoogleLogin = memo(({
  onSuccess,
  onError,
}: {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: () => void;
}) => {
  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      theme="filled_dark"
      shape="circle"
      useOneTap={false}
    />
  );
});

MemoizedGoogleLogin.displayName = "MemoizedGoogleLogin";

export const Auth = ({ setToken }: AuthProps) => {
  const dispatch = useDispatch(); // 👈 3. Inicializar dispatch
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const endpoint = isRegister ? `${API_URL}/register` : `${API_URL}/login`;
    const bodyData = isRegister ? { name, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al procesar la solicitud");
      }

      // 💡 Actualizar Redux de inmediato
      dispatch(setAuthData({ token: data.token, user: data.user as any }));
      setToken(data.token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    }
  };

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      try {
        setError("");
        if (!credentialResponse.credential) {
          setError("No se obtuvo la credencial de Google");
          return;
        }

        const res = await fetch(`${API_URL}/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        });

        const data: AuthResponse = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al iniciar sesión con Google");
          return;
        }

        // 💡 Actualizar Redux de inmediato para redirigir al instante
        dispatch(setAuthData({ token: data.token, user: data.user as any }));
        setToken(data.token);
      } catch (err) {
        setError("Error de conexión al autenticar con Google");
      }
    },
    [dispatch, setToken]
  );

  const handleGoogleError = useCallback(() => {
    setError("Falló la autenticación con Google");
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-dark-card border border-dark-border rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
        {isRegister ? "Crear una cuenta" : "Iniciar Sesión"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-dark-input text-white border border-dark-border rounded-xl focus:outline-none focus:border-brand transition-colors text-sm placeholder:text-slate-500"
          />
        )}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-dark-input text-white border border-dark-border rounded-xl focus:outline-none focus:border-brand transition-colors text-sm placeholder:text-slate-500"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-dark-input text-white border border-dark-border rounded-xl focus:outline-none focus:border-brand transition-colors text-sm placeholder:text-slate-500"
        />

        <button
          type="submit"
          className="w-full mt-2 bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-medium py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer"
        >
          {isRegister ? "Registrarse" : "Ingresar"}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="grow border-t border-dark-border"></div>
        <span className="px-3 text-xs text-slate-500 uppercase font-semibold">o</span>
        <div className="grow border-t border-dark-border"></div>
      </div>

      <div className="flex justify-center">
        <MemoizedGoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes cuenta?"}{" "}
        <button
          type="button"
          className="text-brand hover:underline font-semibold ml-1 cursor-pointer transition-colors"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
        >
          {isRegister ? "Inicia Sesión" : "Regístrate"}
        </button>
      </p>
    </div>
  );
};