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
 * ── SERVER COMPONENT, MALGRÉ TROIS FORMULAIRES ──
 * Les champs sont rendus ici, sur le serveur, et traversent `AccountForm` en
 * `children`. Seul l'état de la réponse est client. C'est le même découpage que
 * les pages de connexion, et c'est ce qui permet à `ui/Field` de rester un champ
 * non contrôlé — la saisie appartient au navigateur, pas à React.
 *
 * ── LES VALEURS AFFICHÉES VIENNENT DE LA BASE, PAS DE LA SESSION ──
 * `requireUser()` sert à savoir QUI, `getAccount()` à savoir QUOI. La nuance
 * compte après un enregistrement : la session est mémoïsée le temps de la
 * requête, elle réafficherait donc l'ancien nom juste après l'avoir changé.
 * Détail dans `lib/session.ts` et `lib/account.ts`.
 *
 * ── TROIS BLOCS, TROIS FORMULAIRES, ET PAS UN SEUL ──
 * Réunir le nom, le mot de passe et la suppression sous un même bouton
 * « Enregistrer » aurait demandé le mot de passe actuel pour changer son nom, et
 * mêlé une action réversible à celle qui ne l'est pas. Chaque bloc a donc son
 * propre envoi et son propre message — c'est aussi ce qui permet à un échec sur
 * l'un de ne rien dire des deux autres.
 */
