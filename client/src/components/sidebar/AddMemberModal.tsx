import { useState, FormEvent } from "react";
import { User, Channel } from "../../types/chat";
import { UserPlus, X } from "lucide-react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onAddMember: (channelId: string, userTag: string) => Promise<{ success: boolean; message?: string }>;
}

export const AddMemberModal = ({
  isOpen,
  onClose,
  channel,
  onAddMember,
}: AddMemberModalProps) => {
  const [userTag, setUserTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !channel) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userTag.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await onAddMember(channel._id, userTag.trim());

    setLoading(false);
    if (result.success) {
      setSuccess(`Usuario "${userTag}" agregado correctamente a #${channel.name}`);
      setUserTag("");
    } else {
      setError(result.message || "No se pudo agregar al usuario.");
    }
  };

  const handleClose = () => {
    setUserTag("");
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-400" />
            Agregar a #{channel.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Etiqueta de usuario
            </label>
            <input
              type="text"
              value={userTag}
              onChange={(e) => setUserTag(e.target.value)}
              placeholder="Ejemplo#1234"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/50 border border-rose-800/50 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 p-2.5 rounded-lg">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !userTag.trim()}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition shadow"
            >
              {loading ? "Buscando..." : "Agregar usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};