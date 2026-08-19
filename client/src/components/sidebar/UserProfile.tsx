import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";

interface User {
  _id?: string;
  name?: string;
  discriminator?: string;
  avatar?: string;
}

interface UserProfileProps {
  currentUser?: User | null;
  user?: User | null;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser: propCurrentUser,
  user: propUser,
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const storeUser = useAppSelector((state) => state.auth.currentUser);

  const [copied, setCopied] = useState(false);

  // Prioriza props explícitas si existen, de lo contrario consume directo de Redux
  const user = propCurrentUser || propUser || storeUser;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-800 text-white rounded-lg border border-slate-700">
        <span className="text-xs text-slate-400">Sin sesión</span>
        <button
          onClick={handleLogout}
          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded transition font-medium"
        >
          Salir
        </button>
      </div>
    );
  }

  const userName = user.name || "Usuario";
  const userDiscriminator = user.discriminator || "0000";
  const fullTag = `${userName}#${userDiscriminator}`;

  const handleCopyTag = () => {
    navigator.clipboard.writeText(fullTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs leading-tight truncate">
            {userName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            #{userDiscriminator}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleCopyTag}
          className={`text-[11px] px-2 py-1 rounded transition-all font-medium ${
            copied
              ? "bg-green-600 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-slate-200"
          }`}
          title="Copiar tag completo"
        >
          {copied ? "✓" : "Copiar"}
        </button>

        <button
          onClick={handleLogout}
          className="text-[11px] bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition font-medium"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </div>
  );
};

export default UserProfile;