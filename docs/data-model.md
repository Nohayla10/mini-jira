# Modèle de données MongoDB

## Collections

| Collection | Rôle |
|---|---|
| `users` | Comptes utilisateurs |
| `projects` | Projets, avec leurs membres et leurs rôles (documents imbriqués) |
| `sprints` | Sprints d'un projet |
| `tickets` | Stories, bugs et tâches |
| `comments` | Commentaires des tickets |
| `notifications` | Notifications des utilisateurs |

## Choix de conception

- **Membres imbriqués dans `projects`** : on lit toujours les membres avec le projet, et leur nombre reste limité.
- **Commentaires dans une collection séparée** : ils peuvent devenir nombreux, et cela évite de recharger tout le ticket à chaque ajout.
- **`completedAt` sur les tickets** : nécessaire pour calculer le burndown chart.
- **`order` sur les tickets** : sauvegarde l'ordre du backlog après un glisser-déposer.
- **Mots de passe** : hashés avec bcrypt, jamais stockés en clair.

## Index

| Collection | Index | Raison |
|---|---|---|
| `users` | `email` (unique) | Connexion et unicité |
| `projects` | `members.user` | Lister les projets d'un utilisateur |
| `tickets` | `project`, `sprint`, `assignee` | Filtrage du backlog et du tableau |
| `sprints` | `project`, `status` | Retrouver le sprint actif |
| `notifications` | `user`, `read` | Afficher les non lues |

## Règles métier

- Un projet a un seul sprint `ACTIVE` à la fois.
- Un ticket appartient à un seul sprint, ou à aucun (il est alors dans le backlog).
- Seul le Product Owner peut inviter des membres et changer les rôles.
- À la clôture d'un sprint, les tickets non terminés retournent au backlog (`sprint = null`).

## API REST (version initiale)

Toutes les routes, sauf `register` et `login`, exigent un token JWT dans l'en-tête `Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter (renvoie un JWT) |
| GET | `/api/auth/me` | Utilisateur connecté |
| GET | `/api/projects` | Mes projets |
| POST | `/api/projects` | Créer un projet |
| GET | `/api/projects/:id` | Détails d'un projet |
| POST | `/api/projects/:id/members` | Inviter un membre |
| PATCH | `/api/projects/:id/members/:userId` | Changer un rôle |
| GET | `/api/projects/:id/tickets` | Tickets du projet |
| POST | `/api/projects/:id/tickets` | Créer un ticket |
| PATCH | `/api/tickets/:id` | Modifier un ticket (statut, sprint, assigné) |
| DELETE | `/api/tickets/:id` | Supprimer un ticket |
| GET | `/api/projects/:id/sprints` | Sprints du projet |
| POST | `/api/projects/:id/sprints` | Créer un sprint |
| PATCH | `/api/sprints/:id/start` | Démarrer un sprint |
| PATCH | `/api/sprints/:id/complete` | Clôturer un sprint |
| GET | `/api/tickets/:id/comments` | Commentaires d'un ticket |
| POST | `/api/tickets/:id/comments` | Commenter un ticket |
| GET | `/api/notifications` | Mes notifications |
| PATCH | `/api/notifications/:id/read` | Marquer une notification comme lue |

### Exemple : inscription

**Requête** `POST /api/auth/register`

```json
{
  "name": "Nohayla",
  "email": "nohayla@exemple.com",
  "password": "motdepasse123"
}
```

**Réponse** `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "6650f1a2c3b4d5e6f7a8b9c0",
    "name": "Nohayla",
    "email": "nohayla@exemple.com"
  }
}
```

### Exemple : créer un ticket

**Requête** `POST /api/projects/:id/tickets`

```json
{
  "title": "Créer un compte",
  "description": "En tant qu'utilisateur, je veux créer un compte.",
  "type": "STORY",
  "priority": "HIGHEST",
  "storyPoints": 3
}
```

**Réponse** `201 Created`

```json
{
  "id": "6650f1a2c3b4d5e6f7a8b9c1",
  "title": "Créer un compte",
  "status": "TODO",
  "priority": "HIGHEST",
  "storyPoints": 3,
  "sprint": null
}
```

### Codes de réponse utilisés

| Code | Signification |
|---|---|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides |
| 401 | Non authentifié (token absent ou invalide) |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 409 | Conflit (par exemple, email déjà utilisé) |