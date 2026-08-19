import { useState } from "react";
import { AtSign } from "lucide-react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (userTag: string) => Promise<string | void>;
}

export const AddContactModal = ({
  isOpen,
  onClose,
  onAddContact,
}: AddContactModalProps) => {
  const [userTag, setUserTag] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userTag.trim()) return;

    const errorMsg = await onAddContact(userTag.trim());
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setUserTag("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Agregar Contacto</h2>
        <p className="text-xs text-slate-400 mb-4">
          Puedes agregar un amigo usando su nombre de usuario y su #etiqueta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Usuario y #ID
            </label>
            <div className="relative flex items-center">
              <AtSign size={16} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                value={userTag}
                onChange={(e) => setUserTag(e.target.value)}
                placeholder="ej. Usuario#1234"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setError("");
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition"
            >
              Enviar solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};