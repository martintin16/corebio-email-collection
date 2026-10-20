export interface ContactGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
}

// Contactos y grupos de una casilla, cargados una sola vez y compartidos
// entre el autocompletado del campo "Para" y el diálogo "Elegir desde
// contactos" (ver RecipientInput).
export interface ContactsDirectory {
  status: "idle" | "loading" | "loaded" | "error";
  groups: ContactGroup[];
  contacts: Contact[];
}

// Un grupo elegido entero (todos sus miembros tildados) — en el campo "Para"
// se agrega como un solo chip colapsado, no como N chips sueltos.
export interface PickedGroup {
  id: string;
  name: string;
  members: Contact[];
}

// Lo que devuelve el diálogo al apretar "Agregar".
export interface PickedRecipients {
  groups: PickedGroup[];
  // Contactos tildados que no quedaron cubiertos por un grupo completo.
  contacts: Contact[];
}
