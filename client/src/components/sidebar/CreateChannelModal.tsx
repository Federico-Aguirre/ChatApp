import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { createChannel } from "../../store/slices/chatSlice";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel?: (name: string) => void;
}

export const CreateChannelModal = ({
  isOpen,
  onClose,
  onCreateChannel,
}: CreateChannelModalProps) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

    if (formattedName) {
      if (onCreateChannel) {
        onCreateChannel(formattedName);
      } else {
        const userId = currentUser?._id || (currentUser as unknown as { id: string })?.id;
        if (userId) {
          dispatch(createChannel({ name: formattedName, createdBy: userId }));
        }
      }
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Crear nuevo canal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. proyectos"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};