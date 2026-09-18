import { cn } from "@/lib/cn";

/**
 * Repères du monogramme, en unités du viewBox (une grille de 40 × 40).
 *
 * Chaque rectangle s'écrit `[x, y, largeur, hauteur]`. Les mettre dans un tableau
 * plutôt que d'aligner quatorze balises <rect> permet de lire la géométrie d'un
 * coup d'œil, et surtout de la corriger sans risque : l'épaisseur du trait (2) et
 * la longueur des équerres (5) reviennent partout, un chiffre changé au mauvais
 * endroit se verrait immédiatement.
 *
 * La figure est un cadre de cadrage — quatre équerres d'angle, deux traits
 * médians en haut et en bas, deux points sur les côtés. C'est le repère qu'on
 * trace autour d'une image avant de l'accrocher, et c'est ce motif que le site
 * reprend autour des reproductions (voir <Frame />).
 *
 * POURQUOI DES GROUPES ET NON UNE LISTE PLATE. Le dessin ne change pas d'un iota
 * — un SVG affiche les mêmes rectangles quel que soit leur regroupement. Mais
 * l'animation du preloader, elle, en dépend entièrement.
 *
 * Une ÉQUERRE est faite de deux rectangles, un horizontal et un vertical. En
 * liste plate, ces deux-là sont deux cibles distinctes pour GSAP : dans une
 * animation en `stagger`, le bras horizontal d'un angle s'allume, puis le bras
 * vertical du MÊME angle un instant plus tard. L'angle se casse en deux au lieu
 * de se comporter comme un coin, et l'effet de rotation devient un scintillement
 * illisible. C'était le défaut de la première version.
 *
 * Regroupés, on obtient HUIT repères autour du cadre — quatre angles, deux
 * médians, deux points — dans le sens des aiguilles d'une montre. Un `stagger`
 * GSAP suit l'ordre du tableau : une onde qui les parcourt dans cet ordre tourne
 * vraiment autour du « m ». Ne pas réordonner, ne pas aplatir.
 */
const MARK_GROUPS = [
  /* Équerre haut-gauche */
  [
    [4, 4, 5, 2],
    [4, 4, 2, 5],
  ],
  /* Trait médian haut */
  [[15, 4, 10, 2]],
  /* Équerre haut-droite */
  [
    [31, 4, 5, 2],
    [34, 4, 2, 5],
  ],
  /* Point médian droit */
  [[34, 19, 2, 2]],
  /* Équerre bas-droite */
  [
    [31, 34, 5, 2],
    [34, 31, 2, 5],
  ],
  /* Trait médian bas */
  [[15, 34, 10, 2]],
  /* Équerre bas-gauche */
  [
    [4, 34, 5, 2],
    [4, 31, 2, 5],
  ],
  /* Point médian gauche */
  [[4, 19, 2, 2]],
] as const;

interface LogoProps {
  /** Taille du carré. Passer un utilitaire Tailwind en rem (`size-9`, `size-12`). */
  className?: string;
  /**
   * Classe posée sur chacun des HUIT repères du cadre — pas sur chaque
   * rectangle : une équerre compte pour un seul repère, voir MARK_GROUPS.
   *
   * C'est ce qui évite de redessiner le monogramme dans le preloader : il reste
   * un seul fichier qui connaît la géométrie du logo, et l'animation s'y
   * accroche de l'extérieur.
   */
  markClassName?: string;
}

/**
 * Monogramme du musée : un « m » dans un cadre de cadrage.
 *
 * SVG INLINE, et non un fichier dans `public/`. Trois raisons, dans l'ordre
 * d'importance :
 *
 * 1. LA COULEUR. Le logo est dessiné en `currentColor` : il devient clair dans le
 *    header sombre et sombre partout ailleurs, sans deuxième fichier à maintenir.
 *    Un PNG à fond noir aurait laissé un carré visible sur tout fond non noir.
 * 2. LE « m » EST DU TEXTE, rendu dans la police d'affichage du site
 *    (Instrument Serif). Le logo suit donc l'identité typographique au lieu de la
 *    figer dans une image — et il reste net à n'importe quelle taille.
 * 3. Aucune requête réseau, aucun décalage de mise en page au chargement.
 *
 * `aria-hidden` : la figure ne dit rien qu'un lecteur d'écran puisse annoncer.
 * C'est au lien qui l'enveloppe de porter le nom du musée (voir Header).
 */
export function Logo({ className, markClassName }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("size-9", className)}
    >
      {/* Un <g> par repère, même quand il ne contient qu'un rectangle : c'est ce
          groupe qui est la cible d'animation, et il doit exister pour les huit
          sinon l'onde sauterait les médians et les points. */}
      {MARK_GROUPS.map((group) => (
        <g key={group[0].join("-")} className={markClassName}>
          {group.map(([x, y, width, height]) => (
            <rect
              key={`${x}-${y}-${width}-${height}`}
              x={x}
              y={y}
              width={width}
              height={height}
            />
          ))}
        </g>
      ))}

      {/* `y` n'est PAS le centre du carré : une minuscule se centre sur sa
          hauteur d'x, pas sur sa ligne de base. 24.3 place le « m » optiquement
          au milieu du cadre — 20 l'aurait fait flotter en haut.

          La taille est en unités du viewBox, donc proportionnelle au carré : le
          logo se met à l'échelle d'un bloc, sans rien à réajuster. */}
      <text
        x="20"
        y="24.3"
        textAnchor="middle"
        fontSize="19"
        className="font-display"
      >
        m
      </text>
    </svg>
  );
}