export default async function AccountSettingsPage() {
  const user = await requireUser();

  /* En parallèle : deux requêtes vers la même base, mais indépendantes l'une de
     l'autre. Enchaînées, la page attendrait la somme de leurs temps de réponse. */
  const [account, favoriteCount] = await Promise.all([
    getAccount(user.id),
    countFavorites(user.id),
  ]);

  /* Le compte a disparu entre la validation de la session et cette lecture —
     une suppression depuis un autre onglet. `requireUser` renvoie alors vers la
     connexion au prochain rendu ; en attendant, mieux vaut ne rien afficher que
     des champs vides qui ressembleraient à un compte sans nom. */
  if (!account) return null;

  /* « mars 2026 », pas une date complète : le jour exact n'apprend rien, et le
     mois suffit à dire depuis quand on fréquente le musée. `Intl` évite d'écrire
     une table de noms de mois à la main — et de se tromper sur les accords. */
  const memberSince = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  /* Zéro n'est pas « 0 œuvre » : c'est une phrase à part, parce qu'un compteur à
     zéro se lit comme un défaut d'affichage alors que c'est un état normal — on
     vient de créer son compte. */
  const collectionSize =
    favoriteCount === 0
      ? "Aucune œuvre pour le moment"
      : `${favoriteCount} œuvre${favoriteCount > 1 ? "s" : ""}`;

  return (
    <>
      {/* UN VRAI HERO, comme les autres pages intérieures du site, et non
          l'en-tête nu qu'utilise « Ma collection ».

          La différence entre les deux pages de l'espace compte le justifie :
          celle-ci n'a rien à montrer d'autre que des formulaires, et un titre
          seul au-dessus de trois champs laissait toute la moitié droite de
          l'écran vide — sur un site de musée, c'est-à-dire l'endroit où l'œil
          cherche une œuvre. « Ma collection », elle, garde son en-tête compact :
          ce qui suit son titre EST une grille d'œuvres, et une accroche
          illustrée les repousserait sous la ligne de flottaison (même
          raisonnement que `/collection`).

          `height` laissé à `auto` plutôt qu'à `screen` comme sur la
          Billetterie : c'est une page où l'on vient FAIRE quelque chose. Une
          accroche plein écran obligerait à faire défiler avant d'atteindre le
          premier champ. */}
      <Hero
        eyebrow="Votre compte"
        title="Mon profil"
        lead="Vos informations, votre mot de passe, et la suppression de votre compte."
        image={featuredArtworks["the-creation-of-adam"]}
        /* `center` : le geste des deux mains est au milieu de la fresque, et
           c'est lui qu'on vient voir. */
        imagePosition="center"
        /* `banner`, et non le 4/3 des pages intérieures : la fresque fait 2,2:1.
           Un 4/3 lui retirerait 40 % de sa largeur, un 16/9 encore 19 % — Adam
           d'un côté, les anges de l'autre. En 21/9, le cadre est presque celui
           de l'œuvre : 6 % de hauteur en moins, sur du fond. C'est la seule page
           intérieure dans ce cas, parce que c'est la seule fresque du site. */
        imageRatio="banner"
        /* LE BOUTON QUE TOUTES LES AUTRES ACCROCHES ONT, et que celle-ci était
           seule à ne pas avoir. Il mène à l'autre page de l'espace : d'ici, la
           seule chose qu'on puisse vouloir faire ailleurs est d'aller regarder
           ses œuvres. */
        action={{ label: "Voir ma collection", href: "/compte/collection" }}
      >
        {/* CE QUI REMPLIT LA COLONNE, et ce n'est pas du remplissage : ces deux
            informations n'existent nulle part ailleurs sur le site. La date
            d'inscription n'est affichée par aucune autre page, et le nombre
            d'œuvres mises de côté ne se lit sinon qu'en allant les compter.

            Même motif que le cartel d'une œuvre (`artwork/ArtworkMeta`) —
            libellé à gauche, valeur à droite, filets entre les lignes : sur un
            site de musée, une liste d'informations se présente d'une seule
            façon. */}
        <dl className="divide-y divide-line border-line border-t">
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
            <dt className="text-ink-mute text-sm">Membre depuis</dt>
            <dd className="text-ink text-sm">{memberSince}</dd>
          </div>

          <div className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
            <dt className="text-ink-mute text-sm">Votre collection</dt>
            {/* `tabular-nums` : les chiffres gardent la même largeur d'un compte
                à l'autre, donc la colonne ne tressaute pas d'une visite à la
                suivante. */}
            <dd className="text-ink text-sm tabular-nums">{collectionSize}</dd>
          </div>
        </dl>
      </Hero>

      <Section>
        {/* DEUX COLONNES, ET C'EST UNE QUESTION DE LARGEUR DE CHAMP autant que
            de place perdue. Empilés sur une seule colonne de lecture, les deux
            formulaires laissaient toute la moitié droite de l'écran vide ; mais
            le vrai défaut était le filet des champs, étiré sur toute cette
            largeur pour n'accueillir qu'un nom de trois lettres. Un champ dont
            le trait fait quatre fois la longueur de ce qu'on y écrit ne se lit
            plus comme un champ.

            Côte à côte, chaque formulaire retrouve une largeur de saisie juste,
            et les deux se lisent d'un coup d'œil au lieu de s'enchaîner.

            `items-start` : les deux colonnes n'ont pas la même hauteur dès
            qu'un message de retour s'affiche sous l'une d'elles. Sans ça, la
            plus courte s'étirerait pour s'aligner sur l'autre et son bouton
            décrocherait de ses champs. */}
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
                /* La même règle que Better Auth applique de son côté, posée aussi
                 sur le champ : le bouton reste alors éteint au lieu de laisser
                 partir une demande qui reviendra refusée. */
                minLength={8}
                required
              />
            </AccountForm>
          </section>
        </div>

        {/* SOUS LES DEUX COLONNES ET SUR TOUTE LA LARGEUR : la suppression n'est
            pas un troisième réglage qu'on mettrait à côté des autres. La placer
            en colonne l'aurait rendue aussi ordinaire que « changer son nom »,
            alors que c'est la seule action irréversible du site. En dessous, et
            séparée par un filet, elle se rencontre après les autres — dans
            l'ordre où l'on y pense. */}
        <DeleteAccountPanel className="mt-20" />
      </Section>
    </>
  );
}
