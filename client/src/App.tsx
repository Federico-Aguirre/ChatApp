import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchChannels, fetchUsers } from "./store/slices/chatSlice";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Chat } from "./components/Chat";
import { Auth } from "./components/Login";
import { AppWrapper } from "./components/AppWrapper";

function App() {
  const dispatch = useAppDispatch();
  const { token, currentUser } = useAppSelector((state) => state.auth);
  const [isServerWakingUp, setIsServerWakingUp] = useState(false);

  const userId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

  // Detecta en tiempo real si Render está tardando en despertar
  useEffect(() => {
    // Si la respuesta tarda más de 2.5 segundos, activamos el aviso
    const timer = setTimeout(() => {
      setIsServerWakingUp(true);
    }, 2500);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Petición ligera para verificar el estado de la API
    fetch(apiUrl)
      .catch(() => {}) // Ignorar errores temporales de red
      .finally(() => {
        // En cuanto el servidor responde (despierta), cancelamos el temporizador y ocultamos el cartel
        clearTimeout(timer);
        setIsServerWakingUp(false);
      });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token && userId) {
      dispatch(fetchChannels(userId));
      dispatch(fetchUsers());
    }
  }, [token, userId, dispatch]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      {/* Banner dinámico: Solo aparece si Render tarda más de 2.5s y desaparece solo al conectar */}
      {isServerWakingUp && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-center gap-2 shrink-0 text-center transition-all">
          <Zap size={16} className="text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong className="text-amber-200 font-semibold">Conectando con el servidor:</strong> La instancia gratuita de Render se está despertando (puede tomar ~30 segundos). Este aviso desaparecerá en cuanto conecte.
          </span>
        </div>
      )}

      {!token ? (
        <AppWrapper isAuth={false}>
          <Auth setToken={() => {}} />
        </AppWrapper>
      ) : (
        <AppWrapper isAuth={true}>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <Chat />
          </div>
        </AppWrapper>
      )}
    </div>
  );
}

export default App;