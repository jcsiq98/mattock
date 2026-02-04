import { useState } from 'react';
import {
  ClipboardDocumentCheckIcon,
  CameraIcon,
  DocumentArrowDownIcon,
  WifiIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/useAppStore';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const features = [
  {
    icon: ClipboardDocumentCheckIcon,
    title: 'Custom Templates',
    description: 'Create reusable checklists for different property types',
    color: 'bg-blue-500',
  },
  {
    icon: CameraIcon,
    title: 'Photo Evidence',
    description: 'Capture and annotate photos with timestamps and location',
    color: 'bg-purple-500',
  },
  {
    icon: DocumentArrowDownIcon,
    title: 'PDF Reports',
    description: 'Generate professional PDF reports to share',
    color: 'bg-green-500',
  },
  {
    icon: WifiIcon,
    title: 'Works Offline',
    description: 'Full functionality even without internet connection',
    color: 'bg-amber-500',
  },
];

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { inspectorName, setInspectorName } = useAppStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(inspectorName);

  const totalSteps = 3;

  function handleNext() {
    if (step === 1 && name.trim()) {
      setInspectorName(name.trim());
    }
    
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-fade-in">
            {/* Logo */}
            <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-subtle">
              <svg className="w-14 h-14 text-white" viewBox="0 0 100 100" fill="none">
                <path
                  d="M25 70V35l25-15 25 15v35l-25 15-25-15z"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="50" r="8" fill="currentColor" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to<br />Property Inspector
            </h1>
            <p className="text-white/80 text-lg max-w-xs mx-auto">
              The smarter way to conduct and document property inspections
            </p>
          </div>
        )}

        {/* Step 1: Enter Name */}
        {step === 1 && (
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What's your name?</h2>
              <p className="text-white/70">This will appear on your inspection reports</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur border-2 border-white/20 text-white placeholder-white/50 text-lg focus:outline-none focus:border-white/50 transition-colors"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Features */}
        {step === 2 && (
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">What you can do</h2>
              <p className="text-white/70">Everything you need for property inspections</p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 space-y-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-white'
                  : i < step
                  ? 'w-2 bg-white/80'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={step === 1 && !name.trim()}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            step === 1 && !name.trim()
              ? 'bg-white/20 text-white/50 cursor-not-allowed'
              : 'bg-white text-primary-700 hover:bg-white/90 active:scale-[0.98]'
          }`}
        >
          {step === totalSteps - 1 ? (
            <>
              Get Started
              <CheckIcon className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ArrowRightIcon className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

