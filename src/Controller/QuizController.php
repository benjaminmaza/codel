<?php

namespace App\Controller;

use App\Service\QuizLoggerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class QuizController extends AbstractController
{
    private array $questions = [
        1 => [
            'text' => 'Le jour où l\'on s\'est vus pour la première fois ?',
            'answers' => ['20/05/2017', '20-05-2017', '20 05 2017', '20 mai 2017']
        ],
        2 => [
            'text' => 'Le nombre de pays qu\'on a vus ensemble ?',
            'answers' => ['6', 'six']
        ],
        3 => [
            'text' => 'Un groupe qu\'on adorait tous les deux avant de se connaître ?',
            'answers' => ['strokes', 'the strokes']
        ],
        4 => [
            'text' => 'L\'expression qui te définit le mieux pour moi (comment je t\'appelle) ?',
            'answers' => ['mou', 'légendaire', 'mou légendaire']
        ],
    ];

    private QuizLoggerService $logger;

    public function __construct(QuizLoggerService $logger)
    {
        $this->logger = $logger;
    }

    #[Route('/', name: 'quiz_start')]
    public function start(Request $request): Response
    {
        // Réinitialiser le quiz si demandé
        $session = $request->getSession();
        if ($request->query->get('reset') === '1') {
            $session->remove('quiz_progress');
        }
        
        // Générer le token pour la première question
        $firstToken = $this->generateQuestionToken(1, $session);
        $currentProgress = $this->getAllowedQuestion($session);
        
        return $this->render('quiz/start.html.twig', [
            'firstToken' => $firstToken,
            'currentProgress' => $currentProgress,
            'resumeToken' => $currentProgress > 1 ? $this->generateQuestionToken($currentProgress, $session) : null
        ]);
    }

    #[Route('/quiz/question/{id}/{token}', name: 'quiz_question', requirements: ['id' => '\d+'])]
    public function question(int $id, string $token, Request $request): Response
    {
        if ($id < 1 || $id > 4) {
            return $this->redirectToRoute('quiz_start');
        }

        // Vérifier le token de sécurité
        $expectedToken = $this->generateQuestionToken($id, $request->getSession());
        if ($token !== $expectedToken) {
            return $this->redirectToRoute('quiz_start');
        }

        // Vérifier que l'utilisateur a le droit d'accéder à cette question
        $allowedQuestion = $this->getAllowedQuestion($request->getSession());
        if ($id > $allowedQuestion) {
            $correctToken = $this->generateQuestionToken($allowedQuestion, $request->getSession());
            return $this->redirectToRoute('quiz_question', [
                'id' => $allowedQuestion,
                'token' => $correctToken
            ]);
        }

        $question = $this->questions[$id];
        $this->logger->logQuestionDisplayed($id);

        return $this->render('quiz/question.html.twig', [
            'questionId' => $id,
            'questionText' => $question['text'],
            'totalQuestions' => 4,
            'progress' => round($id / 4 * 100),
            'token' => $token
        ]);
    }

    #[Route('/quiz/submit', name: 'quiz_submit', methods: ['POST'])]
    public function submit(Request $request): JsonResponse
    {
        $questionId = (int) $request->request->get('question_id');
        $answer = trim($request->request->get('answer', ''));

        if ($questionId < 1 || $questionId > 4 || empty($answer)) {
            return new JsonResponse(['success' => false, 'message' => 'Données invalides']);
        }

        $isCorrect = $this->validateAnswer($questionId, $answer);
        $this->logger->logAnswerSubmitted($questionId, $answer, $isCorrect);

        if ($isCorrect) {
            $this->logger->logQuestionValidated($questionId);
            
            // Mettre à jour la progression autorisée
            $session = $request->getSession();
            $session->set('quiz_progress', $questionId + 1);

            if ($questionId === 4) {
                $this->logger->logQuizCompleted();
                return new JsonResponse([
                    'success' => true,
                    'completed' => true,
                    'redirect' => $this->generateUrl('quiz_success')
                ]);
            }

            $nextToken = $this->generateQuestionToken($questionId + 1, $session);
            return new JsonResponse([
                'success' => true,
                'completed' => false,
                'redirect' => $this->generateUrl('quiz_question', [
                    'id' => $questionId + 1,
                    'token' => $nextToken
                ])
            ]);
        }

        return new JsonResponse([
            'success' => false,
            'message' => 'Réponse incorrecte, essaie encore ! 💫'
        ]);
    }

    #[Route('/quiz/success', name: 'quiz_success')]
    public function success(): Response
    {
        return $this->render('quiz/success.html.twig');
    }

    #[Route('/quiz/feedback', name: 'quiz_feedback', methods: ['POST'])]
    public function feedback(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!$data || !isset($data['feedback'])) {
            return new JsonResponse(['success' => false], 400);
        }
        
        $feedbackType = $data['feedback'] === 'positive' ? 'positive' : 'negative';
        $feedbackText = $data['feedback'] === 'positive' ? 'Mais trop (positif)' : 'Mouis, c\'est un peu le malaise (négatif)';
        
        $this->logger->logFeedback($feedbackText);
        
        return new JsonResponse(['success' => true]);
    }

    #[Route('/quiz/gift', name: 'quiz_gift')]
    public function gift(): Response
    {
        return $this->render('quiz/gift.html.twig');
    }

    #[Route('/quiz/log-click', name: 'quiz_log_click', methods: ['POST'])]
    public function logClick(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['button']) || !isset($data['page'])) {
            return new JsonResponse(['success' => false], 400);
        }

        $this->logger->logButtonClick($data['button'], $data['page']);

        return new JsonResponse(['success' => true]);
    }

    #[Route('/quiz/letsgo', name: 'quiz_letsgo')]
    public function letsgo(): Response
    {
        return $this->render('quiz/letsgo.html.twig');
    }

    private function validateAnswer(int $questionId, string $answer): bool
    {
        $question = $this->questions[$questionId];
        $userAnswer = strtolower($answer);

        foreach ($question['answers'] as $validAnswer) {
            if ($validAnswer === '*' || strpos($userAnswer, strtolower($validAnswer)) !== false) {
                return true;
            }
        }

        return false;
    }

    private function generateQuestionToken(int $questionId, $session): string
    {
        $sessionId = $session->getId();
        $secret = 'abxdating_secret_' . date('Y-m-d');
        return hash('sha256', $sessionId . $questionId . $secret);
    }

    private function getAllowedQuestion($session): int
    {
        $progress = $session->get('quiz_progress', 1);
        return min($progress, 4);
    }
}