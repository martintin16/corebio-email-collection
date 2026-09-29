// Pila compartida de "capas modales" abiertas ahora mismo (Dialog,
// ConfirmDialog, ComposeModalShell, y los menús flotantes tipo
// TemplatePicker/SendSplitButton) para que un solo Escape cierre nada más
// que la que está más arriba.
//
// Sin esto, dos capas anidadas — "Gestionar Drive" dentro de "Editar
// permisos", o el diálogo de confirmar plantilla dentro del modal de
// Redactar — escuchan Escape cada una por su cuenta (cada un/component con
// su propio addEventListener("keydown", ...) en document) y las cierra a
// las dos juntas con un solo toque, abandonando de paso lo que hubiera más
// abajo (ej. un envío en curso).
//
// Es un array a nivel de módulo, no contexto de React, a propósito: estas
// capas no viven en el mismo árbol de componentes (ComposeModalShell y el
// Dialog de TemplatePicker no son padre-hijo directos en términos de
// dónde se declaran), así que un Context no las conectaría sin prop
// drilling. Solo importa mientras la pestaña está abierta — no hace falta
// persistir nada.
let stack: symbol[] = [];

export function pushDialogLayer(id: symbol) {
  stack.push(id);
}

export function popDialogLayer(id: symbol) {
  stack = stack.filter((s) => s !== id);
}

export function isTopDialogLayer(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}
