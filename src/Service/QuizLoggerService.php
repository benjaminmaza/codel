<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\RequestStack;

class QuizLoggerService
{
    private string $logPath;
    private RequestStack $requestStack;

    public function __construct(RequestStack $requestStack)
    {
        $this->requestStack = $requestStack;
        $this->logPath = __DIR__ . '/../../public/logs/quiz_activity.log';
    }

    public function log(string $eventType, string $details): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $ip = $request ? $request->getClientIp() : 'unknown';
        $sessionId = $request && $request->getSession() ? 
            substr($request->getSession()->getId(), 0, 8) : 'no-session';
        
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = sprintf(
            "[%s] [%s] [%s] %s: %s\n",
            $timestamp,
            $ip,
            $sessionId,
            $eventType,
            $details
        );

        file_put_contents($this->logPath, $logEntry, FILE_APPEND | LOCK_EX);
    }

    public function logQuestionDisplayed(int $questionId): void
    {
        $this->log('QUESTION_DISPLAYED', "Question {$questionId} displayed");
    }

    public function logAnswerSubmitted(int $questionId, string $answer, bool $isCorrect): void
    {
        $status = $isCorrect ? 'correct' : 'incorrect';
        $this->log('ANSWER_SUBMITTED', "Question {$questionId} answered '{$answer}' ({$status})");
    }

    public function logQuestionValidated(int $questionId): void
    {
        $this->log('QUESTION_VALIDATED', "Question {$questionId} validated, moving to next");
    }

    public function logQuizCompleted(): void
    {
        $this->log('QUIZ_COMPLETED', "Quiz completed successfully");
    }

    public function logSessionResumed(int $questionId): void
    {
        $this->log('SESSION_RESUMED', "Session resumed at question {$questionId}");
    }

    public function logFeedback(string $feedback): void
    {
        $this->log('FEEDBACK_SUBMITTED', "User feedback: {$feedback}");
    }

    public function logButtonClick(string $buttonName, string $page): void
    {
        $this->log('BUTTON_CLICKED', "Button '{$buttonName}' clicked on page '{$page}'");
    }
}