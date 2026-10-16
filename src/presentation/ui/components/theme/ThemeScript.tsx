/**
 * Aplica el modo (claro/oscuro) antes del primer pintado para evitar el parpadeo.
 * Prioridad: la elección guardada del cliente → la preferencia de su sistema.
 */
const script = `(()=>{try{var m=localStorage.getItem("prestige.mode");if(m!=="light"&&m!=="dark"){m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=m}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
