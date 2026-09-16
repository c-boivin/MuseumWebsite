import { cn } from "@/lib/cn";

/**
 * Repères du monogramme, en unités du viewBox (une grille de 40 × 40).
 *
 * Chaque entrée est un rectangle `[x, y, largeur, hauteur]`. Les écrire dans un
 * tableau plutôt que d'aligner quatorze balises <rect> permet de lire la
 * géométrie d'un coup d'œil, et surtout de la corriger sans risque : l'épaisseur
 * du trait (2) et la longueur des équerres (5) reviennent partout, un chiffre
 * changé au mauvais endroit se verrait immédiatement.
 *
 * La figure est un cadre de cadrage — quatre équerres d'angle, deux traits
 * médians en haut et en bas, deux points sur les côtés. C'est le repère qu'on
 * trace autour d'une image avant de l'accrocher, et c'est ce motif que le site
 * reprend autour des reproductions (voir <Frame />).
 */
const MARKS = [
  /* Équerre haut-gauche */
  [4, 4, 5, 2],
  [4, 4, 2, 5],
  /* Équerre haut-droite */
  [31, 4, 5, 2],
  [34, 4, 2, 5],
  /* Équerre bas-gauche */
  [4, 34, 5, 2],
  [4, 31, 2, 5],
  /* Équerre bas-droite */
  [31, 34, 5, 2],
  [34, 31, 2, 5],
  /* Traits médians haut et bas */
  [15, 4, 10, 2],
  [15, 34, 10, 2],
  /* Points médians gauche et droite */
  [4, 19, 2, 2],
  [34, 19, 2, 2],
] as const;

interface LogoProps {
  /** Taille du carré. Passer un utilitaire Tailwind en rem (`size-9`, `size-12`). */
  className?: string;
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
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("size-9", className)}
    >
      {MARKS.map(([x, y, width, height]) => (
        <rect
          key={`${x}-${y}-${width}-${height}`}
          x={x}
          y={y}
          width={width}
          height={height}
        />
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
