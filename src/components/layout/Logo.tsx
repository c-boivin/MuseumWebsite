import { cn } from "@/lib/cn";

/**
 * Repères du monogramme, en unités du viewBox (grille de 40 × 40). Chaque
 * rectangle s'écrit `[x, y, largeur, hauteur]`.
 *
 * La figure est un cadre de cadrage — quatre équerres d'angle, deux traits
 * médians, deux points. C'est le motif que le site reprend autour des
 * reproductions (voir <Frame />).
 *
 * Des groupes et non une liste plate : une équerre est faite de deux rectangles,
 * qui en liste plate sont deux cibles distinctes pour GSAP. Dans un `stagger`,
 * l'angle se casserait en deux au lieu de se comporter comme un coin, et l'effet
 * de rotation deviendrait un scintillement.
 *
 * Regroupés, on a huit repères dans le sens des aiguilles d'une montre, et un
 * `stagger` qui suit l'ordre du tableau tourne vraiment autour du « m ». Ne pas
 * réordonner, ne pas aplatir.
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
   * Classe posée sur chacun des huit repères, pas sur chaque rectangle. C'est ce
   * qui évite de redessiner le monogramme dans le preloader : un seul fichier
   * connaît la géométrie, l'animation s'y accroche de l'extérieur.
   */
  markClassName?: string;
}

/**
 * Monogramme du musée : un « m » dans un cadre de cadrage.
 *
 * SVG inline et non un fichier dans `public/` :
 *
 * 1. dessiné en `currentColor`, il devient clair dans le header sombre sans
 *    deuxième fichier à maintenir ;
 * 2. le « m » est du texte, rendu dans Instrument Serif : le logo suit
 *    l'identité typographique au lieu de la figer, et reste net à toute taille ;
 * 3. aucune requête réseau, aucun décalage au chargement.
 *
 * `aria-hidden` : c'est au lien qui l'enveloppe de porter le nom du musée.
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
      {/* Un <g> par repère même quand il ne contient qu'un rectangle : c'est lui
          la cible d'animation, et il doit exister pour les huit sinon l'onde
          sauterait les médians et les points. */}
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

      {/* 24.3 et non 20 : une minuscule se centre sur sa hauteur d'x, pas sur sa
          ligne de base. La taille est en unités du viewBox, donc le logo se met
          à l'échelle sans rien à réajuster. */}
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
