"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  TextColorIcon,
  BulletListIcon,
  OrderedListIcon,
  LinkIcon,
  ClearFormatIcon,
} from "@/components/icons";
import { ToolbarButton } from "@/components/compose/toolbar-button";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";
import { cn } from "@/lib/utils";

// Paleta fija de 5 colores, no un selector libre: un color "random" que la
// persona elija en la app puede terminar siendo ilegible según el cliente
// de mail que lo reciba (Gmail, Outlook, etc. no son consistentes
// renderizando estilos). Con una paleta acotada nos aseguramos de que todo
// lo que se puede elegir ya fue probado que se ve bien.
const TEXT_COLORS = ["#18181B", "#DC2626", "#0F766E", "#92400E", "#1E40AF"];
const URL_PATTERN = /^https?:\/\/.+/i;

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Escribí tu mensaje...",
  disabled = false,
  invalid = false,
  describedBy,
}: RichTextEditorProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Antes estos dos popovers se posicionaban con position:absolute dentro
  // de la barra de herramientas, que tiene overflow-x-auto para poder
  // scrollear horizontalmente en mobile (ver comentario más abajo). Un
  // absolute adentro de un contenedor con overflow queda recortado por
  // ese mismo contenedor, así que el popover aparecía "escondido" y había
  // que scrollear el toolbar (en vertical, encima) para verlo. Floating UI
  // + FloatingPortal, mismo patrón que ActionsMenu/TemplatePicker/
  // SendSplitButton, lo saca del toolbar y lo renderiza al final del
  // <body>, sin quedar recortado por nada.
  const colorFloating = useFloating({
    open: colorOpen,
    onOpenChange: setColorOpen,
    placement: "bottom-start",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const linkFloating = useFloating({
    open: linkOpen,
    onOpenChange: setLinkOpen,
    placement: "bottom-start",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const colorLayerId = useRef<symbol>();
  if (!colorLayerId.current) colorLayerId.current = Symbol("color-picker");
  const linkLayerId = useRef<symbol>();
  if (!linkLayerId.current) linkLayerId.current = Symbol("link-picker");

  useEffect(() => {
    if (!colorOpen) return;
    const id = colorLayerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, [colorOpen]);

  useEffect(() => {
    if (!linkOpen) return;
    const id = linkLayerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, [linkOpen]);

  useEffect(() => {
    if (!colorOpen) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const reference = colorFloating.refs.reference.current;
      const floating = colorFloating.refs.floating.current;
      const clickedReference = reference instanceof HTMLElement && reference.contains(target);
      const clickedFloating = floating instanceof HTMLElement && floating.contains(target);
      if (!clickedReference && !clickedFloating) setColorOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(colorLayerId.current!)) setColorOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorOpen, colorFloating.refs.reference, colorFloating.refs.floating]);

  useEffect(() => {
    if (!linkOpen) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const reference = linkFloating.refs.reference.current;
      const floating = linkFloating.refs.floating.current;
      const clickedReference = reference instanceof HTMLElement && reference.contains(target);
      const clickedFloating = floating instanceof HTMLElement && floating.contains(target);
      if (!clickedReference && !clickedFloating) setLinkOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(linkLayerId.current!)) setLinkOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkOpen, linkFloating.refs.reference, linkFloating.refs.floating]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        id: id ?? "",
        class: "min-h-[140px] py-2 text-sm leading-relaxed text-gray-900",
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    },
    immediatelyRender: false,
  });

  // Deshabilitar/habilitar el editor completo (ej. mientras se envía) sin
  // perder el contenido tipeado.
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Si el valor externo cambia por algo que no fue la persona tipeando acá
  // (ej. RHF resetea el form, o se inserta una plantilla), sincronizamos
  // el editor con ese valor sin generar un loop con onUpdate.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  function toggleLink() {
    if (editor!.isActive("link")) {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    setLinkUrl("");
    setColorOpen(false);
    setLinkOpen((v) => !v);
  }

  const linkUrlValid = URL_PATTERN.test(linkUrl.trim());

  function applyLink() {
    if (!linkUrlValid) return;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    setLinkOpen(false);
  }

  return (
    <div>
      {/* overflow-x-auto en vez de un menú "más" aparte: con solo 8
          botones, dejarlos todos visibles y que la barra scrollee
          horizontalmente en mobile es más simple de usar (nada escondido
          detrás de un tap extra) que agregar otro popover para manejar. */}
      <div
        role="toolbar"
        aria-label="Formato de texto"
        className={cn(
          "mb-1 flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-2",
          disabled && "pointer-events-none opacity-40"
        )}
      >
        <ToolbarButton
          label="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Subrayado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div ref={colorFloating.refs.setReference} className="relative">
          <ToolbarButton
            label="Color de texto"
            active={colorOpen}
            onClick={() => {
              setLinkOpen(false);
              setColorOpen((v) => !v);
            }}
          >
            <TextColorIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          {colorOpen && (
            <FloatingPortal>
              <div
                ref={colorFloating.refs.setFloating}
                style={colorFloating.floatingStyles}
                className="z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white p-2 shadow-md"
              >
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setColorOpen(false);
                    }}
                    className="h-[18px] w-[18px] rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setColorOpen(false);
                  }}
                  className="ml-1 text-[10px] text-gray-400 transition-colors hover:text-gray-600"
                >
                  Quitar
                </button>
              </div>
            </FloatingPortal>
          )}
        </div>

        <span className="mx-1 h-4 w-px shrink-0 bg-gray-200" />

        <ToolbarButton
          label="Lista con viñetas"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <BulletListIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div ref={linkFloating.refs.setReference} className="relative">
          <ToolbarButton
            label={editor.isActive("link") ? "Quitar enlace" : "Insertar enlace"}
            active={linkOpen || editor.isActive("link")}
            onClick={toggleLink}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          {linkOpen && (
            <FloatingPortal>
              <div
                ref={linkFloating.refs.setFloating}
                style={linkFloating.floatingStyles}
                className="z-50 w-56 rounded-md border border-gray-200 bg-white p-2.5 shadow-md"
              >
                <label className="mb-1 block text-[10px] text-gray-500">URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://ejemplo.com"
                  aria-invalid={linkUrl.length > 0 && !linkUrlValid}
                  className={cn(
                    "w-full rounded-md border px-2 py-1 text-xs text-gray-800 outline-none",
                    linkUrl.length > 0 && !linkUrlValid ? "border-danger" : "border-gray-300"
                  )}
                />
                {linkUrl.length > 0 && !linkUrlValid && (
                  <p role="alert" className="mt-1 text-[10px] text-danger">
                    Ingresá una URL con http:// o https://
                  </p>
                )}
                <button
                  type="button"
                  disabled={!linkUrlValid}
                  onClick={applyLink}
                  className="mt-2 w-full rounded-md bg-primary-700 py-1 text-[11px] font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  Insertar
                </button>
              </div>
            </FloatingPortal>
          )}
        </div>

        <span className="mx-1 h-4 w-px shrink-0 bg-gray-200" />

        <ToolbarButton
          label="Quitar formato"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <ClearFormatIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
