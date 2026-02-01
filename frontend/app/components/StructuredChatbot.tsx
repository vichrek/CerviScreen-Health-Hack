import { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  type: 'bot' | 'user' | 'question';
  timestamp: Date;
  questionNumber?: number;
  totalQuestions?: number;
}

interface QuestionAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
  timestamp: Date;
}

interface StructuredChatbotProps {
  onComplete: (answers: QuestionAnswer[]) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'checkbox' | 'short-text' | 'yes-no';
  options?: string[];
  required: boolean;
}

const questions: Question[] = [
  {
    id: 'symptoms',
    text: 'Are you currently experiencing any of the following symptoms? (Select all that apply)',
    type: 'checkbox',
    options: [
      'Unusual vaginal bleeding (between periods or after menopause)',
      'Abnormal vaginal discharge',
      'Pelvic pain or discomfort',
      'Pain during intercourse',
      'No symptoms - routine screening',
    ],
    required: true,
  },
  {
    id: 'bleeding-details',
    text: 'If you selected unusual bleeding, when did you first notice this?',
    type: 'short-text',
    required: false,
  },
  {
    id: 'previous-screening',
    text: 'Have you had cervical screening before?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'previous-abnormal',
    text: 'Have you ever had an abnormal cervical screening result?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'hpv-vaccine',
    text: 'Have you received the HPV vaccine?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'sexual-activity',
    text: 'How would you describe your sexual activity?',
    type: 'multiple-choice',
    options: [
      'Currently sexually active',
      'Not currently sexually active',
      'Prefer not to say',
    ],
    required: false,
  },
  {
    id: 'contraception',
    text: 'Are you currently using any form of contraception?',
    type: 'checkbox',
    options: [
      'Combined pill',
      'Progestogen-only pill',
      'IUD/Coil',
      'Implant',
      'Condoms',
      'None',
      'Prefer not to say',
    ],
    required: false,
  },
  {
    id: 'additional-info',
    text: 'Is there anything else you would like to tell us about your health or symptoms?',
    type: 'short-text',
    required: false,
  },
];

export function StructuredChatbot({ onComplete }: StructuredChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome! I\'ll guide you through a few questions to collect important information for your cervical screening. This will help the clinician provide you with the best care.',
      type: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const questionAddedRef = useRef<Set<number>>(new Set());
  const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(questions.length); // Start with 8

  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = currentQuestionIndex >= questions.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isComplete && !questionAddedRef.current.has(currentQuestionIndex)) {
      // Add next question after a short delay
      questionAddedRef.current.add(currentQuestionIndex);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `q-${currentQuestionIndex}-${Date.now()}`,
          text: currentQuestion.text,
          type: 'question',
          timestamp: new Date(),
          questionNumber: displayedQuestionNumber, // Store the current display number
        }]);
      }, 500);
    }
  }, [currentQuestionIndex, isComplete, currentQuestion.text, displayedQuestionNumber]);

  const handleAnswer = () => {
    if (currentQuestion.required && !currentAnswer) {
      alert('This question is required. Please provide an answer.');
      return;
    }

    if (currentAnswer || !currentQuestion.required) {
      // Save answer
      const answer: QuestionAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: currentAnswer || 'Not provided',
        timestamp: new Date(),
      };
      setAnswers(prev => [...prev, answer]);

      // Add user's answer to messages
      const answerText = Array.isArray(currentAnswer) 
        ? currentAnswer.join(', ') 
        : currentAnswer || 'Not provided';
      
      setMessages(prev => [...prev, {
        id: `a-${currentQuestionIndex}`,
        text: answerText,
        type: 'user',
        timestamp: new Date(),
      }]);

      // Reset current answer
      setCurrentAnswer('');

      // Conditional logic: Skip question 4 if question 3 (previous-screening) is "No"
      let nextQuestionIndex = currentQuestionIndex + 1;
      let isSkippingQuestion = false;
      
      // Question 3 is at index 2 (previous-screening)
      // Question 4 is at index 3 (previous-abnormal)
      if (currentQuestion.id === 'previous-screening' && currentAnswer === 'No') {
        // Skip question 4 (previous-abnormal) and go to question 5 (hpv-vaccine)
        nextQuestionIndex = currentQuestionIndex + 2;
        isSkippingQuestion = true;
        // Update total to reflect that we're skipping one question
        setTotalQuestions(questions.length - 1); // 7 instead of 8
      }

      // Increment displayed question number (only increment by 1 even if skipping internal index)
      setDisplayedQuestionNumber(prev => prev + 1);

      // Move to next question
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        // All questions answered
        const allAnswers = [...answers, answer];
        setMessages(prev => [...prev, {
          id: 'complete',
          text: 'Thank you for completing the screening questions. Your responses have been recorded and will be reviewed by a clinician.',
          type: 'bot',
          timestamp: new Date(),
        }]);
        setTimeout(() => {
          onComplete(allAnswers);
        }, 1500);
      }
    }
  };

  const handleSkip = () => {
    if (!currentQuestion.required) {
      setCurrentAnswer('');
      handleAnswer();
    }
  };

  const renderQuestionInput = () => {
    if (isComplete) return null;

    switch (currentQuestion.type) {
      case 'checkbox':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                <Checkbox
                  id={`option-${index}`}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCurrentAnswer(prev => 
                        Array.isArray(prev) ? [...prev, option] : [option]
                      );
                    } else {
                      setCurrentAnswer(prev => 
                        Array.isArray(prev) ? prev.filter(a => a !== option) : []
                      );
                    }
                  }}
                />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'multiple-choice':
      case 'yes-no':
        const opts = currentQuestion.type === 'yes-no' 
          ? ['Yes', 'No'] 
          : currentQuestion.options || [];
        
        return (
          <RadioGroup 
            value={currentAnswer as string} 
            onValueChange={setCurrentAnswer}
            className="space-y-3"
          >
            {opts.map((option, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                <RadioGroupItem value={option} id={`radio-${index}`} />
                <Label htmlFor={`radio-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'short-text':
        return (
          <Textarea
            value={currentAnswer as string}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px] resize-none"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : message.type === 'question'
                  ? 'bg-purple-100 text-gray-900 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.type === 'question' && (
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">
                    Question {message.questionNumber} of {totalQuestions}
                  </span>
                </div>
              )}
              <p className="text-sm">{message.text}</p>
              {message.type !== 'question' && (
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Current question input */}
        {!isComplete && messages[messages.length - 1]?.type === 'question' && (
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            {renderQuestionInput()}
            
            <div className="flex gap-2 mt-4">
              {!currentQuestion.required && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleAnswer}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Complete'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Questionnaire Complete</p>
              <p className="text-sm text-green-700">Your responses have been saved.</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}