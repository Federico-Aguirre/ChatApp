import { User } from "../../types/chat";

interface ContactListProps {
  contacts: User[];
  onRemoveContact: (contactId: string) => void;
  onOpenAddModal: () => void;
  onSelectContact: (contact: User) => void;
  unreadUsers: string[]; // Recibe los IDs de usuarios con mensajes no leídos
}

export const ContactList = ({
  contacts,
  onRemoveContact,
  onOpenAddModal,
  onSelectContact,
  unreadUsers,
}: ContactListProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Contactos ({contacts.length})
        </span>
        <button
          onClick={onOpenAddModal}
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded transition"
        >
          + Agregar
        </button>
      </div>

      <div className="space-y-1">
        {contacts.length === 0 ? (
          <p className="text-xs text-slate-500 px-1">Sin contactos aún</p>
        ) : (
          contacts.map((contact) => {
            // Comprobamos si este contacto nos ha enviado un mensaje que no hemos leído
            const hasUnread = contact._id && unreadUsers.includes(contact._id);

            return (
              <div
                key={contact._id}
                onClick={() => onSelectContact(contact)}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {contact.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* 🔥 Si hay mensaje sin leer, ponemos el texto en blanco y negrita */}
                  <span
                    className={`text-sm truncate group-hover:text-white transition-colors ${
                      hasUnread ? "font-bold text-white" : "font-medium text-slate-200"
                    }`}
                  >
                    {contact.name}
                  </span>
                  {/* 🔥 PUNTITO NARANJA ANIMADO PARA DMs */}
                  {hasUnread && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 ml-1 animate-pulse"></span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contact._id) onRemoveContact(contact._id);
                  }}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition px-1"
                  title="Eliminar contacto"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};