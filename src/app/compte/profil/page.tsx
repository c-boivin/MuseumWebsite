import type { Metadata } from "next";
import { AccountForm } from "@/components/account/AccountForm";
import { DeleteAccountPanel } from "@/components/account/DeleteAccountPanel";
import { Hero } from "@/components/sections/Hero";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { featuredArtworks } from "@/data/featured-artworks";
import { getAccount } from "@/lib/account";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/lib/account-actions";
import { countFavorites } from "@/lib/favorites";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mon profil",
};

/**
 * Les réglages du compte : informations, mot de passe, suppression.
 *
 * Server Component malgré trois formulaires : les champs sont rendus ici et
 * traversent `AccountForm` en `children`, seul l'état de la réponse est client.
 * C'est ce qui permet à `ui/Field` de rester non contrôlé.
 *
 * Les valeurs affichées viennent de la base et non de la session :
 * `requireUser()` sert à savoir QUI, `getAccount()` à savoir QUOI. La session
 * est mémoïsée le temps de la requête, elle réafficherait l'ancien nom juste
 * après l'avoir changé.
 *
 * Trois formulaires et pas un seul : un bouton « Enregistrer » commun aurait
 * demandé le mot de passe actuel pour changer son nom, et mêlé une action
 * réversible à celle qui ne l'est pas.
 */
export default async function AccountSettingsPage() {
  const user = await requireUser();

  /* En parallèle : deux requêtes vers la même base, mais indépendantes. */
  const [account, favoriteCount] = await Promise.all([
    getAccount(user.id),
    countFavorites(user.id),
  ]);

  /* Le compte a disparu entre la validation de la session et cette lecture —
     une suppression depuis un autre onglet. Mieux vaut ne rien afficher que des
     champs vides qui ressembleraient à un compte sans nom. */
  if (!account) return null;

  /* « mars 2026 » et non une date complète : le jour n'apprend rien. `Intl`
     évite d'écrire une table de noms de mois et de se tromper sur les accords. */
  const memberSince = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  /* Zéro n'est pas « 0 œuvre » : un compteur à zéro se lit comme un défaut
     d'affichage alors que c'est un état normal. */
  const collectionSize =
    favoriteCount === 0
      ? "Aucune œuvre pour le moment"
      : `${favoriteCount} œuvre${favoriteCount > 1 ? "s" : ""}`;

  return (
    <>
      {/* Un vrai Hero, contrairement à « Ma collection » : cette page n'a rien à
          montrer d'autre que des formulaires, et un titre seul au-dessus de trois
          champs laissait toute la moitié droite vide. « Ma collection » garde son
          en-tête compact parce que ce qui suit son titre EST une grille d'œuvres.

          `height` à `auto` : c'est une page où l'on vient faire quelque chose,
          une accroche plein écran obligerait à défiler avant le premier champ. */}
      <Hero
        eyebrow="Votre compte"
        title="Mon profil"
        lead="Vos informations, votre mot de passe, et la suppression de votre compte."
        image={featuredArtworks["the-creation-of-adam"]}
        /* Le geste des deux mains est au milieu de la fresque. */
        imagePosition="center"
        /* `banner` et non le 4/3 des pages intérieures : la fresque fait 2,2:1.
           Un 4/3 lui retirerait 40 % de sa largeur, un 16/9 encore 19 %. C'est
           la seule page intérieure dans ce cas, parce que c'est la seule
           fresque. */
        imageRatio="banner"
        /* Le bouton que toutes les autres accroches ont : d'ici, la seule chose
           qu'on puisse vouloir faire ailleurs est d'aller regarder ses œuvres. */
        action={{ label: "Voir ma collection", href: "/compte/collection" }}
      >
        {/* Ce qui remplit la colonne, et ce n'est pas du remplissage : ces deux
            informations n'existent nulle part ailleurs sur le site.

            Même motif que le cartel d'une œuvre — libellé à gauche, valeur à
            droite, filets entre les lignes. */}
        <dl className="divide-y divide-line border-line border-t">
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
            <dt className="text-ink-mute text-sm">Membre depuis</dt>
            <dd className="text-ink text-sm">{memberSince}</dd>
          </div>

          <div className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
            <dt className="text-ink-mute text-sm">Votre collection</dt>
            {/* `tabular-nums` : la colonne ne tressaute pas d'une visite à
                l'autre. */}
            <dd className="text-ink text-sm tabular-nums">{collectionSize}</dd>
          </div>
        </dl>
      </Hero>

      <Section>
        {/* Deux colonnes, et c'est une question de largeur de champ autant que de
            place perdue : empilés, les filets des champs s'étiraient sur toute la
            largeur pour n'accueillir qu'un nom de trois lettres. Un champ dont le
            trait fait quatre fois la longueur de ce qu'on y écrit ne se lit plus
            comme un champ.

            `items-start` : les colonnes n'ont pas la même hauteur dès qu'un
            message s'affiche sous l'une d'elles, et la plus courte s'étirerait
            en décrochant son bouton de ses champs. */}
        <div className="grid grid-cols-2 items-start gap-16">
          <section>
            <Heading as="h2" size="heading">
              Vos informations
            </Heading>

            <AccountForm action={updateProfileAction} submitLabel="Enregistrer">
              <Field
                label="Nom"
                name="name"
                autoComplete="name"
                defaultValue={account.name}
                required
              />

              <Field
                label="Adresse e-mail"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={account.email}
                required
              />
            </AccountForm>
          </section>

          <section>
            <Heading as="h2" size="heading">
              Mot de passe
            </Heading>

            <AccountForm
              action={changePasswordAction}
              submitLabel="Modifier le mot de passe"
            >
              <Field
                label="Mot de passe actuel"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />

              <Field
                label="Nouveau mot de passe"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                /* La même règle que Better Auth applique de son côté : le bouton
                   reste éteint au lieu de laisser partir une demande refusée. */
                minLength={8}
                required
              />
            </AccountForm>
          </section>
        </div>

        {/* Sous les deux colonnes et sur toute la largeur : la placer en colonne
            l'aurait rendue aussi ordinaire que « changer son nom », alors que
            c'est la seule action irréversible du site. */}
        <DeleteAccountPanel className="mt-20" />
      </Section>
    </>
  );
}
