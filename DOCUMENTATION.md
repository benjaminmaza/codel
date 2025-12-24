# Documentation ABxDating Quiz Application

## 📋 Vue d'ensemble

Application web Symfony permettant de créer une expérience de quiz personnalisé et sécurisé avec 10 questions sur mesure. L'application utilise un système de tokens pour sécuriser la navigation et empêcher la manipulation des URLs.

## 🏗️ Architecture

### Structure des dossiers
```
/var/www/html/quizz/
├── src/
│   ├── Controller/
│   │   ├── HomeController.php      # Controller original (route /old-home)
│   │   └── QuizController.php      # Controller principal du quiz
│   └── Service/
│       └── QuizLoggerService.php   # Service de logging des activités
├── templates/
│   ├── base.html.twig              # Template de base avec header
│   └── quiz/
│       ├── start.html.twig         # Page d'accueil du quiz
│       ├── question.html.twig      # Page des questions
│       └── success.html.twig       # Page de succès finale
├── public/
│   ├── css/
│   │   └── quiz.css               # Styles CSS complets
│   ├── js/
│   │   └── quiz.js                # Logique JavaScript
│   └── logs/
│       └── quiz_activity.log      # Fichier de logs des activités
```

## 🛠️ Composants principaux

### QuizController.php
**Localisation :** `src/Controller/QuizController.php`

**Routes disponibles :**
- `GET /` → Page d'accueil du quiz
- `GET /quiz/question/{id}/{token}` → Affichage d'une question (sécurisé)
- `POST /quiz/submit` → Soumission des réponses
- `GET /quiz/success` → Page de succès

**Méthodes importantes :**
- `generateQuestionToken()` : Génère des tokens sécurisés basés sur session + date
- `getAllowedQuestion()` : Détermine la question autorisée pour l'utilisateur
- `validateAnswer()` : Valide les réponses avec logique flexible

**Configuration des questions :**
```php
private array $questions = [
    1 => [
        'text' => 'La chanson qu\'on chante sur le mini toit ?',
        'answers' => ['escalier']
    ],
    // ... 10 autres questions
    11 => [
        'text' => 'Texte long avec <br> pour sauts de ligne...',
        'answers' => ['anais', 'anaïs', 'moi']
    ]
];
```

### QuizLoggerService.php
**Localisation :** `src/Service/QuizLoggerService.php`

**Événements loggés :**
- `QUESTION_DISPLAYED` : Affichage d'une question
- `ANSWER_SUBMITTED` : Réponse soumise (correcte/incorrecte)
- `QUESTION_VALIDATED` : Passage à la question suivante
- `QUIZ_COMPLETED` : Quiz terminé avec succès
- `SESSION_RESUMED` : Reprise d'une session

**Format des logs :**
```
[YYYY-MM-DD HH:MM:SS] [IP_ADDRESS] [SESSION_ID] EVENT_TYPE: Details
```

### quiz.js
**Localisation :** `public/js/quiz.js`

**Fonctionnalités principales :**
- Gestion des événements sur tous les boutons
- Validation des formulaires avec AJAX
- Navigation sécurisée avec tokens
- Réinitialisation automatique des champs
- Animations et transitions

**Classes et méthodes :**
```javascript
class ABxDatingQuiz {
    handleAnswerSubmit()     // Soumission AJAX des réponses
    revealFinalMessage()     // Révélation du message final
    clearProgress()          // Reset du LocalStorage
    // ...
}
```

## 🔐 Système de sécurité

### Tokens sécurisés
- **Génération :** Hash SHA256 basé sur `session_id + question_id + secret_date`
- **Validation :** Vérification côté serveur avant affichage des questions
- **Protection :** Impossible d'accéder aux questions non autorisées

### Contrôle de progression
- **Session serveur :** `quiz_progress` stocke la progression autorisée
- **Validation :** Redirection automatique si tentative d'accès non autorisé
- **Reset :** Paramètre `?reset=1` pour réinitialiser la session

## 🎨 Design et UX

### Palette de couleurs
```css
--primary-coral: #FF6B6B
--secondary-lavender: #C7CEEA
--accent-gold: #E8B4B8
--neutral-cream: #F7F3E9
--neutral-charcoal: #2D3748
```

### Composants visuels
- **Header sticky** avec logo ABxDating et slogan
- **Barre de progression** animée
- **Animations CSS** (confettis, transitions, effets hover)
- **Design responsive** mobile-first

### Questions spéciales
- **Question 8 :** Accepte toutes les réponses (`*`)
- **Question 11 :** Texte long avec classe CSS spéciale `question-text-long`

## 📝 Modification des questions

### Ajouter/Modifier une question
1. **Éditer** `src/Controller/QuizController.php`
2. **Modifier** le tableau `$questions`
3. **Format requis :**
```php
id => [
    'text' => 'Texte de la question (HTML autorisé avec |raw)',
    'answers' => ['réponse1', 'réponse2', 'moi'] // ou ['*'] pour toutes
]
```

### Logique de validation
- **Insensible à la casse :** `strtolower()` appliqué
- **Recherche partielle :** `strpos()` pour trouver les mots dans la réponse
- **Réponses multiples :** Tableau d'options acceptées
- **Wildcard :** `*` accepte toute réponse non vide

## 🔧 Maintenance

### Logs et monitoring
- **Fichier :** `public/logs/quiz_activity.log`
- **Permissions :** 664 (lecture/écriture web server)
- **Rotation :** Manuelle (surveiller la taille)

### Cache Symfony
```bash
php bin/console cache:clear --env=prod
```

### Debugging
- **Logs d'activité :** Consulter `quiz_activity.log`
- **Sessions :** Vérifier `$_SESSION['quiz_progress']`
- **JavaScript :** Console navigateur pour erreurs AJAX

## 🚀 Déploiement

### Prérequis
- PHP 8.1+
- Symfony 6.4+
- Permissions écriture sur `public/logs/`
- Sessions PHP activées

### URLs de production
- **Base :** `http://172.27.222.144/quizz/public/`
- **Questions :** `http://172.27.222.144/quizz/public/quiz/question/{id}/{token}`
- **Soumission :** `http://172.27.222.144/quizz/public/quiz/submit`

### Configuration serveur
- **Document root :** `/var/www/html/quizz/public/`
- **Réécriture :** `.htaccess` configuré pour Symfony
- **Sessions :** Durée par défaut PHP

## 🐛 Problèmes courants

### Boutons ne fonctionnent pas
- **Cause :** JavaScript non chargé ou erreurs console
- **Solution :** Vérifier `quiz.js`, F12 pour erreurs

### URLs invalides
- **Cause :** Manipulation manuelle des URLs
- **Solution :** Le système redirige automatiquement vers la question autorisée

### Session perdue
- **Cause :** Cookies désactivés ou session expirée
- **Solution :** Recommencer le quiz avec `?reset=1`

### Permissions logs
```bash
chmod 664 public/logs/quiz_activity.log
chown www-data:www-data public/logs/quiz_activity.log
```

## 📞 Contact et Support

**Développeur :** Claude (Anthropic)
**Version :** 1.0
**Date :** Septembre 2024

**Commandes utiles :**
```bash
# Vider le cache
php bin/console cache:clear

# Voir les routes
php bin/console debug:router

# Vérifier les logs
tail -f public/logs/quiz_activity.log
```

---

Cette documentation couvre tous les aspects techniques nécessaires pour maintenir et modifier l'application ABxDating quiz.