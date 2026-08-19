import { ReactNode } from "react";

interface AppWrapperProps {
  children: ReactNode;
  isAuth: boolean;
}

export const AppWrapper = ({ children, isAuth }: AppWrapperProps) => {
  // === VISTA AUTENTICADA (Layout tipo Discord) ===
  if (isAuth) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {children}
      </div>
    );
  }

  // === VISTA NO AUTENTICADA (Pantalla de Login) ===
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg z-10">
        <h1 className="text-base md:text-xl font-bold text-white tracking-wide">
          Chat App{" "}
          <span className="text-xs font-normal text-slate-400 ml-1">
            By Federico Aguirre
          </span>
        </h1>
        {/* Eliminamos el botón de cerrar sesión de aquí, 
            ya que solo se muestra cuando isAuth es false */}
      </header>

      {/* Centramos el formulario de login */}
      <main className="flex-1 w-full flex items-center justify-center p-4 md:p-6 bg-slate-950">
        {children}
      </main>
    </div>
  );
};