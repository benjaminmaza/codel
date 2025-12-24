# Projet Symfony de base

Ce projet est une base Symfony 6.4 avec Twig, prête à l'emploi pour le développement web.

## Prérequis

- PHP 8.1 ou supérieur
- Composer
- Serveur web Apache avec mod_rewrite activé

## Installation

Le projet est déjà configuré et installé. Le répertoire `public/` doit être la racine web.

Pour une nouvelle installation :

```bash
# Installer les dépendances
composer install

# Définir les permissions correctes
mkdir -p var/cache var/log
chmod -R 777 var/
```

## Configuration

- L'environnement par défaut est `dev` (voir `.env.local`)
- Pour la production, modifiez `.env.local` pour utiliser `APP_ENV=prod` et `APP_DEBUG=0`
- Les connexions à la base de données sont à configurer dans `.env.local` (non nécessaire pour cette version)

## Structure du projet

- `src/` : Code source PHP
- `templates/` : Templates Twig
- `public/` : Fichiers publics et point d'entrée (index.php)
- `config/` : Configuration de l'application

## Utilisation

La page d'accueil est accessible à la racine du site `/`.

## Développement

Pour ajouter de nouvelles pages ou fonctionnalités :

```bash
# Créer un nouveau contrôleur
php bin/console make:controller NomController
```

## Auteur

Votre Nom / Entreprise